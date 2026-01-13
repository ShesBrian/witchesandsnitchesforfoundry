const WILLPOWER_CLASS_NAME = "Willpower Caster";
const SORCERY_POINTS_LABEL = "Sorcery Points";
const MODULE_ID = "witchesandsnitchesforfoundry";
const FLAG_SCOPE = "witchesandsnitches";

const BLACK_MAGIC_OPTION_FLAG = "blackMagicOption";
const BLACK_MAGIC_USED_FLAG = "blackMagicUsedTurn";
const GRUDGE_TARGETS_FLAG = "blackMagicGrudges";
const CREATED_SLOTS_FLAG = "createdSlots";
const SIGNATURE_SPELLS_FLAG = "signatureSpells";
const SIGNATURE_USES_FLAG = "signatureSpellUses";
const CLASS_LEVEL_FLAG = "willpowerClassLevel";
const RECKLESS_TURN_FLAG = "recklessTurn";
const RECKLESS_USED_FLAG = "recklessUsed";

const FLEXIBLE_CASTING_COSTS = {
  1: 2,
  2: 3,
  3: 5,
  4: 6,
  5: 7
};

const BLACK_MAGIC_OPTIONS = ["Ambush", "Gambit", "Grudge", "Pique", "Hubris"];

const getWillpowerClassItem = (actor) =>
  actor.items.find((item) => item.type === "class" && item.name === WILLPOWER_CLASS_NAME);

const getWillpowerLevel = (actor) => getWillpowerClassItem(actor)?.system?.levels ?? 0;

const hasWillpowerClass = (actor) => Boolean(getWillpowerClassItem(actor));

const getResourceSlot = (actor, label) => {
  const resources = actor.system?.resources ?? {};
  for (const slot of ["primary", "secondary", "tertiary"]) {
    const resource = resources[slot] ?? {};
    if (!resource.label || resource.label === label) return slot;
  }
  return "primary";
};

const updateSorceryPoints = async (actor) => {
  const level = getWillpowerLevel(actor);
  if (level < 2) return;
  const slot = getResourceSlot(actor, SORCERY_POINTS_LABEL);
  const resource = actor.system?.resources?.[slot] ?? {};
  const max = level;
  await actor.update({
    [`system.resources.${slot}`]: {
      label: SORCERY_POINTS_LABEL,
      max,
      value: Math.min(resource.value ?? max, max),
      sr: true,
      lr: true
    }
  });
};

const getTurnKey = () => {
  if (!game.combat) return null;
  return `${game.combat.round}-${game.combat.turn}`;
};

const promptSelection = async (title, options, count = 1) =>
  new Promise((resolve) => {
    const optionHtml = options
      .map(
        (option) =>
          `<label><input type="${count > 1 ? "checkbox" : "radio"}" name="choice" value="${option.value}"/> ${option.label}</label>`
      )
      .join("<br />");
    new Dialog({
      title,
      content: `<form><div class="form-group">${optionHtml}</div></form>`,
      buttons: {
        ok: {
          label: "Confirm",
          callback: (html) => {
            const values = html
              .find("input[name=choice]:checked")
              .map((_, el) => el.value)
              .get();
            if (count > 1 && values.length !== count) {
              resolve(null);
              return;
            }
            resolve(count > 1 ? values : values[0]);
          }
        }
      },
      default: "ok",
      close: () => resolve(null)
    }).render(true);
  });

const getCreatedSlots = (actor) => actor.getFlag(FLAG_SCOPE, CREATED_SLOTS_FLAG) ?? {};

const setCreatedSlots = async (actor, data) =>
  actor.setFlag(FLAG_SCOPE, CREATED_SLOTS_FLAG, data);

const adjustSpellSlots = async (actor, level, delta) => {
  const slotKey = `spell${level}`;
  const current = actor.system?.spells?.[slotKey];
  if (!current) return;
  const max = Math.max((current.max ?? 0) + delta, 0);
  const value = Math.max((current.value ?? 0) + delta, 0);
  await actor.update({
    [`system.spells.${slotKey}.max`]: max,
    [`system.spells.${slotKey}.value`]: value
  });
};

