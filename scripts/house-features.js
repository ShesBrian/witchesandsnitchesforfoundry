const MODULE_ID = "witchesandsnitches";

const HOUSE_DEFINITIONS = {
  gryffindor: {
    label: "Gryffindor",
    abilityIncreases: ["con", "cha"],
    description: `<p>Ability Score Increase: Your Constitution score, Charisma score, and one other ability score of choice increase by 1.</p><p>At first level you gain Inspiring Presence or Bravehearted and True Gryffindor.</p>`,
    options: [
      {
        label: "First Feature",
        choices: {
          "Inspiring Presence": `<p>Inspiring Presence: When in combat, your friends eagerly stand beside you as a beacon of courage and inspiration. Once per long rest, if an ally within 10 feet of you falls to 0 HP, you may use your reaction to defend them from danger. Using this ability ensures they will regain consciousness at 1 HP. An individual can only benefit from this effect once per day.</p>`,
          Bravehearted: `<p>Bravehearted: You have advantage on saving throws against being frightened from any source other than a Dementor.</p>`
        }
      }
    ],
    features: [
      {
        name: "True Gryffindor",
        description: `<p>True Gryffindor: In times of dire need, the Sword of Gryffindor may present itself to you.</p>`
      }
    ]
  },
  hufflepuff: {
    label: "Hufflepuff",
    abilityIncreases: ["con", "wis"],
    description: `<p>Ability Score Increase: Your Constitution score, Wisdom score, and one other ability score of choice increase by 1.</p><p>At first level you gain Words of Encouragement or Neg D4, and either Steadfast Loyalty or Kitchen Trips.</p>`,
    options: [
      {
        label: "First Feature",
        choices: {
          "Words of Encouragement": `<p>Words of Encouragement: You may use your reaction to give an ally who can hear you, a d4 bonus to the first attack roll, ability check, or saving throw they make before the start of your next turn. You may use this ability a number of times per long rest equal to your Charisma modifier (minimum of 1). A target may only benefit from this effect once per round.</p>`,
          "Neg D4": `<p>Neg D4: You may use your reaction to give a creature who can hear you, a d4 penalty to any attack roll, ability check, or saving throw they make before the start of your next turn. You may use this ability a number of times per long rest equal to your Charisma modifier (minimum of 1). A target may only be penalized from this effect once per round.</p>`
        }
      },
      {
        label: "Second Feature",
        choices: {
          "Steadfast Loyalty": `<p>Steadfast Loyalty: You have advantage on saving throws against any effect that would make you attack or work against a creature you would normally consider an ally.</p>`,
          "Kitchen Trips": `<p>Kitchen Trips: Your experience with the Hogwarts house elves has taught you how to politely address and interact with magical beings. Oh, and you can get tons of snacks.</p>`
        }
      }
    ],
    features: []
  },
  ravenclaw: {
    label: "Ravenclaw",
    abilityIncreases: ["int", "wis"],
    description: `<p>Ability Score Increase: Your Intelligence score, Wisdom score, and one other ability score of choice increase by 1.</p>`,
    options: [],
    features: [
      {
        name: "In-Depth Knowledge",
        description: `<p>In-Depth Knowledge: Whenever you make an Intelligence or Wisdom ability check that lets you add your proficiency bonus, you can treat a d20 roll of 5 or lower as a 6.</p>`
      },
      {
        name: "Rowena's Library",
        description: `<p>Rowena's Library: You can easily research a desired topic through enlisting your housemates' help and browsing books exclusively found in the Ravenclaw common room.</p>`
      }
    ]
  },
  slytherin: {
    label: "Slytherin",
    abilityIncreases: ["dex", "cha"],
    description: `<p>Ability Score Increase: Your Dexterity score, Charisma score, and one other ability score of choice increase by 1.</p>`,
    options: [],
    features: [
      {
        name: "Compromising Information",
        description: `<p>Compromising Information: Whenever you make a Charisma check related to using a person's secrets, you are considered proficient in the appropriate skill and add double your proficiency bonus to the check, instead of your normal proficiency bonus.</p>`
      },
      {
        name: "A Noble Quality",
        description: `<p>A Noble Quality: You're able to adopt a persona of importance to blend in among high-ranking officials and prestigious witches and wizards.</p>`
      }
    ]
  },
  beauxbatons: {
    label: "Beauxbatons",
    abilityIncreases: ["dex", "wis"],
    description: `<p>Ability Score Increase: Your Dexterity score, Wisdom score, and one other ability score of choice increase by 1.</p>`,
    options: [],
    features: [
      {
        name: "Nimble Evasion",
        description: `<p>Nimble Evasion: When you are subjected to an effect that allows you to make a Strength or Dexterity saving throw to take only half damage, you instead take no damage if you succeed on the saving throw, and only half damage if you fail.</p>`
      },
      {
        name: "Exchange Student",
        description: `<p>Exchange Student: You're familiar with the culture of other Wizarding Governments and Institutions. You may make an insight check to understand and emulate their culture, fit in seamlessly with your new peers, and make them view you more favorably. You may use this feature once per day.</p>`
      }
    ]
  },
  durmstrang: {
    label: "Durmstrang",
    abilityIncreases: ["str", "con"],
    description: `<p>Ability Score Increase: Your Strength score, Constitution score, and one other ability score of choice increase by 1.</p>`,
    options: [],
    features: [
      {
        name: "Cold Efficiency",
        description: `<p>Cold Efficiency: You add the Bombarda spell to your list of known spells. You may cast it as a bonus action during any combat.</p>`
      },
      {
        name: "Aggressive Endurance",
        description: `<p>Aggressive Endurance: When you take damage that would reduce you to 0 hit points, you stay conscious and continue acting until the end of your next turn. If you do not receive healing by then, you fall unconscious. Once you use this feature, you cannot do so again until you finish a long rest.</p>`
      }
    ]
  },
  uagadou: {
    label: "Uagadou",
    abilityIncreases: ["str", "dex"],
    description: `<p>Ability Score Increase: Your Strength score, Dexterity score, and one other ability of your choice increase by 1.</p>`,
    options: [],
    features: [
      {
        name: "Lesser Animagus",
        description:
          `<p>Lesser Animagus: You gain one Animagus form of your choice using the stat block of a bat, cat, crab, frog (toad), hawk, lizard, octopus, owl, poisonous snake, fish (quipper), rat, raven, sea horse, spider (Tarantula), or weasel. You gain this feature at 6th level.</p>`
      },
      {
        name: "I’d Rather Use My Hands",
        description:
          `<p>I’d Rather Use My Hands: Your Wandless Magic training at school makes using a wand feel foreign and uncomfortable in your fingers. You may add half your Dexterity bonus to your spell attempts when attempting to cast a spell wandlessly, rounded down. You must have the Wandless Magic or Superior Wandless Magic feat to do so.</p>`
      }
    ]
  },
  mahoutokoro: {
    label: "Mahoutokoro",
    abilityIncreases: ["dex", "int"],
    description: `<p>Ability Score Increase: Your Dexterity score, Intelligence score, and one other ability of your choice increase by 1.</p>`,
    options: [],
    features: [
      {
        name: "Quidditch Fanatic",
        description:
          `<p>Quidditch Fanatic: You gain tool proficiency with Brooms. Additionally, if you take the Quidditch Fan background or the Aerial Combatant Feat, you gain Expertise with Brooms instead.</p>`
      },
      {
        name: "Locked in spells",
        description:
          `<p>Locked in spells: Students of Mahoutokoro School start their Magical Education a year earlier than other schools, and as a result, you gain an advantage. You may choose 3 Charms spells, 3 DADA spells, and 2 Transfigurations spells from the First Year spell list to have one successful attempt.</p>`
      }
    ]
  },
  castelobruxo: {
    label: "Castelobruxo",
    abilityIncreases: ["con", "dex"],
    description: `<p>Ability Score Increase: Your Constitution score, Dexterity score, and one other ability of your choice increase by 1.</p>`,
    options: [],
    features: [
      {
        name: "Beast Finder",
        description:
          `<p>Beast Finder: Castelobruxo School in Brazil has an intense focus on magics of the natural world and how to recognize and utilize them. You can use your action to spend one spell slot to focus your awareness on the region around you. For 1 minute per level of the spell slot you expend, you can sense Magical Creatures within 100 Feet of you. You may additionally make a Magical Creatures check to identify what kind of creatures you sensed. This feature doesn’t reveal the creatures’ location or number.</p>`
      },
      {
        name: "Toxicology Specialist",
        description:
          `<p>Toxicology Specialist: Your training with handling dangerous and poisonous plants has caused you to be able to resist the effects of poisons. You have advantage on any constitution saving throws to resist poison damage or being poisoned.</p>`
      }
    ]
  },
  koldovstoretz: {
    label: "Koldovstoretz",
    abilityIncreases: ["str", "wis"],
    description: `<p>Ability Score Increase: Your Strength score, Wisdom score, and one other ability score of choice increase by 1.</p>`,
    options: [],
    features: [
      {
        name: "Quick Brew",
        description:
          `<p>Quick Brew: You gain Tool Proficiency with a Potioneer’s Kit. Additionally, Whenever you attempt to brew a potion outside of class, you gain two doses instead of one.</p>`
      },
      {
        name: "Improvised Brooms",
        description:
          `<p>Improvised Brooms: Koldovstoretz has a reputation for its use of uprooted trees as brooms rather than what is traditional throughout the rest of the world, and you have been taught how to make these vehicles in a pinch. If you spend 10 minutes, you can make a DC 15 Spellcasting ability check to enchant any uprooted tree into a broom.</p><p>Brooms created in this way can carry up to three medium sized creatures without being encumbered.</p>`
      }
    ]
  },
  hornedserpent: {
    label: "Horned Serpent",
    abilityIncreases: ["int", "cha"],
    description: `<p>Ability Score Increase: Your Intelligence score, Charisma score, and one other ability score of choice increase by 1.</p>`,
    options: [],
    features: [
      {
        name: "Scholar's Mind",
        description:
          `<p>Scholar's Mind: You add half your proficiency bonus to any Intelligence or Charisma ability check you make that doesn't already include your proficiency bonus.</p>`
      },
      {
        name: "Procedural Thinking",
        description:
          `<p>Procedural Thinking: You enjoy testing yourself with riddles and logic puzzles. If you get stuck on one, make an investigation check at advantage and you might subconsciously connect a few dots.</p>`
      }
    ]
  },
  wampuscat: {
    label: "Wampus Cat",
    abilityIncreases: ["dex", "con"],
    description: `<p>Ability Score Increase: Your Dexterity score, Constitution score, and one other ability score of choice increase by 1.</p>`,
    options: [],
    features: [
      {
        name: "Warrior's Endurance",
        description:
          `<p>Warrior's Endurance: When you roll a 16 or higher on a death saving throw, you instantly regain 1 hit point. You can't use this feature again until you finish a long rest.</p>`
      },
      {
        name: "Contagious Valor",
        description:
          `<p>Contagious Valor: As an action, you unleash a battle cry infused with arcane energy. Up to ten other creatures of your choice within 60 feet of you that can hear you gain advantage on attack rolls and saving throws until the start of your next turn.</p><p>Once you use this feature, you can’t use it again until you finish a long rest.</p>`
      }
    ]
  },
  thunderbird: {
    label: "Thunderbird",
    abilityIncreases: ["str", "cha"],
    description: `<p>Ability Score Increase: Your Strength score, Charisma score, and one other ability score of choice increase by 1.</p>`,
    options: [],
    features: [
      {
        name: "Adventurer's Footing",
        description:
          `<p>Adventurer's Footing: Moving through difficult terrain costs you no extra movement, your walking speed increases by 5, and you gain a climbing speed and a swimming speed equal to your walking speed.</p>`
      },
      {
        name: "Dependable Bearings",
        description:
          `<p>Dependable Bearings: You have a good sense of direction and can easily use notable landmarks and geography to remember the general layout of areas. Additionally, you gain advantage in survival checks for navigation.</p>`
      }
    ]
  },
  pukwudgie: {
    label: "Pukwudgie",
    abilityIncreases: ["wis", "cha"],
    description: `<p>Ability Score Increase: Your Wisdom score, Charisma score, and one other ability score of choice increase by 1.</p>`,
    options: [],
    features: [
      {
        name: "Healer's Knack",
        description:
          `<p>Healer's Knack: Whenever you cast a healing spell, any affected creatures gain Temporary hit points equal to 1 + your Wisdom or Charisma Modifier (Whichever is higher).</p>`
      },
      {
        name: "A Diplomatic Touch",
        description:
          `<p>A Diplomatic Touch: If you assist a hostile creature in a meaningful way, they're more likely to reconsider their hostility towards you, potentially defusing the situation.</p>`
      }
    ]
  }
};

