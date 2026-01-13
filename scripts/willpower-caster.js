const MODULE_ID = "witchesandsnitchesforfoundry";

const WILLPOWER_CASTER_FLAG = "castingStyle";
const WILLPOWER_STYLE_KEY = "willpower";

const WILLPOWER_FEATURES = [
  {
    name: "Spellcasting",
    description: `<p>Charisma is your spellcasting ability for your spells. You use your Charisma whenever a spell refers to your spellcasting ability. In addition, you use your Charisma modifier when setting the saving throw DC for a spell you cast and when making an attack roll with one.</p><p>You must use a wand as a spellcasting focus for your spells. Your spell slot progression is the standard for full casters.</p>`
  },
  {
    name: "Sorcerous Resilience",
    description: `<p>The accidental magic in your early childhood never stopped protecting you. Your AC equals 15 + your Dexterity modifier.</p>`,
    effects: [
      {
        label: "Sorcerous Resilience",
        icon: "icons/svg/shield.svg",
        changes: [
          {
            key: "system.attributes.ac.calc",
            mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
            value: "custom"
          },
          {
            key: "system.attributes.ac.formula",
            mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
            value: "15 + @abilities.dex.mod"
          }
        ]
      }
    ]
  },
  {
    name: "Reckless Magic",
    description: `<p>You can throw aside all concern for defense to attack with fierce desperation. When you make your first attack on your turn, you can decide to attack recklessly. Doing so gives you advantage on spell attack rolls during this turn, but attack rolls against you have advantage until your next turn.</p>`
  },
  {
    name: "Black Magic",
    description: `<p>Once per turn, you can deal an extra 1d6 damage to one creature you hit with a cantrip or melee weapon attack if you have advantage on the attack roll.</p><p>You don't need advantage on the attack roll if another enemy of the target is within 5 feet of it, that enemy isn't incapacitated, and you don't have disadvantage on the attack roll.</p><p>Additionally, at 5th level, you may choose one of the following options:</p><p>Ambush. You have advantage on attack rolls against any creature that hasn't taken a turn in the combat yet. In addition, any hit you score against a creature that is surprised is a critical hit.</p><p>Gambit. You don't need advantage on the attack roll to use your Black Magic against a creature if you are within 5 feet of it, no other creatures are within 5 feet of you, and you don't have disadvantage on the attack roll. All the other rules for Black Magic still apply to you.</p><p>Grudge. You gain advantage on attack rolls against a creature that has damaged you since the end of your last turn.</p><p>Pique. You have advantage on attack rolls when you have half of your hitpoints or less.</p><p>Hubris. You gain advantage on attack rolls against any creature that has fewer hit points than you.</p><p>Your Black Magic die increases to 2d6 at 3rd level, 3d6 at 5th level, 4d6 at 7th, 5d6 at 9th, 6d6 at 11th, 7d6 at 13th, 8d6 at 15th, 9d6 at 17th, and 10d6 at 19th</p>`
  },
  {
    name: "Font of Magic, Metamagic, and Ability Score Improvement",
    description: `<p>Unless differences are shown in the Willpower class table, a Willpower caster has all Font of Magic, Sorcery Points, Flexible Casting, Metamagic, and Ability Score Improvement class features from a 5e Sorcerer.</p>`
  },
  {
    name: "Metamagic: Fierce Spell",
    description: `<p>At 3rd level, when you cast a spell, you can spend 2 sorcery points to cast that spell as if it were cast using a spell slot one level higher than its original level, or 4 sorcery points to cast that spell two levels higher. The spell's higher level cannot exceed your highest available level of spell slots. This does not count against your number of Metamagic options.</p>`
  },
  {
    name: "Metamagic: Resistant Spell",
    description: `<p>At 3rd level, when you cast a spell, you can spend 1 sorcery point per increased level to make your spell be treated by spell deflection, finite incantatem, reparifarge, or langlock as if your spell was cast using a spell slot higher than its original level, making your spell more resistant. The spell's higher level cannot exceed your highest available level of spell slots. This does not count against your number of Metamagic options.</p>`
  },
  {
    name: "Signature Spells",
    description: `<p>When you reach 20th level, you gain mastery over two powerful spells and can cast them with little effort. Choose two of your known 3rd-level spells as your signature spells. You can cast each of them once at 3rd level without expending a spell slot. When you do so, you can’t do so again until you finish a short or long rest.</p>`
  }
];

