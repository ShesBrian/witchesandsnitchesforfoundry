Hooks.once("init", () => {
  CONFIG.DND5E.skills = {
    acr: { label: "Acrobatics", ability: "dex" },
    ath: { label: "Athletics", ability: "str" },
    dec: { label: "Deception", ability: "cha" },
    her: { label: "Herbology", ability: "int" },
    hom: { label: "History of Magic", ability: "int" },
    ins: { label: "Insight", ability: "wis" },
    itm: { label: "Intimidation", ability: "cha" },
    inv: { label: "Investigation", ability: "int" },
    mcr: { label: "Magical Creatures", ability: "wis" },
    mth: { label: "Magical Theory", ability: "int" },
    med: { label: "Medicine", ability: "wis" },
    mgs: { label: "Muggle Studies", ability: "int" },
    prc: { label: "Perception", ability: "wis" },
    prf: { label: "Performance", ability: "cha" },
    per: { label: "Persuasion", ability: "cha" },
    ptm: { label: "Potion Making", ability: "wis" },
    slh: { label: "Sleight of Hand", ability: "dex" },
    ste: { label: "Stealth", ability: "dex" },
    sur: { label: "Survival", ability: "wis" }
  };

  const toolChoices = {
    ast: { label: "Astronomer's tools", ability: "wis" },
    brs: { label: "Broomstick (Vehicle)", ability: "str" },
    brd: { label: "Broomstick (Vehicle)", ability: "dex" },
    cku: { label: "Cook's utensils", ability: "wis" },
    dis: { label: "Disguise kit", ability: "cha" },
    div: { label: "Diviner's kit", ability: "wis" },
    her: { label: "Herbologist's tools", ability: "int" },
    mus: { label: "Musical instrument", ability: "cha" },
    nav: { label: "Navigator's tools", ability: "wis" },
    pot: { label: "Potioneer's kit", ability: "wis" },
    thi: { label: "Thieves' tools", ability: "dex" }
  };

  CONFIG.DND5E.tools = Object.fromEntries(
    Object.entries(toolChoices).map(([key, value]) => [key, value.label])
  );
  CONFIG.DND5E.toolProficiencies = {
    tool: {
      label: "Tools",
      choices: toolChoices
    }
  };
});