const spendSorceryPoints = async (actor, cost) => {
  const slot = getResourceSlot(actor, SORCERY_POINTS_LABEL);
  const resource = actor.system?.resources?.[slot] ?? {};
  if (resource.label !== SORCERY_POINTS_LABEL) return false;
  if ((resource.value ?? 0) < cost) return false;
  await actor.update({
    [`system.resources.${slot}.value`]: resource.value - cost
  });
  return true;
};

const gainSorceryPoints = async (actor, amount) => {
  const slot = getResourceSlot(actor, SORCERY_POINTS_LABEL);
  const resource = actor.system?.resources?.[slot] ?? {};
  if (resource.label !== SORCERY_POINTS_LABEL) return false;
  const max = resource.max ?? 0;
  const value = Math.min((resource.value ?? 0) + amount, max);
  await actor.update({ [`system.resources.${slot}.value`]: value });
  return true;
};

const handleFlexibleCasting = async (actor) => {
  const selection = await promptSelection("Flexible Casting", [
    { value: "create", label: "Create Spell Slot" },
    { value: "convert", label: "Convert Spell Slot" }
  ]);
  if (!selection) return;

  if (selection === "create") {
    const options = Object.keys(FLEXIBLE_CASTING_COSTS).map((level) => ({
      value: Number(level),
      label: `Level ${level} (Cost ${FLEXIBLE_CASTING_COSTS[level]} SP)`
    }));
    const level = await promptSelection("Create Spell Slot", options);
    if (!level) return;
    const cost = FLEXIBLE_CASTING_COSTS[level];
    if (!cost) return;
    const spent = await spendSorceryPoints(actor, cost);
    if (!spent) return;
    await adjustSpellSlots(actor, level, 1);
    const created = { ...getCreatedSlots(actor) };
    created[level] = (created[level] ?? 0) + 1;
    await setCreatedSlots(actor, created);
    return;
  }

  const options = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => ({
    value: level,
    label: `Level ${level}`
  }));
  const slotLevel = await promptSelection("Convert Spell Slot", options);
  if (!slotLevel) return;
  const slotKey = `spell${slotLevel}`;
  const current = actor.system?.spells?.[slotKey];
  if (!current || (current.value ?? 0) < 1) return;
  await actor.update({ [`system.spells.${slotKey}.value`]: current.value - 1 });
  await gainSorceryPoints(actor, Number(slotLevel));
};

const ensureBlackMagicOption = async (actor) => {
  const level = getWillpowerLevel(actor);
  if (level < 5) return;
  const existing = actor.getFlag(FLAG_SCOPE, BLACK_MAGIC_OPTION_FLAG);
  if (existing) return;

  const optionItem = actor.items.find((item) =>
    item.name.startsWith("Black Magic Option:")
  );
  if (optionItem) {
    const option = optionItem.name.replace("Black Magic Option: ", "");
    if (BLACK_MAGIC_OPTIONS.includes(option)) {
      await actor.setFlag(FLAG_SCOPE, BLACK_MAGIC_OPTION_FLAG, option);
      return;
    }
  }

  const selection = await promptSelection(
    "Black Magic Option",
    BLACK_MAGIC_OPTIONS.map((option) => ({ value: option, label: option }))
  );
  if (!selection) return;
  await actor.setFlag(FLAG_SCOPE, BLACK_MAGIC_OPTION_FLAG, selection);
};