const WILLPOWER_SKILL_CHOICES = [
  "ath",
  "acr",
  "dec",
  "itm",
  "hom",
  "mcr",
  "per",
  "slh",
  "sur"
];

const ABILITY_LABELS = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma"
};

const ASI_LEVELS = [4, 8, 12, 16, 19];
const METAMAGIC_COUNTS = [
  { level: 3, count: 2 },
  { level: 10, count: 3 },
  { level: 17, count: 4 }
];

const createFeatureItem = (feature) => ({
  name: feature.name,
  type: "feat",
  system: {
    description: { value: feature.description }
  },
  effects: feature.effects ?? [],
  flags: {
    [MODULE_ID]: {
      willpowerFeature: true
    }
  }
});

const promptSelection = async (title, options) =>
  new Promise((resolve) => {
    const optionHtml = options
      .map((option) => `<option value="${option.value}">${option.label}</option>`)
      .join("");
    new Dialog({
      title,
      content: `<form><div class="form-group"><select name="choice">${optionHtml}</select></div></form>`,
      buttons: {
        ok: {
          label: "Confirm",
          callback: (html) => resolve(html.find("[name=choice]").val())
        }
      },
      default: "ok",
      close: () => resolve(null)
    }).render(true);
  });

const promptMultiSelection = async (title, options, count) =>
  new Promise((resolve) => {
    const optionHtml = options
      .map(
        (option) =>
          `<label><input type="checkbox" name="choice" value="${option.value}"/> ${option.label}</label>`
      )
      .join("<br />");
    new Dialog({
      title,
      content: `<form><div class="form-group">${optionHtml}</div><p>Select ${count}.</p></form>`,
      buttons: {
        ok: {
          label: "Confirm",
          callback: (html) => {
            const values = html
              .find("input[name=choice]:checked")
              .map((_, el) => el.value)
              .get();
            resolve(values.length === count ? values : null);
          }
        }
      },
      default: "ok",
      close: () => resolve(null)
    }).render(true);
  });

const ensureWillpowerStyle = async (actor) => {
  if (actor.type !== "character") return false;

  const currentStyle = actor.getFlag(MODULE_ID, WILLPOWER_CASTER_FLAG);
  if (currentStyle) return currentStyle === WILLPOWER_STYLE_KEY;

  await actor.setFlag(MODULE_ID, WILLPOWER_CASTER_FLAG, WILLPOWER_STYLE_KEY);
  return true;
};

const ensureWillpowerFeatures = async (actor) => {
  const hasStyle = await ensureWillpowerStyle(actor);
  if (!hasStyle) return;

  const existingNames = new Set(
    actor.items
      .filter((item) => item.flags?.[MODULE_ID]?.willpowerFeature)
      .map((item) => item.name)
  );

  const itemsToCreate = WILLPOWER_FEATURES.filter(
    (feature) => !existingNames.has(feature.name)
  ).map((feature) => createFeatureItem(feature));

  if (itemsToCreate.length) {
    await actor.createEmbeddedDocuments("Item", itemsToCreate);
  }
};

const ensureWillpowerSpellcasting = async (actor) => {
  if (actor.system?.attributes?.spellcasting !== "cha") {
    await actor.update({ "system.attributes.spellcasting": "cha" });
  }

  const abilitiesToUpdate = {};
  if (!actor.system?.abilities?.con?.proficient) {
    abilitiesToUpdate["system.abilities.con.proficient"] = 1;
  }
  if (!actor.system?.abilities?.cha?.proficient) {
    abilitiesToUpdate["system.abilities.cha.proficient"] = 1;
  }
  if (Object.keys(abilitiesToUpdate).length) {
    await actor.update(abilitiesToUpdate);
  }
};

