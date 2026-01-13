const WILLPOWER_CLASS_NAME = "Willpower Caster";
const SORCERY_POINTS_LABEL = "Sorcery Points";
const MODULE_ID = "witchesandsnitchesforfoundry";
const BLACK_MAGIC_FLAG = "willpowerBlackMagicOption";
const SIGNATURE_FLAG = "willpowerSignatureSpells";
const CREATED_SLOTS_FLAG = "willpowerCreatedSlots";
const CLASS_LEVEL_FLAG = "willpowerClassLevel";

const getWillpowerClassItem = (actor) =>
  actor.items.find((item) => item.type === "class" && item.name === WILLPOWER_CLASS_NAME);

const getWillpowerLevel = (actor) => getWillpowerClassItem(actor)?.system?.levels ?? 0;

const getSorceryResourceUpdate = (actor, max) => {
  const resources = actor.system?.resources ?? {};
  const slots = ["primary", "secondary", "tertiary"];
  for (const slot of slots) {
    const resource = resources[slot] ?? {};
    if (!resource.label || resource.label === SORCERY_POINTS_LABEL) {
      return {
        path: `system.resources.${slot}`,
        data: {
          label: SORCERY_POINTS_LABEL,
          max,
          value: Math.min(resource.value ?? max, max),
          sr: true,
          lr: true
        }
      };
    }
  }
  return null;
};

const updateSorceryPoints = async (actor) => {
  const level = getWillpowerLevel(actor);
  if (level < 2) return;
  const update = getSorceryResourceUpdate(actor, level);
  if (!update) return;
  await actor.update({ [update.path]: update.data });
};

const getCreatedSlots = (actor) => actor.getFlag(MODULE_ID, CREATED_SLOTS_FLAG) ?? {};

const setCreatedSlots = async (actor, data) =>
  actor.setFlag(MODULE_ID, CREATED_SLOTS_FLAG, data);

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
  const resources = actor.system?.resources ?? {};
  const slots = ["primary", "secondary", "tertiary"];
  for (const slot of slots) {
    const resource = resources[slot] ?? {};
    if (resource.label === SORCERY_POINTS_LABEL) {
      if ((resource.value ?? 0) < cost) return false;
      await actor.update({
        [`system.resources.${slot}.value`]: resource.value - cost
      });
      return true;
    }
  }
  return false;
};

const gainSorceryPoints = async (actor, amount) => {
  const resources = actor.system?.resources ?? {};
  const slots = ["primary", "secondary", "tertiary"];
  for (const slot of slots) {
    const resource = resources[slot] ?? {};
    if (resource.label === SORCERY_POINTS_LABEL) {
      const max = resource.max ?? 0;
      const value = Math.min((resource.value ?? 0) + amount, max);
      await actor.update({ [`system.resources.${slot}.value`]: value });
      return true;
    }
  }
  return false;
};

const flexibleCastingCosts = {
  1: 2,
  2: 3,
  3: 5,
  4: 6,
  5: 7
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

const handleCreateSlot = async (actor) => {
  const options = Object.keys(flexibleCastingCosts).map((level) => ({
    value: Number(level),
    label: `Level ${level} (Cost ${flexibleCastingCosts[level]} SP)`
  }));
  const selection = await promptSelection("Create Spell Slot", options);
  if (!selection) return;
  const cost = flexibleCastingCosts[selection];
  if (!cost) return;
  const spent = await spendSorceryPoints(actor, cost);
  if (!spent) return;
  await adjustSpellSlots(actor, selection, 1);
  const created = { ...getCreatedSlots(actor) };
  created[selection] = (created[selection] ?? 0) + 1;
  await setCreatedSlots(actor, created);
};

const handleConvertSlot = async (actor) => {
  const options = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => ({
    value: level,
    label: `Level ${level}`
  }));
  const selection = await promptSelection("Convert Spell Slot", options);
  if (!selection) return;
  const slotKey = `spell${selection}`;
  const current = actor.system?.spells?.[slotKey];
  if (!current || (current.value ?? 0) < 1) return;
  await actor.update({ [`system.spells.${slotKey}.value`]: current.value - 1 });
  await gainSorceryPoints(actor, Number(selection));
};

