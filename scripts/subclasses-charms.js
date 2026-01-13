const MODULE_ID = "witchesandsnitches";
const CHARMS_SUBCLASS_NAME = "Charms";
const LIGHTNING_FAST_WAND = "Lightning Fast Wand";
const PROTECTIVE_ENCHANTMENTS = "Protective Enchantments";
const DOUBLE_CAST = "Double Cast";
const DURABLE_SPELLWORK = "Durable Spellwork";
const ISSUED_COMMAND = "Issued Command";
const SOUND_OF_SILENCE = "The Sound of Silence";
const CALLED_SHOT = "Called Shot";
const FORCE_OF_WILL = "Force of Will";
const PROTEGO = "Protego";
const PROTEGO_MAXIMA = "Protego Maxima";

const DOUBLE_CAST_FLAG = "charmsDoubleCastUsed";
const ISSUED_COMMAND_FLAG = "issuedCommandRound";
const SOUND_OF_SILENCE_FLAG = "soundOfSilenceHandled";
const FREE_REACTION_FLAG = "protegoFreeReaction";

const getTurnKey = () => {
  if (!game.combat) return null;
  return `${game.combat.round}-${game.combat.turn}`;
};

const actorHasFeature = (actor, name) =>
  actor.items.some((item) => item.type === "feat" && item.name === name);

const actorHasSubclass = (actor, name) =>
  actor.items.some((item) => item.type === "subclass" && item.name === name);

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

const getDexBonus = (actor) => Math.ceil((actor.system?.abilities?.dex?.mod ?? 0) / 2);

const addProtegoSpell = async (actor, name) => {
  if (actor.items.some((item) => item.type === "spell" && item.name === name)) return;
  const pack = game.packs.get("witchesandsnitchesforfoundry.subclasses");
  if (!pack) return;
  const doc = await pack.getDocument(name === PROTEGO ? "spellprotego" : "spellprotegomaxima");
  if (doc) {
    await actor.createEmbeddedDocuments("Item", [doc.toObject()]);
  }
};

const applyProtegoBonus = async (actor, target) => {
  const roll = await new Roll("1d4").roll();
  const bonus = roll.total ?? 0;
  const effect = {
    name: "Protective Enchantments",
    icon: "icons/svg/shield.svg",
    duration: { rounds: 1, startRound: game.combat?.round ?? 0 },
    changes: [{ key: "system.attributes.ac.bonus", mode: 2, value: bonus }]
  };
  await target.actor.createEmbeddedDocuments("ActiveEffect", [effect]);
  await roll.toMessage({ flavor: `Protective Enchantments (+${bonus} AC)` });
};

const handleProtegoCast = async (workflow) => {
  const actor = workflow.actor;
  if (!actor || !actorHasFeature(actor, PROTECTIVE_ENCHANTMENTS)) return;
  const item = workflow.item;
  if (!item || ![PROTEGO, PROTEGO_MAXIMA].includes(item.name)) return;

  const token = workflow.token ?? actor.getActiveTokens()?.[0];
  if (!token) return;

  const allies = canvas.tokens.placeables.filter((t) => {
    if (!t.actor || t === token) return false;
    if (token.distanceTo(t) > 30) return false;
    return t.document.disposition === token.document.disposition;
  });

  const selection = await promptSelection(
    "Protective Enchantments",
    [{ value: "none", label: "No additional target" }, ...allies.map((t) => ({ value: t.id, label: t.name }))]
  );

  await applyProtegoBonus(actor, token);
  if (selection && selection !== "none") {
    const ally = canvas.tokens.get(selection);
    if (ally) await applyProtegoBonus(actor, ally);
  }

  const isReaction = item.system?.activation?.type === "reaction";
  if (isReaction) {
    await actor.setFlag(MODULE_ID, FREE_REACTION_FLAG, getTurnKey());
  }
};