const ensureWillpowerSkills = async (actor) => {
  const stored = actor.getFlag(MODULE_ID, "willpowerSkills");
  if (stored?.length) return;

  const skillOptions = WILLPOWER_SKILL_CHOICES.map((key) => ({
    value: key,
    label: CONFIG.DND5E.skills?.[key]?.label ?? key
  }));

  const selection = await promptMultiSelection(
    "Select Willpower Caster Skills",
    skillOptions,
    2
  );
  if (!selection) return;

  const updates = {};
  for (const key of selection) {
    updates[`system.skills.${key}.value`] = 1;
  }
  await actor.update(updates);
  await actor.setFlag(MODULE_ID, "willpowerSkills", selection);
};

const applyAbilityScoreIncrease = async (actor, level) => {
  const flags = actor.getFlag(MODULE_ID, "willpowerAsi") ?? {};
  if (flags[level]) return;

  const abilities = Object.entries(ABILITY_LABELS).map(([value, label]) => ({
    value,
    label
  }));

  const firstChoice = await promptSelection(
    `Ability Score Improvement (Level ${level}) - First +1`,
    abilities
  );
  if (!firstChoice) return;

  const secondChoice = await promptSelection(
    `Ability Score Improvement (Level ${level}) - Second +1`,
    abilities
  );
  if (!secondChoice) return;

  const changes = [
    {
      key: `system.abilities.${firstChoice}.value`,
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: 1
    },
    {
      key: `system.abilities.${secondChoice}.value`,
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: 1
    }
  ];

  const asiItem = {
    name: `Ability Score Improvement (Level ${level})`,
    type: "feat",
    system: {
      description: {
        value: `<p>Ability Score Improvement</p>`
      }
    },
    effects: [
      {
        label: `Ability Score Improvement (Level ${level})`,
        icon: "icons/svg/upgrade.svg",
        changes
      }
    ],
    flags: {
      [MODULE_ID]: {
        willpowerFeature: true,
        asiLevel: level
      }
    }
  };

  await actor.createEmbeddedDocuments("Item", [asiItem]);
  await actor.setFlag(MODULE_ID, "willpowerAsi", { ...flags, [level]: true });
};

const ensureMetamagicCountFeature = async (actor) => {
  const level = actor.system?.details?.level ?? 0;
  let metamagicCount = 0;
  for (const entry of METAMAGIC_COUNTS) {
    if (level >= entry.level) {
      metamagicCount = entry.count;
    }
  }

  if (!metamagicCount) return;

  const flagKey = "willpowerMetamagicCount";
  if (actor.getFlag(MODULE_ID, flagKey) === metamagicCount) return;

  const itemName = `Metamagic Options (${metamagicCount})`;
  const existing = actor.items.find(
    (item) => item.flags?.[MODULE_ID]?.metamagicCount
  );

  if (existing) {
    await existing.update({
      name: itemName,
      "system.description.value": `<p>Metamagic options available: ${metamagicCount}</p>`
    });
  } else {
    await actor.createEmbeddedDocuments("Item", [
      {
        name: itemName,
        type: "feat",
        system: {
          description: {
            value: `<p>Metamagic options available: ${metamagicCount}</p>`
          }
        },
        flags: {
          [MODULE_ID]: {
            willpowerFeature: true,
            metamagicCount: metamagicCount
          }
        }
      }
    ]);
  }

  await actor.setFlag(MODULE_ID, flagKey, metamagicCount);
};

const ensureWillpowerProgression = async (actor) => {
  const level = actor.system?.details?.level ?? 0;
  if (!level) return;

  await ensureWillpowerSpellcasting(actor);
  await ensureWillpowerSkills(actor);
  await ensureWillpowerFeatures(actor);
  await ensureMetamagicCountFeature(actor);

  for (const asiLevel of ASI_LEVELS) {
    if (level >= asiLevel) {
      await applyAbilityScoreIncrease(actor, asiLevel);
    }
  }
};

Hooks.once("ready", async () => {
  for (const actor of game.actors ?? []) {
    await ensureWillpowerProgression(actor);
  }
});

Hooks.on("createActor", async (actor) => {
  await ensureWillpowerProgression(actor);
});

Hooks.on("updateActor", async (actor, data) => {
  if (data.system?.details?.level === undefined) return;
  await ensureWillpowerProgression(actor);
});