const ensureSignatureSpells = async (actor) => {
  const level = getWillpowerLevel(actor);
  if (level < 20) return;
  const existing = actor.getFlag(FLAG_SCOPE, SIGNATURE_SPELLS_FLAG);
  if (existing?.length) return;
  const spells = actor.items.filter(
    (item) => item.type === "spell" && item.system?.level === 3
  );
  if (!spells.length) return;

  const options = spells.map((spell) => ({ value: spell.uuid, label: spell.name }));
  const selection = await promptSelection(
    "Signature Spells (Choose Two 3rd-level Spells)",
    options,
    2
  );
  if (!selection) return;
  const uses = {};
  for (const uuid of selection) uses[uuid] = 1;
  await actor.setFlag(FLAG_SCOPE, SIGNATURE_SPELLS_FLAG, selection);
  await actor.setFlag(FLAG_SCOPE, SIGNATURE_USES_FLAG, uses);
};

const blackMagicDiceByLevel = (level) => {
  if (level >= 19) return 10;
  if (level >= 17) return 9;
  if (level >= 15) return 8;
  if (level >= 13) return 7;
  if (level >= 11) return 6;
  if (level >= 9) return 5;
  if (level >= 7) return 4;
  if (level >= 5) return 3;
  if (level >= 3) return 2;
  return 1;
};

const tokenWithin5 = (tokenA, tokenB) =>
  tokenA && tokenB && tokenA.distanceTo(tokenB) <= 5;

const otherEnemyNearTarget = (workflow) => {
  const targetToken = workflow.targets?.first();
  if (!targetToken) return false;
  return canvas.tokens.placeables.some((token) => {
    if (token === targetToken) return false;
    if (token.actor?.system?.attributes?.hp?.value <= 0) return false;
    if (token.actor?.statuses?.has("incapacitated")) return false;
    return (
      tokenWithin5(token, targetToken) &&
      token.document.disposition !== targetToken.document.disposition
    );
  });
};

const noOtherCreaturesNearActor = (actorToken) =>
  !canvas.tokens.placeables.some((token) => {
    if (token === actorToken) return false;
    return tokenWithin5(token, actorToken);
  });

const targetHasActed = (targetToken) => {
  const combatant = game.combat?.getCombatantByToken(targetToken.document.id);
  return combatant?.initiative !== null && game.combat?.turn > combatant?.turn;
};

const wasSurprised = (targetToken) => targetToken?.actor?.statuses?.has("surprised");

const applyRecklessMagic = async (actor) => {
  const existing = actor.effects.find((effect) => effect.name === "Reckless Magic");
  if (existing) await existing.delete();
  await actor.createEmbeddedDocuments("ActiveEffect", [
    {
      name: "Reckless Magic",
      icon: "icons/svg/explosion.svg",
      duration: {
        rounds: 1,
        turns: 1,
        startRound: game.combat?.round ?? 0,
        startTurn: game.combat?.turn ?? 0
      },
      changes: [{ key: "flags.midi-qol.grants.advantage.attack.all", mode: 2, value: 1 }]
    }
  ]);
  await actor.setFlag(FLAG_SCOPE, RECKLESS_TURN_FLAG, getTurnKey());
  await actor.setFlag(FLAG_SCOPE, RECKLESS_USED_FLAG, false);
};

Hooks.on("midi-qol.RollComplete", async (workflow) => {
  const actor = workflow.actor;
  if (!actor || !hasWillpowerClass(actor)) return;
  const macroName = workflow.item?.flags?.["midi-qol"]?.onUseMacroName;
  if (macroName === "willpowerFontOfMagic") {
    await handleFlexibleCasting(actor);
  }
  if (macroName === "willpowerRecklessMagic") {
    await applyRecklessMagic(actor);
  }
});

