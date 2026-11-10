console.info("[DramTweaks] addMiscRecipesDramTweaks.js loaded");

ServerEvents.recipes((e) => {
  // Smelting Example e.smelting("etcetera:bismuth_ingot", "create:crushed_raw_bismuth").xp(0.7);
  // Blasting Example e.blasting("etcetera:bismuth_ingot", "create:crushed_raw_bismuth").xp(0.7);
/*    Farmers Delight Cutting Example e.custom({
    type: "farmersdelight:cutting",
    ingredients: [{ item: "herbalbrews:lavender" }],
    tool: { tag: "forge:tools/knives" },
    result: [{ item: "herbalbrews:lavender_blossom", count: 2 }],
  }); */
/*   Farmers Delight Cooking Example e.custom({
    type: "farmersdelight:cooking",
    cookingtime: 200,
    experience: 3.0,
    container: {
      item: "minecraft:bowl",
    },
    ingredients: [
      {
        tag: "forge:raw_chicken",
      },
      {
        item: "farm_and_charm:onion",
      },
      {
        item: "farm_and_charm:corn",
      },
      {
        item: "meadow:piece_of_cheese",
      },
      { item: "farmersdelight:tomato_sauce" },
    ],
    result: {
      item: "society:chicken_tortilla_soup",
    },
  }); */
/*   Shapeless Example e.shapeless("quark:slime_in_a_bucket", [
    "society:petrified_slime",
    "species:youth_potion",
    "minecraft:bucket",
  ]); */
  // Another Shapleless Example e.shapeless("minecraft:magenta_dye", ["windswept:lavender"]);
/*   Shaped Crafting Example e.shaped("16x society:enriched_bone_meal", ["bbb", "bfb", "bbb"], {
    f: "farm_and_charm:fertilizer",
    b: "minecraft:bone_block",
  }); */

  //Stone Cutting Example e.stonecutting("moreminecarts:greenhouse_glass_stairs", "moreminecarts:chiseled_organic_glass");

/*   Vintage Delight Fermenting Example e.custom({
    type: "vintagedelight:fermenting",
    processingTime: 10000,
    container: {
      item: "minecraft:glass_bottle",
    },
    ingredients: [
      {
        item: "minecraft:glow_berries",
      },
    ],
    output: {
      count: 1,
      item: "supplementaries:lumisene_bottle",
    },
  }); */
  /* Bulk Shapless Example[
    { input: "meadow:flecked_wool", output: "minecraft:brown_wool" },
    { input: "meadow:highland_wool", output: "minecraft:brown_wool" },
    { input: "meadow:patched_wool", output: "minecraft:blue_wool" },
    { input: "meadow:rocky_wool", output: "minecraft:light_gray_wool" },
    { input: "meadow:umbra_wool", output: "minecraft:light_blue_wool" },
    { input: "meadow:inky_wool", output: "minecraft:black_wool" },
    { input: "meadow:warped_wool", output: "minecraft:cyan_wool" },
  ].forEach((recipe) => {
    e.shapeless(recipe.output, [recipe.input]);
  }); */
  // Wallpapers
/*   Bulk Shaped Example const wallpaperPattern = ["ppp", "pfp", "ppp"];
  const baseboardPattern = ["ppp", "pfp", "bbb"];

  e.shaped("8x society:pink_flower_wallpaper", wallpaperPattern, {
    f: "minecraft:pink_tulip",
    p: "minecraft:paper", */

  // Chisels and Bits  
  e.smithing(
    "chiselsandbits:chisel_netherite",
    "minecraft:netherite_upgrade_smithing_template",
    "chiselsandbits:chisel_diamond",
    "minecraft:netherite_ingot"
  );
    e.smithing(
    "chiselsandbits:chisel_diamond",
    "society:diamond_upgrade_smithing_template",
    "chiselsandbits:chisel_gold",
    "minecraft:diamond"
  );  
    e.smithing(
    "chiselsandbits:chisel_gold",
    "society:gold_upgrade_smithing_template",
    "chiselsandbits:chisel_iron",
    "minecraft:gold_ingot"
  );
    e.smithing(
    "chiselsandbits:chisel_iron",
    "society:iron_upgrade_smithing_template",
    "chiselsandbits:chisel_stone",
    "minecraft:iron_ingot"
  );

  // Butchery
  const tiers = [
    { result: 'iron', template: 'society:iron_upgrade_smithing_template', mat: 'minecraft:iron_ingot', prev: 'bone' },
    { result: 'gold', template: 'society:gold_upgrade_smithing_template', mat: 'minecraft:gold_ingot', prev: 'iron' },
    { result: 'diamond', template: 'society:diamond_upgrade_smithing_template', mat: 'minecraft:diamond', prev: 'gold' },
    { result: 'netherite', template: 'minecraft:netherite_upgrade_smithing_template', mat: 'minecraft:netherite_ingot', prev: 'diamond' }
  ];

  // List the tool types from the Butchery mod
  const butcheryTools = ['cleaver', 'skinning_knife', 'hammer', 'hacksaw'];

  // Loop through each tool type
  butcheryTools.forEach(tool => {
    // Loop through each tier to create the smithing recipe
    tiers.forEach(tier => {
      e.smithing(
        `butchery:${tier.result}_${tool}`,         // Output
        tier.template,                             // Template
        `butchery:${tier.prev}_${tool}`,           // Base Item
        tier.mat                                   // Ingredient
      );
    });
  });
  
  // Create Encased
  const materials = [
    { name: 'brass', casing: 'create:brass_casing' },
    { name: 'copper', casing: 'create:copper_casing' },
    { name: 'railway', casing: 'create:railway_casing' },
    { name: 'industrial_iron', casing: 'create:industrial_iron_block' },
    { name: 'weathered_iron', casing: 'create:weathered_iron_block' }
  ]

  materials.forEach(mat => {

    //Define Item ID String Once Per Loop
    let saw = 'createcasing:'+ mat.name + '_mechanical_saw';
    let harvester = 'createcasing:' + mat.name + '_mechanical_harvester';
    let drill = 'createcasing:' + mat.name + '_mechanical_drill';
    let mixer = 'createcasing:' + mat.name + '_mixer';
    let press = 'createcasing:' + mat.name + '_press';
    let conveyor = 'createcasing:' + mat.name + '_chain_conveyor';
    let deployer = 'createcasing:' + mat.name + '_deployer';
    let fan = 'createcasing:' + mat.name + '_encased_fan';

    // 1. Mechanical Saw Recipes
    e.shaped(saw, ["oco", "nnn", "AaA"], {
      a: mat.casing,
      o: "create:powdered_obsidian",
      A: "minecraft:netherite_upgrade_smithing_template",
      c: "numismatics:ancient_coin",
      n: "minecraft:netherite_ingot"
    })

    e.shaped('2x ' + saw, ["chc"], {
      h: `createcasing:${mat.name}_mechanical_saw`,
      c: "minecraft:netherite_upgrade_smithing_template"
    })

    // 2. Mechanical Harvester Recipes
    e.shaped(harvester, ["pcp", "hhh", "oao"], {
      o: "create:powdered_obsidian",
      a: mat.casing,
      h: "minecraft:netherite_ingot",
      c: "numismatics:ancient_coin",
      p: "society:prismatic_shard"
    })

    e.shaped('2x ' + harvester, ["shs"], {
      h: `createcasing:${mat.name}_mechanical_harvester`,
      s: "minecraft:netherite_upgrade_smithing_template"
    })

    // 3. Mechanical Drill Recipes
    e.shaped(drill, ["cPo", "PpP", "oPa"], {
      o: "create:powdered_obsidian",
      a: mat.casing,
      P: "minecraft:netherite_ingot",
      c: "numismatics:ancient_coin",
      p: "society:prismatic_shard"
    })

    e.shaped('2x ' + drill, ["chc"], {
      h: `createcasing:${mat.name}_mechanical_drill`,
      c: "minecraft:netherite_upgrade_smithing_template"
    })

    // 4. Mixer
    e.shaped(mixer, [" g ", "LcL", " w "], {
      g: "create:cogwheel",
      L: "oreganized:lead_ingot",
      c: mat.casing,
      w: "create:whisk",
    })

      // 5. Press
    e.shaped(press, [" g ", " c ", " w "], {
      g: "create:shaft",
      c: mat.casing,
      w: "oreganized:lead_block",
    })

      // 6. Conveyor
    e.shaped('2x ' + conveyor, ["LcL", "cgc", "LcL"], {
      g: "create:large_cogwheel",
      L: "oreganized:lead_ingot",
      c: mat.casing,
    })

      // 7. Deployer
    e.shaped(deployer, [" g ", "LcL", " w "], {
      g: "create:electron_tube",
      L: "oreganized:lead_ingot",
      c: mat.casing,
      w: "create:brass_hand",
    })

      // 4. Encased Fan
    e.shaped(fan, [" g ", "LcL", " w "], {
      g: "create:shaft",
      L: "oreganized:lead_ingot",
      c: mat.casing,
      w: "create:propeller",
    })
  });

  // DramTweaks Custom
  e.shaped("4x verdantvibes:cattails", ["bbb", "bcb", "bbb"], {
    c: "verdantvibes:cattails",
    b: "minecraft:bone_meal",
  });
  e.shaped("3x createdeco:copper_door", ["dcc", " cc", " cc"], {
    d: "#minecraft:wooden_doors",
    c: "minecraft:copper_ingot",
  });
  e.shapeless("create:portable_fluid_interface", [
    "create:fluid_tank",
    "create:fluid_pipe",
  ]);
  e.shaped("beachparty:dried_wheat_block", ["ddd", "ddd", "ddd"], {
    d: "brewery:dried_wheat",
  });
  e.shapeless("9x brewery:dried_wheat", [
    "beachparty:dried_wheat_block",
  ]);
  e.shaped("irons_spellbooks:cinderous_soulcaller", ["cfb", "mwm", "bfc"], {
    f: "create_deep_dark:echo_ingot",
    w: "butchery:warden_head",
    b: "botania:dragonstone",
    m: "society:double_aged_mana_king",
    c: "irons_spellbooks:cinder_essence",
  });
  e.shaped("irons_spellbooks:alchemist_cauldron", ["i i", "ici", "aea"], {
    i: "createmetallurgy:obdurium_ingot",
    e: "irons_spellbooks:cinder_essence",
    a: "irons_spellbooks:arcane_essence",
    c: "herbalbrews:cauldron",
  });

  // Butchery
  e.shaped("butchery:bone_cleaver", ["  f", "sff", "s  "], {
    f: "species:werefang",
    s: "minecraft:stick",
  });
  e.shaped("butchery:bone_skinning_knife", ["  f", " f ", "s  "], {
    f: "species:werefang",
    s: "minecraft:stick",
  });
  e.shaped("butchery:bone_hammer", ["bfb", "bsb", " s "], {
    f: "species:werefang",
    s: "minecraft:stick",
    b: "minecraft:bone_block",
  });
  e.shaped("butchery:bone_hacksaw", [" sf", "sf ", "f  "], {
    f: "species:werefang",
    s: "minecraft:stick",
  });
  e.shapeless("meadow:alpine_salt", [
    "butchery:salt",
  ]);
  e.shapeless("butchery:salt", [
    "meadow:alpine_salt",
  ]);

  // Immersive Aircraft
  e.shaped("immersive_aircraft:hull", ["lll", "sss", "lll"], {
    l: "society:treated_log",
    s: "createmetallurgy:steel_ingot",
  });
  e.shaped("immersive_aircraft:engine", ["psp", "tft", "sbs"], {
    p: "create:precision_mechanism",
    s: "moreminecarts:silica_steel_block",
    f: "minecraft:blast_furnace",
    t: "minecraft:piston",
    b: "immersive_aircraft:boiler",
  });
  e.shaped("immersive_aircraft:boiler", ["ttt", "t t", "tft"], {
    t: "create:fluid_tank",
    f: "minecraft:furnace",
  });
    e.shaped("immersive_aircraft:enhanced_propeller", ["bb ", " p ", " bb"], {
    p: "create:propeller",
    b: "create:brass_ingot",
  });
  e.shaped("immersive_aircraft:industrial_gears", [" ii", "cpc", "cc "], {
    i: "minecraft:iron_ingot",
    p: "create:precision_mechanism",
    c: "minecraft:copper_ingot",
  });
  e.shaped("immersive_aircraft:sturdy_pipes", ["  c", "ici", "c  "], {
    i: "classicpipes:iron_fluid_pipe",
    c: "create:fluid_pipe",
  });

  // Create Bitterballen
  e.custom({
    type: "create:emptying",
    ingredients: [
      {
        item: "society:oil"
      },
    ],
    results: [
      {
        item: "minecraft:glass_bottle"
      },
      {
        amount: 250,
        fluid: "create_bic_bit:frying_oil"
      }
    ]
  });
  e.custom({
    type: "create:pressing",
    ingredients: [
      {
      item: "bakery:sweet_dough"
      },
    ],
    results: [
      {
      item: "create_bic_bit:unbaked_stroopwafel"
      }
    ]
  });
});
