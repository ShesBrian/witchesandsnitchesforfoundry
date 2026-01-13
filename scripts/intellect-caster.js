const INTELLECT_CLASS_NAME = "Intellect Caster";
const SORCERY_POINTS_LABEL = "Sorcery Points";
const FLAG_SCOPE = "witchesandsnitches";

const INTELLECT_SP_BY_LEVEL = {
  1: 0,
  2: 2,
  3: 3,
  4: 4,
  5: 4,
  6: 5,
  7: 6,
  8: 7,
  9: 7,
  10: 8,
  11: 9,
  12: 10,
  13: 10,
  14: 11,
  15: 12,
  16: 13,
  17: 13,
  18: 14,
  19: 15,
  20: 15
};

const CREATED_SLOTS_FLAG = "intellectCreatedSlots";
const CLASS_LEVEL_FLAG = "intellectClassLevel";
const DOUBLE_CHECK_FLAG = "intellectDoubleCheckPending";
const SPELL_BLOCK_FLAG = "intellectSpellBlock";
const TACTICAL_WIT_FLAG = "intellectTacticalWit";

const FLEXIBLE_CASTING_COSTS = {
  1: 2,
  2: 3,
  3: 5,
  4: 6,
  5: 7
};

const getIntellectClassItem = (actor) =>
  actor.items.find((item) => item.type === "class" && item.name === INTELLECT_CLASS_NAME);

const hasIntellectClass = (actor) => Boolean(getIntellectClassItem(actor));

const getIntellectLevel = (actor) => getIntellectClassItem(actor)?.system?.levels ?? 0;

const getResourceSlot = (actor, label) => {
  const resources = actor.system?.resources ?? {};
  for (const slot of ["primary", "secondary", "tertiary"]) {
    const resource = resources[slot] ?? {};
    if (!resource.label || resource.label === label) return slot;
  }
  return "primary";
};

