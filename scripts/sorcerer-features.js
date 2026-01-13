const SORCERER_FEATURES = [
  {
    name: "Font of Magic",
    description: `
      <p>At 2nd level, you tap into a deep wellspring of magic within yourself. This wellspring is represented by sorcery points, which allow you to create a variety of magical effects.</p>
      <p>Sorcery Points. You have 2 sorcery points, and you gain more as you reach higher levels, as shown in the Sorcery Points column of the Sorcerer table. You can never have more sorcery points than shown on the table for your level. You regain all spent sorcery points when you finish a short rest.</p>
      <p>Flexible Casting. You can use your sorcery points to gain additional spell slots, or sacrifice spell slots to gain additional sorcery points. You learn other ways to use your sorcery points as you reach higher levels.</p>
      <p>Creating Spell Slots. You can transform unexpended sorcery points into one spell slot as a bonus action on your turn. The Creating Spell Slots table shows the cost of creating a spell slot of a given level. You can create spell slots no higher in level than 5th. Any spell slot you create with this feature vanishes when you finish a long rest.</p>
      <p>Converting a Spell Slot to Sorcery Points. As a bonus action on your turn, you can expend one spell slot and gain a number of sorcery points equal to the slot's level.</p>
      <p>(Spell slots table attached)</p>
      <table>
        <thead>
          <tr>
            <th>Spell Slot Level</th>
            <th>Sorcery Point Cost</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>1st</td><td>2</td></tr>
          <tr><td>2nd</td><td>3</td></tr>
          <tr><td>3rd</td><td>5</td></tr>
          <tr><td>4th</td><td>6</td></tr>
          <tr><td>5th</td><td>7</td></tr>
        </tbody>
      </table>
    `
  },
  {
    name: "Metamagic",
    description: `
      <p>At 3rd level, you gain the ability to twist your spells to suit your needs. You gain two of the following Metamagic options of your choice. You gain another one at 10th and 17th level.</p>
      <p>You can use only one Metamagic option on a spell when you cast it, unless otherwise noted.</p>
    `
  },
  {
    name: "Careful Spell",
    description:
      "<p>When you cast a spell that forces other creatures to make a saving throw, you can protect some of those creatures from the spell's full force. To do so, you spend 1 sorcery point and choose a number of those creatures up to your spellcasting ability modifier (minimum of one creature). A chosen creature automatically succeeds on its saving throw against the spell.</p>"
  },
  {
    name: "Distant Spell",
    description:
      "<p>When you cast a spell that has a range of 5 feet or greater, you can spend 1 sorcery point to double the range of the spell.</p><p>When you cast a spell that has a range of touch, you can spend 1 sorcery point to make the range of the spell 30 feet.</p>"
  },
  {
    name: "Empowered Spell",
    description:
      "<p>When you roll damage for a spell, you can spend 1 sorcery point to reroll a number of the damage dice up to your spellcasting ability modifier (minimum of one). You must use the new rolls.</p><p>You can use Empowered Spell even if you have already used a different Metamagic option during the casting of the spell.</p>"
  },
  {
    name: "Extended Spell",
    description:
      "<p>When you cast a spell that has a duration of 1 minute or longer, you can spend 1 sorcery point to double its duration, to a maximum duration of 24 hours.</p>"
  },
  {
    name: "Heightened Spell",
    description:
      "<p>When you cast a spell that forces a creature to make a saving throw to resist its effects, you can spend 3 sorcery points to give one target of the spell disadvantage on its first saving throw made against the spell.</p>"
  },
  {
    name: "Quickened Spell",
    description:
      "<p>When you cast a spell that has a casting time of 1 action, you can spend 2 sorcery points to change the casting time to 1 bonus action for this casting.</p>"
  },
  {
    name: "Subtle Spell",
    description:
      "<p>When you cast a spell, you can spend 1 sorcery point to cast it without any somatic or verbal components.</p>"
  },
  {
    name: "Twinned Spell",
    description:
      "<p>When you cast a spell that targets only one creature and doesn’t have a range of self, you can spend a number of sorcery points equal to the spell’s level to target a second creature in range with the same spell (1 sorcery point if the spell is a cantrip).</p>"
  },
  {
    name: "Sorcerer Spell Slots",
    description: `
      <table>
        <thead>
          <tr>
            <th>Slot→ Level</th>
            <th>1st</th>
            <th>2nd</th>
            <th>3rd</th>
            <th>4th</th>
            <th>5th</th>
            <th>6th</th>
            <th>7th</th>
            <th>8th</th>
            <th>9th</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>1st</td><td>2</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>
          <tr><td>2nd</td><td>3</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>
          <tr><td>3rd</td><td>4</td><td>2</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>
          <tr><td>4th</td><td>4</td><td>3</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>
          <tr><td>5th</td><td>4</td><td>3</td><td>2</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>
          <tr><td>6th</td><td>4</td><td>3</td><td>3</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>
          <tr><td>7th</td><td>4</td><td>3</td><td>3</td><td>1</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>
          <tr><td>8th</td><td>4</td><td>3</td><td>3</td><td>2</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>
          <tr><td>9th</td><td>4</td><td>3</td><td>3</td><td>3</td><td>1</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>
          <tr><td>10th</td><td>4</td><td>3</td><td>3</td><td>3</td><td>2</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>
          <tr><td>11th</td><td>4</td><td>3</td><td>3</td><td>3</td><td>2</td><td>1</td><td>-</td><td>-</td><td>-</td></tr>
          <tr><td>12th</td><td>4</td><td>3</td><td>3</td><td>3</td><td>2</td><td>1</td><td>-</td><td>-</td><td>-</td></tr>
          <tr><td>13th</td><td>4</td><td>3</td><td>3</td><td>3</td><td>2</td><td>1</td><td>1</td><td>-</td><td>-</td></tr>
          <tr><td>14th</td><td>4</td><td>3</td><td>3</td><td>3</td><td>2</td><td>1</td><td>1</td><td>-</td><td>-</td></tr>
          <tr><td>15th</td><td>4</td><td>3</td><td>3</td><td>3</td><td>2</td><td>1</td><td>1</td><td>1</td><td>-</td></tr>
          <tr><td>16th</td><td>4</td><td>3</td><td>3</td><td>3</td><td>2</td><td>1</td><td>1</td><td>1</td><td>-</td></tr>
          <tr><td>17th</td><td>4</td><td>3</td><td>3</td><td>3</td><td>2</td><td>1</td><td>1</td><td>1</td><td>1</td></tr>
          <tr><td>18th</td><td>4</td><td>3</td><td>3</td><td>3</td><td>3</td><td>1</td><td>1</td><td>1</td><td>1</td></tr>
          <tr><td>19th</td><td>4</td><td>3</td><td>3</td><td>3</td><td>3</td><td>2</td><td>1</td><td>1</td><td>1</td></tr>
          <tr><td>20th</td><td>4</td><td>3</td><td>3</td><td>3</td><td>3</td><td>2</td><td>2</td><td>1</td><td>1</td></tr>
        </tbody>
      </table>
    `
  }
];

