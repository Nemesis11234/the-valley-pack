console.info("[DramTweaks] addMetallurgyRecipesDramTweaks.js loaded");

ServerEvents.recipes((e) => {

  // Alloying

  e.custom({
    type: "createmetallurgy:alloying",
    heatRequirement: "heated",
    ingredients: [
      {
        amount: 90,
        fluid: "createmetallurgy:molten_zinc"
      },
      {
        amount: 90,
        fluid: "createmetallurgy:molten_copper"
      },
      {
        item: "minecraft:netherite_scrap"
      }
    ],
    results: [
      {
        amount: 180, 
        fluid: "createmetallurgy:molten_brass"
      }
    ]
  });
  e.custom({
    type: "createmetallurgy:alloying",
    heatRequirement: "superheated",
    ingredients: [
      {
        amount: 270,
        fluid: "createmetallurgy:molten_aluminum"
      },
      {
        item: "minecraft:netherite_scrap"
      },
      {
        item: "minecraft:netherite_scrap"
      },
      {
        item: "minecraft:netherite_scrap"
      }
    ],
    results: [
      {
        amount: 180, 
        fluid: "createmetallurgy:molten_netherite"
      }
    ]
  });
    e.custom({
    type: "createmetallurgy:alloying",
    heatRequirement: "heated",
    ingredients: [
      {
        amount: 30,
        fluid: "createmetallurgy:molten_silver"
      },
      {
        amount: 10,
        fluid: "createmetallurgy:molten_gold"
      },
    ],
    results: [
      {
        amount: 10, 
        fluid: "createmetallurgy:molten_electrum"
      }
    ]
  });
  e.custom({
    type: "createmetallurgy:alloying",
    heatRequirement: "superheated",
    ingredients: [
      {
        amount: 90,
        fluid: "createmetallurgy:molten_netherite"
      },
      {
        item: "minecraft:echo_shard"
      },
      {
        item: "minecraft:echo_shard"
      },
      {
        item: "minecraft:echo_shard"
      }
    ],
    results: [
      {
        amount: 90, 
        fluid: "create_deep_dark:molten_echo"
      }
    ]
  });
  

  // Melting

  // Bismuth
  e.custom({
    type: "createmetallurgy:melting",
    heatRequirement: "heated",
    ingredients: [
      {
        item: "etcetera:bismuth_ingot"
      }
    ],
    processingTime: 40,
    results: [
      {
        amount: 90,
        fluid: "createmetallurgy:molten_aluminum"
      }
    ]
  });
  e.custom({
    type: "createmetallurgy:melting",
    heatRequirement: "heated",
    ingredients: [
      {
        item: "etcetera:bismuth_nugget"
      }
    ],
    processingTime: 4,
    results: [
      {
        amount: 10,
        fluid: "createmetallurgy:molten_aluminum"
      }
    ]
  });
  e.custom({
    type: "createmetallurgy:melting",
    heatRequirement: "heated",
    ingredients: [
      {
        item: "etcetera:raw_bismuth"
      }
    ],
    processingTime: 40,
    results: [
      {
        amount: 90,
        fluid: "createmetallurgy:molten_aluminum"
      }
    ]
  });
  e.custom({
    type: "createmetallurgy:melting",
    heatRequirement: "heated",
    ingredients: [
      {
        item: "create:crushed_raw_bismuth"
      }
    ],
    processingTime: 40,
    results: [
      {
        amount: 90,
        fluid: "createmetallurgy:molten_aluminum"
      }
    ]
  });

  // Void Steel
  e.custom({
    type: "createmetallurgy:melting",
    heatRequirement: "heated",
    ingredients: [
      {
        item: "createutilities:void_steel_bars"
      }
    ],
    processingTime: 40,
    results: [
      {
        amount: 10,
        fluid: "createmetallurgy:molten_void_steel"
      }
    ]
  });
  e.custom({
    type: "createmetallurgy:melting",
    heatRequirement: "heated",
    ingredients: [
      {
        item: "createutilities:void_steel_scaffolding"
      }
    ],
    processingTime: 20,
    results: [
      {
        amount: 10,
        fluid: "createmetallurgy:molten_void_steel"
      }
    ]
  });
  e.custom({
    type: "createmetallurgy:melting",
    heatRequirement: "heated",
    ingredients: [
      {
        item: "createutilities:void_steel_ladder"
      }
    ],
    processingTime: 20,
    results: [
      {
        amount: 10,
        fluid: "createmetallurgy:molten_void_steel"
      }
    ]
  });

  // Casting
  e.custom({
    type: "createmetallurgy:casting_in_table",
    ingredients: [
      {
        item: "createmetallurgy:graphite_ingot_mold"
      },
      {
        amount: 90,
        fluid: "create_deep_dark:molten_echo"
      }
    ],
    processingTime: 60,
    result: 
      {
        item: "create_deep_dark:echo_ingot"
      }
  });

});
