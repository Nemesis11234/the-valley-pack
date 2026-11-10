console.info("[DramTweaks] removeRecipesDramTweaks.js loaded");

ServerEvents.recipes((e) => {
  const removeByOutput = [
    // AIOT Botania
    "aiotbotania:livingrock_shears",
    "aiotbotania:livingwood_shears",
    //Create Deco
    "createdeco:copper_door",
    
    //Create
    "create:portable_fluid_interface",
    "create_bic_bit:frying_oil_bottle",
    "create_bic_bit:curdled_milk",
    "create_bic_bit:sweet_dough",
    "create_bic_bit:sunflower_seeds",
    "create_bic_bit:raw_churros",
    "create_bic_bit:raw_frikandel",
    "create_bic_bit:raw_eggball",
    "create_bic_bit:raw_bitterballen",
    "create_bic_bit:raw_kroket",
    "create_bic_bit:oliebollen",
    "create_bic_bit:kruidnoten",
    "create_bic_bit:unbaked_stroopwafel"
  ];
  const removeById = [
    // Create Deco
    "createdeco:netherite_sheet",
    "createdeco:netherite_nugget",
    "createdeco:netherite_coin",
    "createdeco:netherite_coinstack",
    "createdeco:netherite_sheet",
    "createdeco:gold_coin",
    "createdeco:gold_coinstack",
    "createdeco:brass_coin",
    "createdeco:brass_coinstack",
    "createdeco:iron_coin",
    "createdeco:iron_coinstack",
    "createdeco:copper_coin",
    "createdeco:copper_coinstack",
    "createdeco:industrial_iron_coin",
    "createdeco:industrial_iron_coinstack",
    "createdeco:zinc_coin",
    "createdeco:zinc_coinstack",

    // Create Metallurgy
    "createmetallurgy:alloying/brass",
    "createmetallurgy:alloying/netherite",
    "createmetallurgy:alloying/electrum",

    // Create Deep Dark
    // Iridium uses Bismuth; remove the addon's gold-based mixer shortcut.
    "create_deep_dark:mixing_netherite",
    "create_deep_dark:mixing_molten_echo",
    "create_deep_dark:compacting_echo_ingot",

    // Create
    "create:industrial_iron_block_from_ingots_iron_stonecutting",
    "create:weathered_iron_block_from_ingots_iron_stonecutting",

    // Chisels & Bits
    "chiselsandbits:chisel_iron",
    "chiselsandbits:chisel_gold",
    "chiselsandbits:chisel_diamond",
    "chiselsandbits:chisel_netherite",

    // Irons Spells
    "irons_spellbooks:mana_ring",
    "irons_spellbooks:cooldown_ring",
    "irons_spellbooks:cast_time_ring",
    "irons_spellbooks:emerald_stoneplate_ring",
    "irons_spellbooks:fireward_ring",
    "irons_spellbooks:frostward_ring",
    "irons_spellbooks:poisonward_ring",
    "irons_spellbooks:affinity_ring",
    "irons_spellbooks:visibility_ring",
    "ironsbotany:botanical_ring",
    "irons_spellbooks:heavy_chain_necklace",
    "irons_spellbooks:conjurers_talisman",
    "irons_spellbooks:concentration_amulet",
    "irons_spellbooks:amethyst_resonance_charm",
    "irons_spellbooks:cinderous_soulcaller",
    "irons_spellbooks:alchemist_cauldron",

    // Immersive Aircraft
    "immersive_aircraft:hull",
    "immersive_aircraft:engine",
    "immersive_aircraft:sail",
    "immersive_aircraft:boiler",
    "immersive_aircraft:enhanced_propeller",
    "immersive_aircraft:industrial_gears",
    "immersive_aircraft:sturdy_pipes",
    "immersive_aircraft:rotary_cannon",
    "immersive_aircraft:heavy_crossbow",
    "immersive_aircraft:bomb_bay",
    "immersive_aircraft:gyrodyne",
    "immersive_aircraft:warship",
    "immersive_aircraft:improved_landing_gear",

    // Create Bitterballen
    "create_bic_bit:deep_frying/froglightverdant",
    "create_bic_bit:deep_frying/froglightpearlescent",
    "create_bic_bit:deep_frying/froglightochre",

    // Beehives
    "friendsandfoes:acacia_beehive",
    "everycomp:faf/cluttered/willow_beehive",
    "everycomp:faf/quark/blossom_beehive",
    "everycomp:faf/quark/ancient_beehive",
    "everycomp:faf/cluttered/sycamore_beehive",
    "everycomp:faf/cluttered/poplar_beehive",
    "everycomp:faf/beachparty/palm_beehive",
    "everycomp:faf/meadow/pine_beehive",
    "everycomp:faf/vinery/dark_cherry_beehive",
    "everycomp:faf/minecraft/pale_oak_beehive",
    "everycomp:faf/betterarcheology/rotten_beehive",
    "everycomp:faf/botania/dreamwood_beehive",
    "everycomp:faf/botania/livingwood_beehive",
    "friendsandfoes:bamboo_beehive",
    "friendsandfoes:birch_beehive",
    "friendsandfoes:crimson_beehive",
    "friendsandfoes:cherry_beehive",
    "friendsandfoes:dark_oak_beehive",
    "friendsandfoes:jungle_beehive",
    "friendsandfoes:mangrove_beehive",
    "friendsandfoes:spruce_beehive",
    "friendsandfoes:warped_beehive",
    "everycomp:faf/quark/azalea_beehive"

  ];
  const removeByInput = [
    "create_bic_bit:curdled_milk",
    "create_bic_bit:sunflower_seeds",
    "create_bic_bit:frying_oil_bottle",
    "create_bic_bit:crushed_sunflower_seeds",
  ];
  removeById.forEach((item) => {
    e.remove({ id: item });
  });
  removeByOutput.forEach((item) => {
    e.remove({ output: item });
  });
  removeByInput.forEach((item) => {
    e.remove({ input: item });
  });
  // Replace default milk
  // e.replaceInput({ fluid: "minecraft:milk" }, "minecraft:milk", "society:milk");

  // Full Item Removal Wildcard Matched
  const match = [
    /createcasing:refined_radiance_.*/,
    /createcasing:shadow_steel_.*/,
    /create:refined_radiance_.*/,
    /create:shadow_steel_.*/,
    /createcasing:.*_deployer/,
    /createcasing:.*_mechanical_harvester/,
    /createcasing:.*_mechanical_drill/,
    /createcasing:.*_mixer/,
    /createcasing:.*_mechanical_saw/,
    /createcasing:.*_encased_fan/,
    /createcasing:.*_press/,
    /createcasing:.*_chain_conveyor/,
    /createdeco:.*_coin/,
    /butchery:.*_cleaver/,
    /butchery:.*_skinning_knife/,
    /butchery:.*_hammer/,
    /butchery:.*_hacksaw/,
    /create_bic_bit:.*_wedge/,

  ];
  e.remove({ output: match })
  e.remove({ input: match })
  
});
