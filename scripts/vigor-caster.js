const VIGOR_CLASS_NAME = "Vigor Caster";
const SORCERY_POINTS_LABEL = "Sorcery Points";
const FLAG_SCOPE = "witchesandsnitches";

const VIGOR_SP_BY_LEVEL = {
  1: 0,
  2: 2,
  3: 5,
  4: 5,
  5: 5,
  6: 10,
  7: 10,
  8: 10,
  9: 10,
  10: 10,
  11: 10,
  12: 10,
  13: 15,
  14: 15,
  15: 15,
  16: 15,
  17: 20,
  18: 20,
  19: 20,
  20: 20
};

const CREATED_SLOTS_FLAG = "vigorCreatedSlots";
const CLASS_LEVEL_FLAG = "vigorClassLevel";
const RAGE_EFFECT_NAME = "Vigor Rage";
const RAGE_ATTACKED_FLAG = "vigorRageAttackedHostile";
const RAGE_DAMAGE_FLAG = "vigorRageTookDamage";
const RELENTLESS_DC_FLAG = "vigorRelentlessDc";

const FLEXIBLE_CASTING_COSTS = {
  1: 2,
  2: 3,
  3: 5,
  4: 6,
  5: 7
};

const getVigorClassItem = (actor) =>
  actor.items.find((item) => item.type === "class" && item.name === VIGOR_CLASS_NAME);

const hasVigorClass = (actor) => Boolean(getVigorClassItem(actor));

const getVigorLevel = (actor) => getVigorClassItem(actor)?.system?.levels ?? 0;

const getResourceSlot = (actor, label) => {
  const resources = actor.system?.resources ?? {};
  for (const slot of ["primary", "secondary", "tertiary"]) {
    const resource = resources[slot] ?? {};
    if (!resource.label || resource.label === label) return slot;
  }
  return "primary";
};