const FEATURE_ITEM_FLAG = `${MODULE_ID}.houseFeature`;
const HOUSE_FLAG = `${MODULE_ID}.house`;
const HOUSE_SELECTION_FLAG = `${MODULE_ID}.houseSelections`;

const abilityLabels = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma"
};

const createHouseFeat = (name, description, effects = []) => ({
  name,
  type: "feat",
  system: {
    description: { value: description }
  },
  effects,
  flags: {
    [MODULE_ID]: {
      houseFeature: true
    }
  }
});

const buildAbilityEffects = (abilities) =>
  abilities.map((ability) => ({
    key: `system.abilities.${ability}.value`,
    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
    value: 1
  }));

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

const selectHouseForActor = async (actor) => {
  const options = Object.entries(HOUSE_DEFINITIONS).map(([key, house]) => ({
    value: key,
    label: house.label
  }));
  return promptSelection(`Select House for ${actor.name}`, options);
};

const selectAbilityIncrease = async (house) => {
  const options = Object.keys(abilityLabels)
    .filter((ability) => !house.abilityIncreases.includes(ability))
    .map((ability) => ({
      value: ability,
      label: abilityLabels[ability]
    }));
  return promptSelection("Select Ability Score Increase", options);
};

const selectOptionChoice = async (option) => {
  const options = Object.keys(option.choices).map((choice) => ({
    value: choice,
    label: choice
  }));
  return promptSelection(`Select ${option.label}`, options);
};