const ensureFreeReactionItem = async (actor) => {
  if (actor.items.some((item) => item.name === "Free Reaction: Protego")) return;
  await actor.createEmbeddedDocuments("Item", [
    {
      name: "Free Reaction: Protego",
      type: "feat",
      img: "icons/svg/shield.svg",
      system: { activation: { type: "reaction", cost: 1 } },
      flags: { "midi-qol": { onUseMacroName: "charmsFreeReactionProtego" } }
    }
  ]);
};

const handleFreeReactionProtego = async (actor) => {
  const flag = actor.getFlag(MODULE_ID, FREE_REACTION_FLAG);
  if (!flag || flag !== getTurnKey()) return;
  const items = actor.items.filter((item) => item.type === "spell" && [PROTEGO, PROTEGO_MAXIMA].includes(item.name));
  if (!items.length) return;
  const selection = await promptSelection(
    "Free Reaction: Protego",
    items.map((item) => ({ value: item.id, label: item.name }))
  );
  if (!selection) return;
  const spell = actor.items.get(selection);
  if (!spell) return;
  await actor.unsetFlag(MODULE_ID, FREE_REACTION_FLAG);
  await spell.use({ consumeReaction: false });
};

Hooks.on("dnd5e.preRollInitiative", (actor, rollData, options) => {
  if (!actorHasFeature(actor, LIGHTNING_FAST_WAND)) return;
  options.advantage = true;
});

Hooks.on("midi-qol.preAttackRoll", (workflow) => {
  const actor = workflow.actor;
  if (!actor || !actorHasFeature(actor, LIGHTNING_FAST_WAND)) return;
  const actionType = workflow.item?.system?.actionType;
  if (!actionType || !["rsak", "msak"].includes(actionType)) return;
  const bonus = getDexBonus(actor);
  workflow.attackBonus = (workflow.attackBonus ?? 0) + bonus;
});

Hooks.on("midi-qol.RollComplete", async (workflow) => {
  const actor = workflow.actor;
  if (!actor || !actorHasSubclass(actor, CHARMS_SUBCLASS_NAME)) return;

  const item = workflow.item;
  if (item?.type === "spell" && [PROTEGO, PROTEGO_MAXIMA].includes(item.name)) {
    await handleProtegoCast(workflow);
  }

  if (item?.name === "Free Reaction: Protego") {
    await handleFreeReactionProtego(actor);
  }
});

Hooks.on("updateActor", async (actor) => {
  if (!actorHasSubclass(actor, CHARMS_SUBCLASS_NAME)) return;
  if (actorHasFeature(actor, PROTECTIVE_ENCHANTMENTS)) {
    await addProtegoSpell(actor, PROTEGO);
    if (actor.system?.details?.level >= 5) {
      await addProtegoSpell(actor, PROTEGO_MAXIMA);
    }
    await ensureFreeReactionItem(actor);
  }

  if (actorHasFeature(actor, SOUND_OF_SILENCE)) {
    const handled = actor.getFlag(MODULE_ID, SOUND_OF_SILENCE_FLAG);
    if (!handled) {
      const subtle = actor.items.find((item) => item.name === "Metamagic: Subtle Spell");
      if (!subtle) {
        const pack = game.packs.get("witchesandsnitchesforfoundry.classes");
        const doc = await pack?.getDocument("metasubtle");
        if (doc) await actor.createEmbeddedDocuments("Item", [doc.toObject()]);
      } else {
        const options = [
          { value: "metacareful", label: "Metamagic: Careful Spell" },
          { value: "metadistant", label: "Metamagic: Distant Spell" },
          { value: "metaempowered", label: "Metamagic: Empowered Spell" },
          { value: "metaextended", label: "Metamagic: Extended Spell" },
          { value: "metaheightened", label: "Metamagic: Heightened Spell" },
          { value: "metaquickened", label: "Metamagic: Quickened Spell" },
          { value: "metatwinned", label: "Metamagic: Twinned Spell" }
        ];
        const choice = await promptSelection("Exchange Subtle Spell", options);
        if (choice) {
          await subtle.delete();
          const pack = game.packs.get("witchesandsnitchesforfoundry.classes");
          const doc = await pack?.getDocument(choice);
          if (doc) await actor.createEmbeddedDocuments("Item", [doc.toObject()]);
        }
      }
      await actor.setFlag(MODULE_ID, SOUND_OF_SILENCE_FLAG, true);
    }
  }

  if (actorHasFeature(actor, ISSUED_COMMAND)) {
    const feat = actor.items.find((item) => item.name === ISSUED_COMMAND);
    if (feat) {
      const prof = actor.system?.attributes?.prof ?? 2;
      const max = Math.max(1, Math.floor(prof / 2));
      await feat.update({ "system.uses.max": max, "system.uses.value": feat.system?.uses?.value ?? max, "system.uses.per": "lr" });
    }
  }

  if (actorHasFeature(actor, DOUBLE_CAST)) {
    const feat = actor.items.find((item) => item.name === DOUBLE_CAST);
    if (feat && (!feat.system?.uses || feat.system?.uses?.max !== 1)) {
      await feat.update({ "system.uses.max": 1, "system.uses.value": 1, "system.uses.per": "lr" });
    }
  }

  if (actorHasFeature(actor, CALLED_SHOT)) {
    const feat = actor.items.find((item) => item.name === CALLED_SHOT);
    if (feat && (!feat.system?.uses || feat.system?.uses?.max !== 2)) {
      await feat.update({ "system.uses.max": 2, "system.uses.value": 2, "system.uses.per": "lr" });
    }
  }
});