const updateSorceryPoints = async (actor) => {
  const level = getVigorLevel(actor);
  const max = VIGOR_SP_BY_LEVEL[level] ?? 0;
  const slot = getResourceSlot(actor, SORCERY_POINTS_LABEL);
  const resource = actor.system?.resources?.[slot] ?? {};
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

const getUnarmedDice = (level) => {
  if (level >= 17) return "4d6";
  if (level >= 11) return "3d6";
  if (level >= 5) return "2d6";
  return "1d6";
};

const updateUnarmedStrike = async (actor) => {
  const level = getVigorLevel(actor);
  const dice = getUnarmedDice(level);
  const item = actor.items.find(
    (entry) => entry.type === "weapon" && entry.name === "Unarmed Strike"
  );
  if (!item) return;
  const parts = item.system?.damage?.parts ?? [];
  const next = [[`${dice} + @mod`, "bludgeoning"], ...parts.slice(1)];
  await item.update({ "system.damage.parts": next, "system.ability": "str" });
};

const getRageDamageBonus = (level) => {
  if (level >= 16) return 4;
  if (level >= 10) return 3;
  return 2;
};

const isRaging = (actor) => actor.effects.some((effect) => effect.name === RAGE_EFFECT_NAME);

const applyRageEffect = async (actor) => {
  if (isRaging(actor)) return;
  await actor.createEmbeddedDocuments("ActiveEffect", [
    {
      name: RAGE_EFFECT_NAME,
      icon: "icons/svg/explosion.svg",
      duration: {
        rounds: 10,
        startRound: game.combat?.round ?? 0,
        startTurn: game.combat?.turn ?? 0
      },
      changes: [
        { key: "system.abilities.str.checks.adv", mode: 2, value: 1 },
        { key: "system.abilities.str.saves.adv", mode: 2, value: 1 },
        { key: "system.traits.dr.value", mode: 2, value: "bludgeoning" },
        { key: "system.traits.dr.value", mode: 2, value: "piercing" },
        { key: "system.traits.dr.value", mode: 2, value: "slashing" },
        { key: "system.traits.dr.value", mode: 2, value: "fire" }
      ]
    }
  ]);
  await actor.setFlag(FLAG_SCOPE, RAGE_ATTACKED_FLAG, false);
  await actor.setFlag(FLAG_SCOPE, RAGE_DAMAGE_FLAG, false);
};

const endRage = async (actor) => {
  const effect = actor.effects.find((fx) => fx.name === RAGE_EFFECT_NAME);
  if (effect) await effect.delete();
  await actor.setFlag(FLAG_SCOPE, RAGE_ATTACKED_FLAG, false);
  await actor.setFlag(FLAG_SCOPE, RAGE_DAMAGE_FLAG, false);
};

const handleRageUse = async (actor) => {
  const hasPoints = await spendSorceryPoints(actor, 5);
  if (!hasPoints) return;
  await applyRageEffect(actor);
};

const getTurnKey = () => {
  if (!game.combat) return null;
  return `${game.combat.round}-${game.combat.turn}`;
};

const resetRageTurnFlags = async (actor) => {
  await actor.setFlag(FLAG_SCOPE, RAGE_ATTACKED_FLAG, false);
  await actor.setFlag(FLAG_SCOPE, RAGE_DAMAGE_FLAG, false);
};

const checkRageEnd = async (actor) => {
  const attacked = actor.getFlag(FLAG_SCOPE, RAGE_ATTACKED_FLAG);
  const damaged = actor.getFlag(FLAG_SCOPE, RAGE_DAMAGE_FLAG);
  if (!attacked && !damaged) {
    await endRage(actor);
  }
};

const handleRelentlessRage = async (actor) => {
  if (!isRaging(actor)) return;
  if (getVigorLevel(actor) < 11) return;
  if (!actor.items.some((item) => item.name === "Relentless Rage")) return;
  const hp = actor.system?.attributes?.hp;
  if (!hp || hp.value > 0) return;
  if (hp.value <= -hp.max) return;

  const currentDc = actor.getFlag(FLAG_SCOPE, RELENTLESS_DC_FLAG) ?? 15;
  const roll = await actor.rollAbilitySave("con", { dc: currentDc, chatMessage: true });
  if (roll.total >= currentDc) {
    await actor.update({ "system.attributes.hp.value": 1 });
  } else {
    await actor.setFlag(FLAG_SCOPE, RELENTLESS_DC_FLAG, currentDc + 5);
  }
};

Hooks.on("midi-qol.RollComplete", async (workflow) => {
  const actor = workflow.actor;
  if (!actor || !hasVigorClass(actor)) return;
  const macroName = workflow.item?.flags?.["midi-qol"]?.onUseMacroName;
  if (macroName === "fontOfMagic") {
    await handleFlexibleCasting(actor);
  }
  if (macroName === "vigorRage") {
    await handleRageUse(actor);
  }
});

Hooks.on("midi-qol.preItemRoll", (workflow) => {
  const actor = workflow.actor;
  if (!actor || !hasVigorClass(actor)) return;
  if (!isRaging(actor)) return;
  if (workflow.item?.type !== "spell") return;

  const targetType = workflow.item.system?.target?.type;
  if (["cone", "cube", "line", "sphere"].includes(targetType)) return false;
  if (workflow.item.system?.duration?.concentration) return false;
  return true;
});

Hooks.on("midi-qol.DamageBonus", async (workflow) => {
  const actor = workflow.actor;
  if (!actor || !hasVigorClass(actor)) return {};
  if (!isRaging(actor)) return {};
  const item = workflow.item;
  if (!item || item.type !== "weapon") return {};
  if (item.system?.ability !== "str") return {};
  if (item.name !== "Unarmed Strike") return {};

  const bonus = getRageDamageBonus(getVigorLevel(actor));
  return { damageRoll: `${bonus}`, flavor: "Rage" };
});

Hooks.on("midi-qol.preAttackRoll", (workflow) => {
  const actor = workflow.actor;
  if (!actor || !hasVigorClass(actor)) return;
  if (!isRaging(actor)) return;
  const target = workflow.targets?.first();
  if (!target) return;
  const hostile =
    target.document?.disposition !== workflow.token?.document?.disposition;
  if (hostile) {
    actor.setFlag(FLAG_SCOPE, RAGE_ATTACKED_FLAG, true);
  }
});

Hooks.on("dnd5e.damageApplied", (actor, amount, context) => {
  if (!actor || !hasVigorClass(actor)) return;
  if (!isRaging(actor)) return;
  actor.setFlag(FLAG_SCOPE, RAGE_DAMAGE_FLAG, true);
  handleRelentlessRage(actor);
});

Hooks.on("updateCombat", (combat, changed) => {
  if (!changed.turn && changed.turn !== 0) return;
  if (!combat.turns?.length) return;
  const previousTurn = changed.turn === 0 ? combat.turns.length - 1 : changed.turn - 1;
  const previousActor = combat.turns[previousTurn]?.actor;
  if (previousActor && hasVigorClass(previousActor) && isRaging(previousActor)) {
    checkRageEnd(previousActor);
  }

  const currentActor = combat.combatant?.actor;
  if (currentActor && hasVigorClass(currentActor) && isRaging(currentActor)) {
    resetRageTurnFlags(currentActor);
  }
});

Hooks.on("dnd5e.restCompleted", async (actor) => {
  if (!hasVigorClass(actor)) return;
  const created = getCreatedSlots(actor);
  for (const [level, amount] of Object.entries(created)) {
    if (amount > 0) {
      await adjustSpellSlots(actor, Number(level), -amount);
    }
  }
  if (Object.keys(created).length) {
    await setCreatedSlots(actor, {});
  }
  await actor.setFlag(FLAG_SCOPE, RELENTLESS_DC_FLAG, 15);
});

Hooks.on("updateActor", async (actor) => {
  if (!hasVigorClass(actor)) return;
  const level = getVigorLevel(actor);
  const previous = actor.getFlag(FLAG_SCOPE, CLASS_LEVEL_FLAG) ?? 0;
  if (level === previous) return;
  await actor.setFlag(FLAG_SCOPE, CLASS_LEVEL_FLAG, level);
  await updateSorceryPoints(actor);
  await updateUnarmedStrike(actor);
});