Hooks.on("renderItemSheet", (app, html) => {
  const item = app.item;
  if (!item || item.name !== "Font of Magic") return;
  const actor = item.actor;
  if (!actor || !getWillpowerClassItem(actor)) return;
  const footer = html.find(".sheet-footer");
  if (!footer.length) return;
  const buttons = $(
    `<div class="form-group">
      <button type="button" class="willpower-create-slot">Create Spell Slot</button>
      <button type="button" class="willpower-convert-slot">Convert Spell Slot</button>
    </div>`
  );
  buttons.find(".willpower-create-slot").on("click", () => handleCreateSlot(actor));
  buttons
    .find(".willpower-convert-slot")
    .on("click", () => handleConvertSlot(actor));
  footer.append(buttons);
});

Hooks.on("dnd5e.restCompleted", async (actor, data) => {
  if (!getWillpowerClassItem(actor)) return;
  const created = getCreatedSlots(actor);
  for (const [level, amount] of Object.entries(created)) {
    if (amount > 0) {
      await adjustSpellSlots(actor, Number(level), -amount);
    }
  }
  if (Object.keys(created).length) {
    await setCreatedSlots(actor, {});
  }
});

const getBlackMagicOption = (actor) => actor.getFlag(MODULE_ID, BLACK_MAGIC_FLAG);

const setBlackMagicOption = async (actor, option) =>
  actor.setFlag(MODULE_ID, BLACK_MAGIC_FLAG, option);

const ensureBlackMagicChoice = async (actor) => {
  const level = getWillpowerLevel(actor);
  if (level < 5) return;
  if (getBlackMagicOption(actor)) return;
  const options = [
    { value: "Ambush", label: "Ambush" },
    { value: "Gambit", label: "Gambit" },
    { value: "Grudge", label: "Grudge" },
    { value: "Pique", label: "Pique" },
    { value: "Hubris", label: "Hubris" }
  ];
  const selection = await promptSelection("Black Magic Option", options);
  if (!selection) return;
  const pack = game.packs.get(`${MODULE_ID}.willpowercaster`);
  const ids = {
    Ambush: "blackmagicambush",
    Gambit: "blackmagicgambit",
    Grudge: "blackmagicgrudge",
    Pique: "blackmagicpique",
    Hubris: "blackmagichubris"
  };
  const doc = await pack?.getDocument(ids[selection]);
  if (doc) {
    await actor.createEmbeddedDocuments("Item", [doc.toObject()]);
  }
  await setBlackMagicOption(actor, selection);
};

const getSignatureFlag = (actor) => actor.getFlag(MODULE_ID, SIGNATURE_FLAG);

const setSignatureFlag = async (actor, data) =>
  actor.setFlag(MODULE_ID, SIGNATURE_FLAG, data);

