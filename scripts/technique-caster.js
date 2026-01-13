const TECHNIQUE_CLASS_NAME = "Technique Caster";
const SORCERY_POINTS_LABEL = "Sorcery Points";
const FLAG_SCOPE = "witchesandsnitches";

const EXPLOIT_TURN_FLAG = "exploitWeaknessTurn";
const CREATED_SLOTS_FLAG = "techniqueCreatedSlots";
const TECHNIQUE_LEVEL_FLAG = "techniqueClassLevel";

const TECHNIQUE_SP_BY_LEVEL = {
  1: 0,
  2: 3,
  3: 4,
  4: 5,
  5: 7,
  6: 8,
  7: 9,
  8: 10,
  9: 12,
  10: 13,
  11: 14,
  12: 15,
  13: 17,
  14: 18,
  15: 19,
  16: 20,
  17: 22,
  18: 23,
  19: 24,
  20: 25
};

const FLEXIBLE_CASTING_COSTS = {
  1: 2,
  2: 3,
  3: 5,
  4: 6,
  5: 7
};

const getTechniqueClassItem = (actor) =>
  actor.items.find((item) => item.type === "class" && item.name === TECHNIQUE_CLASS_NAME);

const hasTechniqueClass = (actor) => Boolean(getTechniqueClassItem(actor));

const getTechniqueLevel = (actor) => getTechniqueClassItem(actor)?.system?.levels ?? 0;

const getResourceSlot = (actor, label) => {
  const resources = actor.system?.resources ?? {};
  for (const slot of ["primary", "secondary", "tertiary"]) {
    const resource = resources[slot] ?? {};
    if (!resource.label || resource.label === label) return slot;
  }
  return "primary";
};