Hooks.on("midi-qol.preTargeting", async (workflow) => {
  const actor = workflow.actor;
  if (!actor || !actorHasFeature(actor, DOUBLE_CAST)) return;
  const feat = actor.items.find((item) => item.name === DOUBLE_CAST);
  if (!feat || feat.system?.uses?.value <= 0) return;
  const item = workflow.item;
  if (!item || item.type !== "spell") return;
  if ((item.system?.level ?? 0) < 1) return;
  const damageParts = item.system?.damage?.parts ?? [];
  if (damageParts.length) return;

  const use = await promptSelection("Double Cast", [
    { value: "yes", label: "Use Double Cast" },
    { value: "no", label: "Do Not Use" }
  ]);
  if (use !== "yes") return;

  const token = workflow.token ?? actor.getActiveTokens()?.[0];
  if (!token) return;
  const inRange = canvas.tokens.placeables.filter((t) => {
    if (!t.actor || t === token) return false;
    if (token.distanceTo(t) > (item.system?.range?.value ?? 0)) return false;
    return t.document.disposition !== token.document.disposition;
  });
  const selection = await promptSelection(
    "Double Cast Target",
    inRange.map((t) => ({ value: t.id, label: t.name }))
  );
  if (!selection) return;
  const target = canvas.tokens.get(selection);
  if (target) {
    workflow.targets.add(target);
    await feat.update({ "system.uses.value": feat.system.uses.value - 1 });
  }
});

Hooks.on("updateCombat", (combat, changed) => {
  if (!changed.turn && changed.turn !== 0) return;
  if (!combat.turns?.length) return;
  const currentActor = combat.combatant?.actor;
  if (currentActor && actorHasFeature(currentActor, ISSUED_COMMAND)) {
    currentActor.unsetFlag(MODULE_ID, ISSUED_COMMAND_FLAG);
  }
});

Hooks.on("midi-qol.RollComplete", async (workflow) => {
  const actor = workflow.actor;
  if (!actor || !actorHasFeature(actor, ISSUED_COMMAND)) return;
  if (workflow.item?.name !== ISSUED_COMMAND) return;
  const roundKey = getTurnKey();
  const used = actor.getFlag(MODULE_ID, ISSUED_COMMAND_FLAG);
  if (used === roundKey) return;

  const feat = actor.items.find((item) => item.name === ISSUED_COMMAND);
  if (!feat || feat.system?.uses?.value <= 0) return;

  const allies = canvas.tokens.placeables.filter((t) => {
    if (!t.actor) return false;
    const token = workflow.token ?? actor.getActiveTokens()?.[0];
    if (!token) return false;
    return t.document.disposition === token.document.disposition && t !== token;
  });
  if (!allies.length) return;
  const allyChoice = await promptSelection(
    "Issued Command - Ally",
    allies.map((t) => ({ value: t.id, label: t.name }))
  );
  if (!allyChoice) return;

  const spells = actor.items.filter((item) => item.type === "spell");
  if (!spells.length) return;
  const spellChoice = await promptSelection(
    "Issued Command - Spell",
    spells.map((spell) => ({ value: spell.id, label: spell.name }))
  );
  if (!spellChoice) return;

  await feat.update({ "system.uses.value": feat.system.uses.value - 1 });
  await actor.setFlag(MODULE_ID, ISSUED_COMMAND_FLAG, roundKey);

  const ally = canvas.tokens.get(allyChoice);
  const spell = actor.items.get(spellChoice);
  if (!ally || !spell) return;

  ChatMessage.create({
    content: `${ally.name} is commanded to cast ${spell.name}.`
  });
});