const SORCERY_POINT_RESOURCE_LABEL = "Sorcery Points";

const createFeatureData = (feature) => ({
  name: feature.name,
  type: "feat",
  system: {
    description: {
      value: feature.description
    },
    requirements: "Sorcerer"
  }
});

const getResourceUpdate = (actor, label, max) => {
  const resources = actor.system?.resources ?? {};
  const primary = resources.primary ?? {};
  const secondary = resources.secondary ?? {};

  if (!primary.label || primary.label === label) {
    return {
      path: "system.resources.primary",
      data: {
        label,
        max,
        value: Math.min(primary.value ?? max, max),
        sr: true,
        lr: true
      }
    };
  }

  if (!secondary.label || secondary.label === label) {
    return {
      path: "system.resources.secondary",
      data: {
        label,
        max,
        value: Math.min(secondary.value ?? max, max),
        sr: true,
        lr: true
      }
    };
  }

  return null;
};

const ensureSorceryPoints = async (actor) => {
  const level = actor.system?.details?.level ?? 0;
  if (level < 2) return;

  const max = level;
  const update = getResourceUpdate(actor, SORCERY_POINT_RESOURCE_LABEL, max);
  if (!update) return;

  await actor.update({
    [update.path]: update.data
  });
};

const ensureSorcererFeatures = async (actor) => {
  if (actor.type !== "character") return;

  const existing = new Set(actor.items.map((item) => item.name));
  const missing = SORCERER_FEATURES.filter((feature) => !existing.has(feature.name));
  if (missing.length) {
    await actor.createEmbeddedDocuments(
      "Item",
      missing.map((feature) => createFeatureData(feature))
    );
  }

  await ensureSorceryPoints(actor);
};

Hooks.once("ready", async () => {
  for (const actor of game.actors ?? []) {
    await ensureSorcererFeatures(actor);
  }
});

Hooks.on("createActor", async (actor) => {
  await ensureSorcererFeatures(actor);
});

Hooks.on("updateActor", async (actor, data) => {
  if (data.system?.details?.level === undefined) return;
  await ensureSorceryPoints(actor);
});