const ensureSignatureSpells = async (actor) => {
  const level = getWillpowerLevel(actor);
  if (level < 20) return;
  if (getSignatureFlag(actor)?.length) return;
  const spells = actor.items.filter(
    (item) => item.type === "spell" && item.system?.level === 3
  );
  if (!spells.length) return;
  const options = spells.map((spell) => ({
    value: spell.uuid,
    label: spell.name
  }));
  const selection = await promptSelection(
    "Signature Spells (Choose Two 3rd-level Spells)",
    options,
    2
  );
  if (!selection) return;
  const chosen = spells.filter((spell) => selection.includes(spell.uuid));
  const copies = chosen.map((spell) => {
    const data = spell.toObject();
    data.name = `Signature Spell: ${spell.name}`;
    data.system.uses = { value: 1, max: 1, per: "sr" };
    data.system.prepared = true;
    data.system.preparation = { mode: "prepared", prepared: true };
    data.flags = { ...data.flags, [MODULE_ID]: { signatureSpell: true } };
    return data;
  });
  if (copies.length) {
    await actor.createEmbeddedDocuments("Item", copies);
  }
  await setSignatureFlag(actor, selection);
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
    return tokenWithin5(token, targetToken) && token.document.disposition !== targetToken.document.disposition;
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

const wasSurprised = (targetToken) =>
  targetToken?.actor?.statuses?.has("surprised");

Hooks.on("midi-qol.DamageBonus", async (workflow) => {
  const actor = workflow.actor;
  if (!actor || !getWillpowerClassItem(actor)) return {};
  const item = workflow.item;
  if (!item) return {};
  const isCantrip = item.type === "spell" && item.system?.level === 0;
  const isMeleeWeapon = item.type === "weapon" && item.system?.actionType === "mwak";
  if (!isCantrip && !isMeleeWeapon) return {};

  const level = getWillpowerLevel(actor);
  const dice = blackMagicDiceByLevel(level);
  const advantage = workflow.advantage || workflow.attackRoll?.options?.advantage;
  const disadvantage = workflow.disadvantage || workflow.attackRoll?.options?.disadvantage;
  const targetToken = workflow.targets?.first();
  const actorToken = workflow.token ?? actor.getActiveTokens()?.[0];

  let qualifies = advantage || (!disadvantage && otherEnemyNearTarget(workflow));
  const option = getBlackMagicOption(actor);

  if (!qualifies && option === "Gambit" && actorToken && targetToken) {
    const adjacent = tokenWithin5(actorToken, targetToken);
    const alone = noOtherCreaturesNearActor(actorToken);
    if (adjacent && alone && !disadvantage) {
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
    if ((targetToken.actor?.system?.attributes?.hp?.value ?? 0) < (actor.system?.attributes?.hp?.value ?? 0)) {
      qualifies = true;
    }
  }

  if (!qualifies && option === "Grudge" && targetToken) {
    const grudge = actor.getFlag(MODULE_ID, "willpowerGrudge") ?? [];
    if (grudge.includes(targetToken.actor?.id)) {
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

  if (!qualifies) return {};

  return {
    damageRoll: `${dice}d6`,
    flavor: "Black Magic"
  };
});

Hooks.on("dnd5e.damageApplied", (actor, amount, context) => {
  const source = context?.attacker;
  if (!source || !actor || !getWillpowerClassItem(actor)) return;
  const existing = actor.getFlag(MODULE_ID, "willpowerGrudge") ?? [];
  if (!existing.includes(source.id)) {
    actor.setFlag(MODULE_ID, "willpowerGrudge", [...existing, source.id]);
  }
});

const applyRecklessEffect = async (actor) => {
  const existing = actor.effects.find((effect) => effect.name === "Reckless Magic");
  if (existing) await existing.delete();
  await actor.createEmbeddedDocuments("ActiveEffect", [
    {
      name: "Reckless Magic",
      icon: "icons/svg/explosion.svg",
      duration: { rounds: 1, turns: 1, startRound: game.combat?.round ?? 0 },
      changes: [
        { key: "flags.midi-qol.advantage.attack.spell", mode: 2, value: 1 },
        { key: "flags.midi-qol.grants.advantage.attack.all", mode: 2, value: 1 }
      ]
    }
  ]);
};

Hooks.on("renderItemSheet", (app, html) => {
  const item = app.item;
  if (!item || item.name !== "Reckless Magic") return;
  const actor = item.actor;
  if (!actor || !getWillpowerClassItem(actor)) return;
  const footer = html.find(".sheet-footer");
  if (!footer.length) return;
  const button = $(
    `<div class="form-group"><button type="button" class="willpower-reckless">Toggle Reckless Magic</button></div>`
  );
  button.find(".willpower-reckless").on("click", () => applyRecklessEffect(actor));
  footer.append(button);
});

Hooks.on("updateActor", async (actor) => {
  const classItem = getWillpowerClassItem(actor);
  if (!classItem) return;
  const level = getWillpowerLevel(actor);
  const previous = actor.getFlag(MODULE_ID, CLASS_LEVEL_FLAG) ?? 0;
  if (level === previous) return;
  await actor.setFlag(MODULE_ID, CLASS_LEVEL_FLAG, level);
  await updateSorceryPoints(actor);
  await ensureBlackMagicChoice(actor);
  await ensureSignatureSpells(actor);
});