Hooks.on("updateActor", async (actor, data) => {
  if (!actorHasFeature(actor, DURABLE_SPELLWORK)) return;
  const concentrating = actor.system?.attributes?.concentration ?? null;
  const hasEffect = actor.effects.some((fx) => fx.name === DURABLE_SPELLWORK);
  if (concentrating && !hasEffect) {
    await actor.createEmbeddedDocuments("ActiveEffect", [
      {
        name: DURABLE_SPELLWORK,
        icon: "icons/svg/shield.svg",
        changes: [
          { key: "system.attributes.ac.bonus", mode: 2, value: 2 },
          { key: "system.bonuses.abilities.save", mode: 2, value: 2 }
        ]
      }
    ]);
  }
  if (!concentrating && hasEffect) {
    const effect = actor.effects.find((fx) => fx.name === DURABLE_SPELLWORK);
    if (effect) await effect.delete();
  }
});

Hooks.on("midi-qol.preItemRoll", async (workflow) => {
  const actor = workflow.actor;
  if (!actor || !actorHasFeature(actor, SOUND_OF_SILENCE)) return;
  const spell = workflow.item;
  if (!spell || spell.type !== "spell" || (spell.system?.level ?? 0) > 1) return;
  const metamagic = workflow.options?.midiqol?.metamagic ?? [];
  if (!metamagic.includes("subtle")) return;
  await gainSorceryPoints(actor, 1);
});

Hooks.on("midi-qol.postAttackRoll", async (workflow) => {
  const actor = workflow.actor;
  if (!actor || !actorHasFeature(actor, CALLED_SHOT)) return;
  if (!workflow.attackRoll) return;
  if (workflow.hitTargets?.size) return;
  const feat = actor.items.find((item) => item.name === CALLED_SHOT);
  if (!feat || feat.system?.uses?.value <= 0) return;

  const use = await promptSelection("Called Shot", [
    { value: "yes", label: "Use Called Shot" },
    { value: "no", label: "Do Not Use" }
  ]);
  if (use !== "yes") return;

  await feat.update({ "system.uses.value": feat.system.uses.value - 1 });
  const reroll = await workflow.attackRoll.reroll({ advantage: true });
  workflow.attackRoll = reroll;
});

Hooks.on("midi-qol.preSave", (workflow) => {
  const actor = workflow.actor;
  if (!actor || !actorHasFeature(actor, FORCE_OF_WILL)) return;
  const item = workflow.item;
  if (!item || item.type !== "spell") return;
  if (item.getFlag(MODULE_ID, "wsSchool") !== "Charms") return;
  workflow.disadvantage = true;
});

Hooks.on("createMeasuredTemplate", (template) => {
  const item = template?.flags?.dnd5e?.origin?.item;
  if (!item) return;
  const actor = item.actor;
  if (!actor || !actorHasFeature(actor, FORCE_OF_WILL)) return;
  if (item.getFlag(MODULE_ID, "wsSchool") !== "Charms") return;
  const types = ["cone", "cube", "line", "sphere", "circle", "rect", "ray"];
  if (!types.includes(template.t)) return;
  template.update({ distance: template.distance * 2, width: template.width ? template.width * 2 : undefined });
});