const updateSorceryPoints = async (actor) => {
  const level = getIntellectLevel(actor);
  const max = INTELLECT_SP_BY_LEVEL[level] ?? 0;
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

const getTurnKey = () => {
  if (!game.combat) return null;
  return `${game.combat.round}-${game.combat.turn}`;
};

const blockSpells = async (actor) => {
  await actor.setFlag(FLAG_SCOPE, SPELL_BLOCK_FLAG, getTurnKey());
  await actor.createEmbeddedDocuments("ActiveEffect", [
    {
      name: "Tactical Wit - Spell Restriction",
      icon: "icons/svg/eye.svg",
      duration: {
        rounds: 1,
        turns: 1,
        startRound: game.combat?.round ?? 0,
        startTurn: game.combat?.turn ?? 0
      }
    }
  ]);
};

const handleTacticalWitUse = async (actor) => {
  const choice = await promptSelection("Tactical Wit", [
    { value: "ac", label: "AC +2" },
    { value: "save", label: "Save +4" }
  ]);
  if (!choice) return;
  await actor.setFlag(FLAG_SCOPE, TACTICAL_WIT_FLAG, choice);
  await blockSpells(actor);
};

const applyTacticalWitBonus = (workflow, actor) => {
  const choice = actor.getFlag(FLAG_SCOPE, TACTICAL_WIT_FLAG);
  if (!choice) return;
  if (choice === "ac" && workflow.attackRoll) {
    workflow.attackRoll._total -= 2;
    workflow.attackRoll._formula = `${workflow.attackRoll._formula} - 2`;
  }
  if (choice === "save" && workflow.saveRoll) {
    workflow.saveRoll._total += 4;
    workflow.saveRoll._formula = `${workflow.saveRoll._formula} + 4`;
  }
  actor.unsetFlag(FLAG_SCOPE, TACTICAL_WIT_FLAG);
};

const handleDoubleCheckNotes = async (workflow) => {
  const actor = workflow.actor;
  if (!actor || !hasIntellectClass(actor)) return;
  if (actor.getFlag(FLAG_SCOPE, DOUBLE_CHECK_FLAG)) {
    await actor.unsetFlag(FLAG_SCOPE, DOUBLE_CHECK_FLAG);
    return;
  }
  const feature = actor.items.find((item) => item.name === "Double Check Notes");
  if (!feature || feature.system?.uses?.value <= 0) return;
  if (workflow.item?.type !== "spell") return;

  const missedAttack = workflow.attackRoll && !workflow.hitTargets?.size;
  const saveFailed =
    workflow.item?.system?.save?.ability &&
    workflow.failedSaves &&
    workflow.failedSaves.size === 0 &&
    workflow.saves &&
    workflow.saves.size > 0;

  if (!missedAttack && !saveFailed) return;

  const use = await promptSelection("Double Check Notes", [
    { value: "yes", label: "Use Double Check Notes" },
    { value: "no", label: "Do Not Use" }
  ]);
  if (use !== "yes") return;

  await feature.update({ "system.uses.value": feature.system.uses.value - 1 });
  await actor.setFlag(FLAG_SCOPE, DOUBLE_CHECK_FLAG, true);
  await workflow.item.use({
    consumeSpellSlot: false,
    consumeResource: false,
    consumeItemUse: false
  });
};

const handleArcaneRecovery = async (actor) => {
  if (!actor.items.some((item) => item.name === "Arcane Recovery")) return;
  if (getIntellectLevel(actor) < 20) return;

  const slotLevels = [1, 2, 3, 4, 5];
  const options = slotLevels
    .filter((level) => {
      const slotKey = `spell${level}`;
      const data = actor.system?.spells?.[slotKey];
      return data && data.value < data.max;
    })
    .map((level) => ({ value: level, label: `Level ${level}` }));
  if (!options.length) return;

  const selection = await promptSelection(
    "Arcane Recovery (select slots to recover)",
    options,
    options.length
  );
  if (!selection) return;

  const levels = [selection].flat().map((value) => Number(value));
  let total = 0;
  for (const level of levels) total += level;
  if (total > 10) return;

  for (const level of levels) {
    const slotKey = `spell${level}`;
    const data = actor.system?.spells?.[slotKey];
    if (!data || data.value >= data.max) continue;
    await actor.update({ [`system.spells.${slotKey}.value`]: data.value + 1 });
  }
};

Hooks.on("dnd5e.preRollInitiative", (actor, rollData, options) => {
  if (!hasIntellectClass(actor)) return;
  const dex = actor.system?.abilities?.dex?.mod ?? 0;
  const intl = actor.system?.abilities?.int?.mod ?? 0;
  const bonus = Math.max(dex, intl) - dex;
  options.initiativeBonus = (options.initiativeBonus ?? 0) + bonus;
});

Hooks.on("midi-qol.RollComplete", async (workflow) => {
  const actor = workflow.actor;
  if (!actor || !hasIntellectClass(actor)) return;
  const macroName = workflow.item?.flags?.["midi-qol"]?.onUseMacroName;
  if (macroName === "fontOfMagic") {
    await handleFlexibleCasting(actor);
  }
  if (macroName === "intellectTacticalWit") {
    await handleTacticalWitUse(actor);
  }
  await handleDoubleCheckNotes(workflow);
});

Hooks.on("midi-qol.preAttackRoll", (workflow) => {
  const target = workflow.targets?.first();
  if (!target?.actor || !hasIntellectClass(target.actor)) return;
  applyTacticalWitBonus(workflow, target.actor);
});

Hooks.on("midi-qol.preSave", (workflow) => {
  const actor = workflow.actor;
  if (!actor || !hasIntellectClass(actor)) return;
  applyTacticalWitBonus(workflow, actor);
});

Hooks.on("midi-qol.preItemRoll", (workflow) => {
  const actor = workflow.actor;
  if (!actor || !hasIntellectClass(actor)) return;
  const block = actor.getFlag(FLAG_SCOPE, SPELL_BLOCK_FLAG);
  if (!block) return;
  if (workflow.item?.type === "spell" && (workflow.item.system?.level ?? 0) > 0) {
    ui.notifications.warn("Tactical Wit prevents casting leveled spells until the end of your next turn.");
    return false;
  }
  return true;
});

Hooks.on("dnd5e.restCompleted", async (actor, data) => {
  if (!hasIntellectClass(actor)) return;
  const created = getCreatedSlots(actor);
  for (const [level, amount] of Object.entries(created)) {
    if (amount > 0) {
      await adjustSpellSlots(actor, Number(level), -amount);
    }
  }
  if (Object.keys(created).length) {
    await setCreatedSlots(actor, {});
  }
  if (data?.longRest !== true) {
    await handleArcaneRecovery(actor);
  }
});

Hooks.on("updateActor", async (actor) => {
  if (!hasIntellectClass(actor)) return;
  const level = getIntellectLevel(actor);
  const previous = actor.getFlag(FLAG_SCOPE, CLASS_LEVEL_FLAG) ?? 0;
  if (level === previous) return;
  await actor.setFlag(FLAG_SCOPE, CLASS_LEVEL_FLAG, level);
  await updateSorceryPoints(actor);
});
