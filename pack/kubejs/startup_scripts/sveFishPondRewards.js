// priority: 90
// Apply after Society's priority-100 definitions. Patch by fish and reward IDs.
// On upstream drift, warn and leave that individual reward untouched for review.
(() => {
  const edits = [
  {
    "fish": "aquaculture:atlantic_herring",
    "item": "minecraft:prismarine_shard",
    "expected": {
      "minPopulation": 4,
      "item": "minecraft:prismarine_shard",
      "count": 64,
      "chance": 0.69
    },
    "changes": {
      "count": 8
    }
  },
  {
    "fish": "aquaculture:atlantic_herring",
    "item": "minecraft:prismarine_crystals",
    "expected": {
      "minPopulation": 6,
      "item": "minecraft:prismarine_crystals",
      "count": 32,
      "chance": 0.41
    },
    "changes": {
      "count": 4
    }
  },
  {
    "fish": "minecraft:pufferfish",
    "item": "minecraft:slime_ball",
    "expected": {
      "minPopulation": 6,
      "item": "minecraft:slime_ball",
      "count": 16,
      "chance": 0.43
    },
    "changes": {
      "count": 2
    }
  },
  {
    "fish": "minecraft:pufferfish",
    "item": "relics:spore_sack",
    "expected": {
      "minPopulation": 9,
      "item": "relics:spore_sack",
      "count": 1,
      "chance": 0.06
    },
    "remove": true
  },
  {
    "fish": "aquaculture:perch",
    "item": "minecraft:diorite",
    "expected": {
      "minPopulation": 4,
      "item": "minecraft:diorite",
      "count": 64,
      "chance": 0.89
    },
    "changes": {
      "count": 8
    }
  },
  {
    "fish": "minecraft:salmon",
    "item": "windswept:pinecone",
    "expected": {
      "minPopulation": 6,
      "item": "windswept:pinecone",
      "count": 32,
      "chance": 0.31
    },
    "changes": {
      "count": 4
    }
  },
  {
    "fish": "aquaculture:brown_trout",
    "item": "minecraft:raw_iron",
    "expected": {
      "minPopulation": 4,
      "item": "minecraft:raw_iron",
      "count": 32,
      "chance": 0.54
    },
    "changes": {
      "count": 4
    }
  },
  {
    "fish": "aquaculture:brown_trout",
    "item": "meadow:alpine_salt",
    "expected": {
      "minPopulation": 8,
      "item": "meadow:alpine_salt",
      "count": 32,
      "chance": 0.32
    },
    "changes": {
      "count": 4
    }
  },
  {
    "fish": "aquaculture:smallmouth_bass",
    "item": "create:experience_nugget",
    "expected": {
      "minPopulation": 4,
      "item": "create:experience_nugget",
      "count": 64,
      "chance": 0.64
    },
    "changes": {
      "count": 4
    }
  },
  {
    "fish": "aquaculture:smallmouth_bass",
    "item": "create:experience_block",
    "expected": {
      "minPopulation": 6,
      "item": "create:experience_block",
      "count": 8,
      "chance": 0.32
    },
    "changes": {
      "count": 2
    }
  },
  {
    "fish": "aquaculture:smallmouth_bass",
    "item": "paraglider:spirit_orb",
    "expected": {
      "minPopulation": 8,
      "item": "paraglider:spirit_orb",
      "count": 2,
      "chance": 0.12
    },
    "changes": {
      "count": 1
    }
  },
  {
    "fish": "minecraft:cod",
    "item": "minecraft:seagrass",
    "expected": {
      "minPopulation": 4,
      "item": "minecraft:seagrass",
      "count": 64,
      "chance": 0.64
    },
    "changes": {
      "count": 8
    }
  },
  {
    "fish": "minecraft:cod",
    "item": "minecraft:kelp",
    "expected": {
      "minPopulation": 6,
      "item": "minecraft:kelp",
      "count": 32,
      "chance": 0.32
    },
    "changes": {
      "count": 4
    }
  },
  {
    "fish": "aquaculture:pollock",
    "item": "minecraft:calcite",
    "expected": {
      "minPopulation": 4,
      "item": "minecraft:calcite",
      "count": 64,
      "chance": 0.59
    },
    "changes": {
      "count": 8
    }
  },
  {
    "fish": "aquaculture:jellyfish",
    "item": "relics:jellyfish_necklace",
    "expected": {
      "minPopulation": 8,
      "item": "relics:jellyfish_necklace",
      "count": 1,
      "chance": 0.08
    },
    "remove": true
  },
  {
    "fish": "aquaculture:rainbow_trout",
    "item": "automobility:dash_panel",
    "expected": {
      "minPopulation": 6,
      "item": "automobility:dash_panel",
      "count": 16,
      "chance": 0.09
    },
    "changes": {
      "count": 2
    }
  },
  {
    "fish": "aquaculture:pink_salmon",
    "item": "minecraft:pink_dye",
    "expected": {
      "minPopulation": 2,
      "item": "minecraft:pink_dye",
      "count": 64,
      "chance": 0.64
    },
    "changes": {
      "count": 8
    }
  },
  {
    "fish": "aquaculture:pink_salmon",
    "item": "minecraft:cherry_log",
    "expected": {
      "minPopulation": 3,
      "item": "minecraft:cherry_log",
      "count": 64,
      "chance": 0.44
    },
    "changes": {
      "count": 8
    }
  },
  {
    "fish": "minecraft:tropical_fish",
    "item": "crabbersdelight:coral_fragments",
    "expected": {
      "minPopulation": 4,
      "item": "crabbersdelight:coral_fragments",
      "count": 32,
      "chance": 0.48
    },
    "changes": {
      "count": 4
    }
  },
  {
    "fish": "minecraft:tropical_fish",
    "item": "beachparty:palm_log",
    "expected": {
      "minPopulation": 6,
      "item": "beachparty:palm_log",
      "count": 32,
      "chance": 0.42
    },
    "changes": {
      "count": 4
    }
  },
  {
    "fish": "aquaculture:red_grouper",
    "item": "minecraft:redstone",
    "expected": {
      "minPopulation": 4,
      "item": "minecraft:redstone",
      "count": 64,
      "chance": 0.64
    },
    "changes": {
      "count": 8
    }
  },
  {
    "fish": "aquaculture:synodontis",
    "item": "minecraft:raw_gold",
    "expected": {
      "minPopulation": 4,
      "item": "minecraft:raw_gold",
      "count": 32,
      "chance": 0.44
    },
    "changes": {
      "count": 4
    }
  },
  {
    "fish": "aquaculture:synodontis",
    "item": "create:precision_mechanism",
    "expected": {
      "minPopulation": 8,
      "item": "create:precision_mechanism",
      "count": 1,
      "chance": 0.18
    },
    "remove": true
  },
  {
    "fish": "aquaculture:tambaqui",
    "item": "minecraft:dripstone_block",
    "expected": {
      "minPopulation": 4,
      "item": "minecraft:dripstone_block",
      "count": 64,
      "chance": 0.69
    },
    "changes": {
      "count": 8
    }
  },
  {
    "fish": "aquaculture:tambaqui",
    "item": "minecraft:pointed_dripstone",
    "expected": {
      "minPopulation": 6,
      "item": "minecraft:pointed_dripstone",
      "count": 16,
      "chance": 0.31
    },
    "changes": {
      "count": 2
    }
  },
  {
    "fish": "aquaculture:atlantic_cod",
    "item": "minecraft:andesite",
    "expected": {
      "minPopulation": 4,
      "item": "minecraft:andesite",
      "count": 64,
      "chance": 0.69
    },
    "changes": {
      "count": 1
    }
  },
  {
    "fish": "aquaculture:atlantic_cod",
    "item": "create:andesite_alloy",
    "expected": {
      "minPopulation": 6,
      "item": "create:andesite_alloy",
      "count": 16,
      "chance": 0.28
    },
    "changes": {
      "count": 2
    }
  },
  {
    "fish": "aquaculture:boulti",
    "item": "minecraft:granite",
    "expected": {
      "minPopulation": 4,
      "item": "minecraft:granite",
      "count": 64,
      "chance": 0.69
    },
    "changes": {
      "count": 8
    }
  },
  {
    "fish": "aquaculture:leech",
    "item": "farm_and_charm:minced_beef",
    "expected": {
      "minPopulation": 4,
      "item": "farm_and_charm:minced_beef",
      "count": 16,
      "chance": 0.45
    },
    "changes": {
      "count": 2
    }
  },
  {
    "fish": "aquaculture:catfish",
    "item": "minecraft:lapis_lazuli",
    "expected": {
      "minPopulation": 8,
      "item": "minecraft:lapis_lazuli",
      "count": 32,
      "chance": 0.32
    },
    "changes": {
      "count": 4
    }
  },
  {
    "fish": "aquaculture:tuna",
    "item": "create:raw_zinc",
    "expected": {
      "minPopulation": 4,
      "item": "create:raw_zinc",
      "count": 48,
      "chance": 0.44
    },
    "changes": {
      "count": 6
    }
  },
  {
    "fish": "aquaculture:tuna",
    "item": "minecraft:diamond",
    "expected": {
      "minPopulation": 8,
      "item": "minecraft:diamond",
      "count": 8,
      "chance": 0.23
    },
    "changes": {
      "count": 1
    }
  },
  {
    "fish": "aquaculture:bayad",
    "item": "society:relic_trove",
    "expected": {
      "minPopulation": 8,
      "item": "society:relic_trove",
      "count": 1,
      "chance": 0.08
    },
    "remove": true
  },
  {
    "fish": "aquaculture:arapaima",
    "item": "minecraft:emerald",
    "expected": {
      "minPopulation": 4,
      "item": "minecraft:emerald",
      "count": 32,
      "chance": 0.34
    },
    "changes": {
      "count": 4
    }
  },
  {
    "fish": "aquaculture:atlantic_halibut",
    "item": "minecraft:raw_copper",
    "expected": {
      "minPopulation": 4,
      "item": "minecraft:raw_copper",
      "count": 64,
      "chance": 0.44
    },
    "changes": {
      "count": 8
    }
  },
  {
    "fish": "aquaculture:atlantic_halibut",
    "item": "society:geode",
    "expected": {
      "minPopulation": 6,
      "item": "society:geode",
      "count": 8,
      "chance": 0.22
    },
    "changes": {
      "count": 2
    }
  },
  {
    "fish": "aquaculture:atlantic_halibut",
    "item": "minecraft:redstone",
    "expected": {
      "minPopulation": 8,
      "item": "minecraft:redstone",
      "count": 32,
      "chance": 0.32
    },
    "changes": {
      "count": 4
    }
  },
  {
    "fish": "netherdepthsupgrade:searing_cod",
    "item": "minecraft:coal",
    "expected": {
      "minPopulation": 4,
      "item": "minecraft:coal",
      "count": 32,
      "chance": 0.34
    },
    "changes": {
      "count": 4
    }
  },
  {
    "fish": "netherdepthsupgrade:lava_pufferfish",
    "item": "minecraft:quartz",
    "expected": {
      "minPopulation": 4,
      "item": "minecraft:quartz",
      "count": 64,
      "chance": 0.48
    },
    "changes": {
      "count": 8
    }
  },
  {
    "fish": "netherdepthsupgrade:obsidianfish",
    "item": "minecraft:obsidian",
    "expected": {
      "minPopulation": 4,
      "item": "minecraft:obsidian",
      "count": 16,
      "chance": 0.48
    },
    "changes": {
      "count": 2
    }
  },
  {
    "fish": "netherdepthsupgrade:bonefish",
    "item": "minecraft:bone_meal",
    "expected": {
      "minPopulation": 4,
      "item": "minecraft:bone_meal",
      "count": 32,
      "chance": 0.53
    },
    "changes": {
      "count": 4
    }
  },
  {
    "fish": "netherdepthsupgrade:bonefish",
    "item": "minecraft:bone",
    "expected": {
      "minPopulation": 4,
      "item": "minecraft:bone",
      "count": 32,
      "chance": 0.34
    },
    "changes": {
      "count": 4
    }
  },
  {
    "fish": "netherdepthsupgrade:magmacubefish",
    "item": "minecraft:magma_cream",
    "expected": {
      "minPopulation": 3,
      "item": "minecraft:magma_cream",
      "count": 48,
      "chance": 0.43
    },
    "changes": {
      "count": 6
    }
  },
  {
    "fish": "netherdepthsupgrade:magmacubefish",
    "item": "minecraft:magma_block",
    "expected": {
      "minPopulation": 5,
      "item": "minecraft:magma_block",
      "count": 16,
      "chance": 0.23
    },
    "changes": {
      "count": 2
    }
  },
  {
    "fish": "netherdepthsupgrade:glowdine",
    "item": "minecraft:glowstone_dust",
    "expected": {
      "minPopulation": 3,
      "item": "minecraft:glowstone_dust",
      "count": 32,
      "chance": 0.27
    },
    "changes": {
      "count": 4
    }
  },
  {
    "fish": "netherdepthsupgrade:soulsucker",
    "item": "minecraft:soul_sand",
    "expected": {
      "minPopulation": 4,
      "item": "minecraft:soul_sand",
      "count": 32,
      "chance": 0.45
    },
    "changes": {
      "count": 4
    }
  },
  {
    "fish": "netherdepthsupgrade:eyeball_fish",
    "item": "etcetera:raw_bismuth",
    "expected": {
      "minPopulation": 6,
      "item": "etcetera:raw_bismuth",
      "count": 16,
      "chance": 0.27
    },
    "changes": {
      "count": 2
    }
  },
  {
    "fish": "unusualfishmod:raw_sneep_snorp",
    "item": "minecraft:lapis_lazuli",
    "expected": {
      "minPopulation": 4,
      "item": "minecraft:lapis_lazuli",
      "count": 16,
      "chance": 0.33
    },
    "changes": {
      "count": 2
    }
  },
  {
    "fish": "unusualfishmod:raw_beaked_herring",
    "item": "meadow:cobbled_limestone",
    "expected": {
      "minPopulation": 4,
      "item": "meadow:cobbled_limestone",
      "count": 64,
      "chance": 0.69
    },
    "changes": {
      "count": 8
    }
  },
  {
    "fish": "unusualfishmod:raw_beaked_herring",
    "item": "create:raw_zinc",
    "expected": {
      "minPopulation": 6,
      "item": "create:raw_zinc",
      "count": 32,
      "chance": 0.22
    },
    "changes": {
      "count": 4
    }
  },
  {
    "fish": "unusualfishmod:raw_snowflake",
    "item": "minecraft:ice",
    "expected": {
      "minPopulation": 4,
      "item": "minecraft:ice",
      "count": 16,
      "chance": 0.64
    },
    "changes": {
      "count": 2
    }
  },
  {
    "fish": "unusualfishmod:raw_sailor_barb",
    "item": "railways:riveted_locometal",
    "expected": {
      "minPopulation": 8,
      "item": "railways:riveted_locometal",
      "count": 64,
      "chance": 0.24
    },
    "changes": {
      "count": 2
    }
  },
  {
    "fish": "unusualfishmod:raw_aero_mono",
    "item": "minecraft:tuff",
    "expected": {
      "minPopulation": 4,
      "item": "minecraft:tuff",
      "count": 64,
      "chance": 0.59
    },
    "changes": {
      "count": 4
    }
  },
  {
    "fish": "unusualfishmod:raw_aero_mono",
    "item": "create:asurine",
    "expected": {
      "minPopulation": 4,
      "item": "create:asurine",
      "count": 48,
      "chance": 0.49
    },
    "changes": {
      "count": 6
    }
  },
  {
    "fish": "unusualfishmod:raw_bark_angelfish",
    "item": "farmersdelight:tree_bark",
    "expected": {
      "minPopulation": 4,
      "item": "farmersdelight:tree_bark",
      "count": 32,
      "chance": 0.24
    },
    "changes": {
      "count": 4
    }
  },
  {
    "fish": "unusualfishmod:raw_bark_angelfish",
    "item": "minecraft:oak_log",
    "expected": {
      "minPopulation": 6,
      "item": "minecraft:oak_log",
      "count": 48,
      "chance": 0.31
    },
    "changes": {
      "count": 6
    }
  },
  {
    "fish": "unusualfishmod:raw_bark_angelfish",
    "item": "minecraft:dark_oak_log",
    "expected": {
      "minPopulation": 7,
      "item": "minecraft:dark_oak_log",
      "count": 48,
      "chance": 0.22
    },
    "changes": {
      "count": 6
    }
  },
  {
    "fish": "unusualfishmod:raw_triple_twirl_pleco",
    "item": "minecraft:ender_pearl",
    "expected": {
      "minPopulation": 4,
      "item": "minecraft:ender_pearl",
      "count": 8,
      "chance": 0.27
    },
    "changes": {
      "count": 2
    }
  },
  {
    "fish": "unusualfishmod:raw_triple_twirl_pleco",
    "item": "createutilities:void_steel_bars",
    "expected": {
      "minPopulation": 6,
      "item": "createutilities:void_steel_bars",
      "count": 16,
      "chance": 0.22
    },
    "changes": {
      "count": 2
    }
  },
  {
    "fish": "unusualfishmod:raw_blind_sailfin",
    "item": "minecraft:sand",
    "expected": {
      "minPopulation": 4,
      "item": "minecraft:sand",
      "count": 64,
      "chance": 0.34
    },
    "changes": {
      "count": 8
    }
  },
  {
    "fish": "unusualfishmod:raw_blind_sailfin",
    "item": "minecraft:sandstone",
    "expected": {
      "minPopulation": 6,
      "item": "minecraft:sandstone",
      "count": 32,
      "chance": 0.31
    },
    "changes": {
      "count": 4
    }
  },
  {
    "fish": "unusualfishmod:raw_amber_goby",
    "item": "unusualfishmod:relucent_shard",
    "expected": {
      "minPopulation": 6,
      "item": "unusualfishmod:relucent_shard",
      "count": 64,
      "chance": 0.42
    },
    "changes": {
      "count": 8
    }
  },
  {
    "fish": "unusualfishmod:raw_amber_goby",
    "item": "create:ochrum",
    "expected": {
      "minPopulation": 4,
      "item": "create:ochrum",
      "count": 32,
      "chance": 0.49
    },
    "changes": {
      "count": 4
    }
  },
  {
    "fish": "unusualfishmod:raw_amber_goby",
    "item": "unusualfishmod:crimson_shard",
    "expected": {
      "minPopulation": 8,
      "item": "unusualfishmod:crimson_shard",
      "count": 64,
      "chance": 0.32
    },
    "changes": {
      "count": 8
    }
  },
  {
    "fish": "unusualfishmod:raw_amber_goby",
    "item": "create:crimsite",
    "expected": {
      "minPopulation": 9,
      "item": "create:crimsite",
      "count": 32,
      "chance": 0.49
    },
    "changes": {
      "count": 4
    }
  },
  {
    "fish": "unusualfishmod:raw_copperflame_anthias",
    "item": "minecraft:oxidized_copper",
    "expected": {
      "minPopulation": 4,
      "item": "minecraft:oxidized_copper",
      "count": 16,
      "chance": 0.34
    },
    "changes": {
      "count": 2
    }
  },
  {
    "fish": "unusualfishmod:raw_copperflame_anthias",
    "item": "create:veridium",
    "expected": {
      "minPopulation": 6,
      "item": "create:veridium",
      "count": 48,
      "chance": 0.28
    },
    "changes": {
      "count": 6
    }
  },
  {
    "fish": "unusualfishmod:raw_hatchetfish",
    "item": "unusualfishmod:tendril",
    "expected": {
      "minPopulation": 6,
      "item": "unusualfishmod:tendril",
      "count": 16,
      "chance": 0.22
    },
    "changes": {
      "count": 2
    }
  },
  {
    "fish": "unusualfishmod:raw_spindlefish",
    "item": "quark:myalite_crystal",
    "expected": {
      "minPopulation": 4,
      "item": "quark:myalite_crystal",
      "count": 32,
      "chance": 0.44
    },
    "changes": {
      "count": 4
    }
  },
  {
    "fish": "unusualfishmod:raw_duality_damselfish",
    "item": "minecraft:cobbled_deepslate",
    "expected": {
      "minPopulation": 4,
      "item": "minecraft:cobbled_deepslate",
      "count": 64,
      "chance": 0.89
    },
    "changes": {
      "count": 8
    }
  },
  {
    "fish": "unusualfishmod:raw_duality_damselfish",
    "item": "minecraft:calcite",
    "expected": {
      "minPopulation": 6,
      "item": "minecraft:calcite",
      "count": 32,
      "chance": 0.59
    },
    "changes": {
      "count": 4
    }
  },
  {
    "fish": "unusualfishmod:raw_duality_damselfish",
    "item": "create:scorchia",
    "expected": {
      "minPopulation": 8,
      "item": "create:scorchia",
      "count": 64,
      "chance": 0.32
    },
    "changes": {
      "count": 8
    }
  },
  {
    "fish": "unusualfishmod:raw_duality_damselfish",
    "item": "minecraft:white_concrete",
    "expected": {
      "minPopulation": 9,
      "item": "minecraft:white_concrete",
      "count": 64,
      "chance": 0.45
    },
    "changes": {
      "count": 8
    }
  },
  {
    "fish": "unusualfishmod:raw_eyelash",
    "item": "relics:shadow_glaive",
    "expected": {
      "minPopulation": 6,
      "item": "relics:shadow_glaive",
      "count": 1,
      "chance": 0.03
    },
    "remove": true
  }
];
  edits.forEach((edit) => {
    const pond = global.fishPondDefinitions.get(edit.fish);
    const warn = (reason) => console.warn('[SVE ponds] Review ' + edit.fish + ' / ' + edit.item + ': ' + reason);
    if (!pond || !pond.additionalRewards) { warn('pond or reward list missing'); return; }
    const matches = pond.additionalRewards.filter((reward) => reward.item === edit.item);
    if (matches.length !== 1) { warn('expected exactly one matching reward; found ' + matches.length); return; }
    const reward = matches[0];
    const expectedKeys = Object.keys(edit.expected);
    if (Object.keys(reward).length !== expectedKeys.length || !expectedKeys.every((key) => reward[key] === edit.expected[key])) {
      warn('upstream reward changed; SVE edit skipped'); return;
    }
    if (edit.remove) {
      pond.additionalRewards = pond.additionalRewards.filter((entry) => entry !== reward);
    } else {
      Object.keys(edit.changes).forEach((key) => { reward[key] = edit.changes[key]; });
    }
  });
})();