Hooks.on("midi-qol.preAttackRoll", async (workflow) => {
  const actor = workflow.actor;
  if (!actor || !hasWillpowerClass(actor)) return;

  const recklessTurn = actor.getFlag(FLAG_SCOPE, RECKLESS_TURN_FLAG);
  const recklessUsed = actor.getFlag(FLAG_SCOPE, RECKLESS_USED_FLAG);
  const currentTurn = getTurnKey();
  if (recklessTurn && recklessTurn === currentTurn && !recklessUsed) {
    if (["rsak", "msak"].includes(workflow.item?.system?.actionType)) {
      workflow.advantage = true;
      await actor.setFlag(FLAG_SCOPE, RECKLESS_USED_FLAG, true);
    }
  }

  const option = actor.getFlag(FLAG_SCOPE, BLACK_MAGIC_OPTION_FLAG);
  const targetToken = workflow.targets?.first();

  if (option === "Ambush" && targetToken && !targetHasActed(targetToken)) {
    workflow.advantage = true;
  }

  if (option === "Grudge" && targetToken) {
    const grudge = actor.getFlag(FLAG_SCOPE, GRUDGE_TARGETS_FLAG) ?? [];
    if (grudge.includes(targetToken.actor?.id)) {
      workflow.advantage = true;
    }
  }

  if (option === "Pique") {
    const hp = actor.system?.attributes?.hp;
    if (hp && hp.value <= hp.max / 2) {
      workflow.advantage = true;
    }
  }

  if (option === "Hubris" && targetToken) {
    if (
      (targetToken.actor?.system?.attributes?.hp?.value ?? 0) <
      (actor.system?.attributes?.hp?.value ?? 0)
    ) {
      workflow.advantage = true;
    }
  }
});

Hooks.on("midi-qol.DamageBonus", async (workflow) => {
  const actor = workflow.actor;
  if (!actor || !hasWillpowerClass(actor)) return {};
  const item = workflow.item;
  if (!item) return {};
  const isCantrip = item.type === "spell" && item.system?.level === 0;
  const isMeleeWeapon = item.type === "weapon" && item.system?.actionType === "mwak";
  if (!isCantrip && !isMeleeWeapon) return {};

  const usedTurn = actor.getFlag(FLAG_SCOPE, BLACK_MAGIC_USED_FLAG);
  const currentTurn = getTurnKey();
  if (currentTurn && usedTurn === currentTurn) return {};

  const level = getWillpowerLevel(actor);
  const dice = blackMagicDiceByLevel(level);
  const advantage = workflow.advantage || workflow.attackRoll?.options?.advantage;
  const disadvantage = workflow.disadvantage || workflow.attackRoll?.options?.disadvantage;
  const targetToken = workflow.targets?.first();
  const actorToken = workflow.token ?? actor.getActiveTokens()?.[0];
  const option = actor.getFlag(FLAG_SCOPE, BLACK_MAGIC_OPTION_FLAG);

  let qualifies = advantage || (!disadvantage && otherEnemyNearTarget(workflow));

  if (!qualifies && option === "Gambit" && actorToken && targetToken) {
    const adjacent = tokenWithin5(actorToken, targetToken);
    const alone = noOtherCreaturesNearActor(actorToken);
    if (adjacent && alone && !disadvantage) {
      qualifies = true;
    }
  }

  if (!qualifies && option === "Ambush" && targetToken) {
    if (!targetHasActed(targetToken)) {
      qualifies = true;
    }
    if (wasSurprised(targetToken)) {
      workflow.isCritical = true;
    }
  }

  if (!qualifies && option === "Grudge" && targetToken) {
    const grudge = actor.getFlag(FLAG_SCOPE, GRUDGE_TARGETS_FLAG) ?? [];
    if (grudge.includes(targetToken.actor?.id)) {
      qualifies = true;
    }
  }

  if (!qualifies && option === "Pique") {
    const hp = actor.system?.attributes?.hp;
    if (hp && hp.value <= hp.max / 2) {
      qualifies = true;
    }
  }

  if (!qualifies && option === "Hubris" && targetToken) {
    if (
      (targetToken.actor?.system?.attributes?.hp?.value ?? 0) <
      (actor.system?.attributes?.hp?.value ?? 0)
    ) {
      qualifies = true;
    }
  }

  if (!qualifies) return {};

  if (currentTurn) {
    await actor.setFlag(FLAG_SCOPE, BLACK_MAGIC_USED_FLAG, currentTurn);
  }

  return {
    damageRoll: `${dice}d6`,
    flavor: "Black Magic"
  };
});