const houseFeatItem = () =>
  createHouseFeat("House Feat", `<p>Feat: You gain one feat of your choice.</p>`);

const ensureHouseFeatures = async (actor) => {
  if (actor.type !== "character") return;

  let houseKey = actor.getFlag(MODULE_ID, "house");
  let selections = actor.getFlag(MODULE_ID, "houseSelections") ?? {};

  if (!houseKey) {
    houseKey = await selectHouseForActor(actor);
    if (!houseKey) return;
    await actor.setFlag(MODULE_ID, "house", houseKey);
  }

  const house = HOUSE_DEFINITIONS[houseKey];
  if (!house) return;

  if (!selections.ability) {
    selections = {
      ...selections,
      ability: await selectAbilityIncrease(house)
    };
    if (!selections.ability) return;
    await actor.setFlag(MODULE_ID, "houseSelections", selections);
  }

  const optionSelections = selections.options ?? {};
  const updatedOptions = { ...optionSelections };

  for (const option of house.options) {
    if (!updatedOptions[option.label]) {
      const choice = await selectOptionChoice(option);
      if (!choice) return;
      updatedOptions[option.label] = choice;
    }
  }

  if (Object.keys(updatedOptions).length !== Object.keys(optionSelections).length) {
    await actor.setFlag(MODULE_ID, "houseSelections", {
      ...selections,
      options: updatedOptions
    });
  }

  const existingNames = new Set(
    actor.items
      .filter((item) => item.flags?.[MODULE_ID]?.houseFeature)
      .map((item) => item.name)
  );

  const abilityEffects = buildAbilityEffects([
    ...house.abilityIncreases,
    selections.ability
  ]);

  const itemsToCreate = [];

  if (!existingNames.has(`${house.label} House Features`)) {
    itemsToCreate.push(
      createHouseFeat(
        `${house.label} House Features`,
        house.description,
        [
          {
            label: `${house.label} Ability Score Increase`,
            icon: "icons/svg/upgrade.svg",
            changes: abilityEffects
          }
        ]
      )
    );
  }

  if (!existingNames.has("House Feat")) {
    itemsToCreate.push(houseFeatItem());
  }

  for (const feature of house.features) {
    if (!existingNames.has(feature.name)) {
      itemsToCreate.push(createHouseFeat(feature.name, feature.description));
    }
  }

  for (const option of house.options) {
    const choiceName = updatedOptions[option.label];
    if (choiceName && !existingNames.has(choiceName)) {
      itemsToCreate.push(createHouseFeat(choiceName, option.choices[choiceName]));
    }
  }

  if (itemsToCreate.length) {
    await actor.createEmbeddedDocuments("Item", itemsToCreate);
  }
};

Hooks.once("ready", async () => {
  for (const actor of game.actors ?? []) {
    await ensureHouseFeatures(actor);
  }
});

Hooks.on("createActor", async (actor) => {
  await ensureHouseFeatures(actor);
});