const updateSorceryPoints = async (actor) => {
  const level = getTechniqueLevel(actor);
  const max = TECHNIQUE_SP_BY_LEVEL[level] ?? 0;
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

const getExploitDamageDice = (slotLevel) => {
  if (slotLevel <= 1) return 2;
  if (slotLevel === 2) return 3;
  if (slotLevel === 3) return 4;
  return 5;
};

const promptDamageType = async (defaultType) => {
  if (defaultType) return defaultType;
  const options = [
    "acid",
    "bludgeoning",
    "cold",
    "fire",
    "force",
    "lightning",
    "necrotic",
    "piercing",
    "poison",
    "psychic",
    "radiant",
    "slashing",
    "thunder"
  ].map((type) => ({ value: type, label: type }));
  return promptSelection("Exploit Weakness Damage Type", options);
};

const handleExploitWeakness = async (workflow) => {
  const actor = workflow.actor;
  if (!actor || !hasTechniqueClass(actor)) return {};
  if (!workflow.hitTargets?.size) return {};

  const exploitItem = actor.items.find((item) => item.name === "Exploit Weakness");
  if (!exploitItem) return {};

  const turnKey = getTurnKey();
  const usedTurn = actor.getFlag(FLAG_SCOPE, EXPLOIT_TURN_FLAG);
  if (turnKey && usedTurn === turnKey) return {};

  const availableSlots = [1, 2, 3, 4, 5].filter((level) => {
    const slotKey = `spell${level}`;
    return (actor.system?.spells?.[slotKey]?.value ?? 0) > 0;
  });
  if (!availableSlots.length) return {};

  const selection = await promptSelection(
    "Exploit Weakness: Expend Spell Slot",
    availableSlots.map((level) => ({ value: level, label: `Level ${level}` }))
  );
  if (!selection) return {};

  const slotKey = `spell${selection}`;
  const current = actor.system?.spells?.[slotKey];
  if (!current || (current.value ?? 0) < 1) return {};

  await actor.update({ [`system.spells.${slotKey}.value`]: current.value - 1 });
  if (turnKey) {
    await actor.setFlag(FLAG_SCOPE, EXPLOIT_TURN_FLAG, turnKey);
  }

  const dice = getExploitDamageDice(Number(selection));
  const damageParts = workflow.item?.system?.damage?.parts ?? [];
  const defaultType = damageParts.length ? damageParts[0][1] : null;
  const damageType = await promptDamageType(defaultType);
  if (!damageType) return {};

  return {
    damageRoll: `${dice}d8[${damageType}]`,
    flavor: "Exploit Weakness"
  };
};

const actorKnowsSpell = (actor, item) =>
  actor.items.some(
    (spell) =>
      spell.type === "spell" &&
      (spell.uuid === item.uuid || spell.name === item.name)
  );

const getSorceryPoints = (actor) => {
  const slot = getResourceSlot(actor, SORCERY_POINTS_LABEL);
  const resource = actor.system?.resources?.[slot] ?? {};
  return { slot, resource };
};

const spendSorceryPointsForDeflection = async (actor, cost) => {
  if (cost <= 0) return true;
  const { slot, resource } = getSorceryPoints(actor);
  if (resource.label !== SORCERY_POINTS_LABEL) return false;
  if ((resource.value ?? 0) < cost) return false;
  await actor.update({ [`system.resources.${slot}.value`]: resource.value - cost });
  return true;
};

const selectRedirectTarget = async (actorToken, excludedIds) => {
  const candidates = canvas.tokens.placeables.filter((token) => {
    if (!token.actor) return false;
    if (excludedIds.has(token.id)) return false;
    if (actorToken.distanceTo(token) > 10) return false;
    return true;
  });
  if (!candidates.length) return null;
  const selection = await promptSelection(
    "Redirect Spell",
    candidates.map((token) => ({ value: token.id, label: token.name }))
  );
  if (!selection) return null;
  return canvas.tokens.get(selection) ?? null;
};

const handleSpellDeflection = async (workflow) => {
  if (workflow.flags?.[FLAG_SCOPE]?.spellDeflectionHandled) return;
  const targets = workflow.targets ? Array.from(workflow.targets) : [];
  if (!targets.length) return;
  if (workflow.item?.type !== "spell") return;

  for (const targetToken of targets) {
    const actor = targetToken.actor;
    if (!actor || !hasTechniqueClass(actor)) continue;
    const deflectionItem = actor.items.find((item) => item.name === "Spell Deflection");
    if (!deflectionItem) continue;
    if (!actorKnowsSpell(actor, workflow.item)) continue;

    const use = await promptSelection("Spell Deflection", [
      { value: "yes", label: "Use Spell Deflection" },
      { value: "no", label: "Do Not Use" }
    ]);
    if (use !== "yes") continue;

    const cost = (workflow.item.system?.level ?? 0) * 2;
    const paid = await spendSorceryPointsForDeflection(actor, cost);
    if (!paid) continue;

    if (workflow.item.system?.save?.ability) {
      workflow.saves = workflow.saves ?? new Set();
      workflow.failedSaves = workflow.failedSaves ?? new Set();
      workflow.saves.add(targetToken);
      workflow.failedSaves = new Set(
        Array.from(workflow.failedSaves).filter((tok) => tok.id !== targetToken.id)
      );
    } else {
      workflow.targets.delete(targetToken);
    }

    const excluded = new Set(targets.map((tok) => tok.id));
    const redirectTarget = await selectRedirectTarget(targetToken, excluded);
    if (!redirectTarget) continue;

    if (workflow.damageRoll && game?.midiqol?.applyTokenDamage) {
      const damageType = workflow.defaultDamageType ?? null;
      await game.midiqol.applyTokenDamage(
        [{ damage: workflow.damageRoll.total, type: damageType }],
        workflow.damageRoll.total,
        new Set([redirectTarget]),
        workflow.item,
        workflow
      );
    }
  }
  workflow.flags = workflow.flags ?? {};
  workflow.flags[FLAG_SCOPE] = workflow.flags[FLAG_SCOPE] ?? {};
  workflow.flags[FLAG_SCOPE].spellDeflectionHandled = true;
};

Hooks.on("midi-qol.RollComplete", async (workflow) => {
  const actor = workflow.actor;
  if (!actor || !hasTechniqueClass(actor)) return;
  const macroName = workflow.item?.flags?.["midi-qol"]?.onUseMacroName;
  if (macroName === "fontOfMagic") {
    await handleFlexibleCasting(actor);
  }
});

Hooks.on("midi-qol.DamageBonus", handleExploitWeakness);
Hooks.on("midi-qol.preSave", handleSpellDeflection);
Hooks.on("midi-qol.preCheckHits", handleSpellDeflection);

Hooks.on("dnd5e.restCompleted", async (actor, data) => {
  if (!hasTechniqueClass(actor)) return;
  const created = getCreatedSlots(actor);
  for (const [level, amount] of Object.entries(created)) {
    if (amount > 0) {
      await adjustSpellSlots(actor, Number(level), -amount);
    }
  }
  if (Object.keys(created).length) {
    await setCreatedSlots(actor, {});
  }

  const hasRestoration = actor.items.some((item) => item.name === "Sorcerous Restoration");
  if (hasRestoration && getTechniqueLevel(actor) >= 20 && data?.longRest !== true) {
    await gainSorceryPoints(actor, 4);
  }
});

Hooks.on("updateActor", async (actor) => {
  if (!hasTechniqueClass(actor)) return;
  const level = getTechniqueLevel(actor);
  const previous = actor.getFlag(FLAG_SCOPE, TECHNIQUE_LEVEL_FLAG) ?? 0;
  if (level === previous) return;
  await actor.setFlag(FLAG_SCOPE, TECHNIQUE_LEVEL_FLAG, level);
  await updateSorceryPoints(actor);
});