Hooks.on("midi-qol.preItemRoll", async (workflow) => {
  const actor = workflow.actor;
  if (!actor || !hasWillpowerClass(actor)) return;
  const item = workflow.item;
  if (!item || item.type !== "spell" || item.system?.level !== 3) return;
  const signatures = actor.getFlag(FLAG_SCOPE, SIGNATURE_SPELLS_FLAG) ?? [];
  if (!signatures.includes(item.uuid)) return;

  const uses = actor.getFlag(FLAG_SCOPE, SIGNATURE_USES_FLAG) ?? {};
  if (!uses[item.uuid]) return;

  uses[item.uuid] = Math.max(uses[item.uuid] - 1, 0);
  await actor.setFlag(FLAG_SCOPE, SIGNATURE_USES_FLAG, uses);
  workflow.consumeSpellSlot = false;
  workflow.config = workflow.config ?? {};
  workflow.config.consumeSpellSlot = false;
});

Hooks.on("dnd5e.damageApplied", (actor, amount, context) => {
  const source = context?.attacker;
  if (!source || !actor || !hasWillpowerClass(actor)) return;
  const existing = actor.getFlag(FLAG_SCOPE, GRUDGE_TARGETS_FLAG) ?? [];
  if (!existing.includes(source.id)) {
    actor.setFlag(FLAG_SCOPE, GRUDGE_TARGETS_FLAG, [...existing, source.id]);
  }
});

Hooks.on("updateCombat", (combat, changed) => {
  if (!changed.turn && changed.turn !== 0) return;
  if (!combat.turns?.length) return;
  const previousTurn = changed.turn === 0 ? combat.turns.length - 1 : changed.turn - 1;
  const previousCombatant = combat.turns[previousTurn];
  const previousActor = previousCombatant?.actor;
  if (previousActor && hasWillpowerClass(previousActor)) {
    previousActor.setFlag(FLAG_SCOPE, GRUDGE_TARGETS_FLAG, []);
  }

  const currentActor = combat.combatant?.actor;
  if (currentActor && hasWillpowerClass(currentActor)) {
    const currentTurn = getTurnKey();
    const recklessTurn = currentActor.getFlag(FLAG_SCOPE, RECKLESS_TURN_FLAG);
    if (recklessTurn && currentTurn !== recklessTurn) {
      const effect = currentActor.effects.find((fx) => fx.name === "Reckless Magic");
      if (effect) effect.delete();
    }
  }
});

Hooks.on("dnd5e.restCompleted", async (actor) => {
  if (!hasWillpowerClass(actor)) return;
  const created = getCreatedSlots(actor);
  for (const [level, amount] of Object.entries(created)) {
    if (amount > 0) {
      await adjustSpellSlots(actor, Number(level), -amount);
    }
  }
  if (Object.keys(created).length) {
    await setCreatedSlots(actor, {});
  }
  const signatures = actor.getFlag(FLAG_SCOPE, SIGNATURE_SPELLS_FLAG) ?? [];
  if (signatures.length) {
    const uses = {};
    for (const uuid of signatures) uses[uuid] = 1;
    await actor.setFlag(FLAG_SCOPE, SIGNATURE_USES_FLAG, uses);
  }
});

Hooks.on("updateActor", async (actor) => {
  if (!hasWillpowerClass(actor)) return;
  const level = getWillpowerLevel(actor);
  const previous = actor.getFlag(FLAG_SCOPE, CLASS_LEVEL_FLAG) ?? 0;
  if (level === previous) return;
  await actor.setFlag(FLAG_SCOPE, CLASS_LEVEL_FLAG, level);
  await updateSorceryPoints(actor);
  await ensureBlackMagicOption(actor);
  await ensureSignatureSpells(actor);
});
