// priority: -20
// Loads after globalRegistry.js (same priority, alphabetical order), before -21 consumers.
// Values below are the original FINAL registry values, including cooking rounding.
// Later SVE mince (-200) and fried-food (-400) adjustments still run normally.
(function () {
  var groups = [
  {
    "array": "animalProducts",
    "after": "snuffles:frosty_fluff",
    "entries": [
      {
        "item": "butchery:raw_pork_loin",
        "value": 28
      },
      {
        "item": "butchery:raw_pork_belly",
        "value": 28
      },
      {
        "item": "butchery:raw_pork_leg",
        "value": 32
      },
      {
        "item": "butchery:raw_pork_shoulder",
        "value": 30
      },
      {
        "item": "butchery:raw_ribeye_steak",
        "value": 32
      },
      {
        "item": "butchery:raw_sirloin_steak",
        "value": 32
      },
      {
        "item": "butchery:raw_tbone_steak",
        "value": 36
      },
      {
        "item": "butchery:raw_chuck_steak",
        "value": 30
      },
      {
        "item": "butchery:raw_rump_steak",
        "value": 30
      },
      {
        "item": "butchery:raw_lamb_loin",
        "value": 30
      },
      {
        "item": "butchery:raw_lamb_rib",
        "value": 26
      },
      {
        "item": "butchery:raw_leg_of_lamb",
        "value": 34
      },
      {
        "item": "butchery:raw_lamb_sirloin",
        "value": 32
      },
      {
        "item": "butchery:raw_lamb_shoulder",
        "value": 30
      },
      {
        "item": "butchery:raw_lamb_mince",
        "value": 15
      },
      {
        "item": "butchery:raw_beef_mince",
        "value": 15
      },
      {
        "item": "butchery:raw_llama_steak",
        "value": 24
      },
      {
        "item": "butchery:raw_camel_meat",
        "value": 30
      },
      {
        "item": "butchery:raw_horse_meat",
        "value": 24
      },
      {
        "item": "butchery:raw_mule_steak",
        "value": 24
      },
      {
        "item": "butchery:raw_donkey_steak",
        "value": 24
      },
      {
        "item": "butchery:raw_wolf_meat",
        "value": 12
      },
      {
        "item": "butchery:raw_fox_meat",
        "value": 12
      },
      {
        "item": "butchery:raw_cat_meat",
        "value": 8
      },
      {
        "item": "butchery:raw_ocelot_meat",
        "value": 25
      },
      {
        "item": "butchery:raw_bat_meat",
        "value": 10
      },
      {
        "item": "butchery:raw_chicken_leg",
        "value": 12
      },
      {
        "item": "butchery:raw_chicken_wing",
        "value": 10
      },
      {
        "item": "butchery:raw_ham",
        "value": 25
      },
      {
        "item": "butchery:raw_warden_meat",
        "value": 1200
      },
      {
        "item": "butchery:raw_dragon_meat",
        "value": 1500
      },
      {
        "item": "butchery:raw_elder_guardian_meat",
        "value": 250
      },
      {
        "item": "butchery:raw_guardian_meat",
        "value": 45
      },
      {
        "item": "butchery:raw_enderman_steak",
        "value": 80
      },
      {
        "item": "butchery:raw_creeper_steak",
        "value": 40
      },
      {
        "item": "butchery:raw_creeper_leg",
        "value": 25
      },
      {
        "item": "butchery:raw_hoglin_chunk",
        "value": 45
      },
      {
        "item": "butchery:raw_strider_meat",
        "value": 35
      },
      {
        "item": "butchery:raw_ravager_meat",
        "value": 180
      },
      {
        "item": "butchery:raw_shulker_meat",
        "value": 110
      },
      {
        "item": "butchery:raw_witch_meat",
        "value": 25
      },
      {
        "item": "butchery:raw_pillager_meat",
        "value": 20
      },
      {
        "item": "butchery:raw_evoker_meat",
        "value": 150
      },
      {
        "item": "butchery:raw_vindicator_meat",
        "value": 30
      },
      {
        "item": "butchery:raw_spider_leg",
        "value": 12
      },
      {
        "item": "butchery:raw_cave_spider_leg",
        "value": 18
      },
      {
        "item": "butchery:raw_silverfish_chunks",
        "value": 5
      },
      {
        "item": "butchery:raw_endermite_chunks",
        "value": 15
      },
      {
        "item": "butchery:raw_bee_back_meat",
        "value": 30
      },
      {
        "item": "butchery:raw_sniffer_steak",
        "value": 150
      },
      {
        "item": "butchery:raw_panda_steak",
        "value": 80
      },
      {
        "item": "butchery:raw_turtle_meat",
        "value": 40
      },
      {
        "item": "butchery:raw_villager_steak",
        "value": 50
      },
      {
        "item": "butchery:rawhumanmeat",
        "value": 15
      },
      {
        "item": "butchery:raw_sausage",
        "value": 18
      },
      {
        "item": "butchery:raw_blood_sausage",
        "value": 20
      },
      {
        "item": "butchery:raw_cod_fillet",
        "value": 12
      },
      {
        "item": "butchery:raw_salmon",
        "value": 14
      },
      {
        "item": "butchery:raw_pufferfish",
        "value": 15
      },
      {
        "item": "butchery:raw_dolphin_meat",
        "value": 60
      },
      {
        "item": "butchery:raw_orange_frog_leg",
        "value": 15
      },
      {
        "item": "butchery:raw_gray_frog_leg",
        "value": 15
      },
      {
        "item": "butchery:raw_green_frog_leg",
        "value": 15
      },
      {
        "item": "butchery:raw_pink_axolotl_fillet",
        "value": 35
      },
      {
        "item": "butchery:raw_blue_axolotl_fillet",
        "value": 200
      },
      {
        "item": "butchery:raw_cyan_axolotl_fillet",
        "value": 35
      },
      {
        "item": "butchery:raw_gold_axolotl_fillet",
        "value": 45
      },
      {
        "item": "butchery:raw_brown_axolotl_fillet",
        "value": 35
      }
    ]
  },
  {
    "array": "artisanGoods",
    "after": "society:coconut_oil",
    "entries": [
      {
        "item": "create_bic_bit:frying_oil_bottle",
        "value": 72
      }
    ]
  },
  {
    "array": "cooking",
    "after": "windswept:minty_snow_cone",
    "entries": [
      {
        "item": "create_bic_bit:frikandel",
        "value": 56
      },
      {
        "item": "create_bic_bit:speculaas",
        "value": 28
      },
      {
        "item": "create_bic_bit:stroopwafel",
        "value": 33
      },
      {
        "item": "create_bic_bit:kroket_sandwich",
        "value": 89
      },
      {
        "item": "create_bic_bit:oliebollen",
        "value": 44
      },
      {
        "item": "create_bic_bit:churros",
        "value": 44
      },
      {
        "item": "create_bic_bit:eggball",
        "value": 28
      },
      {
        "item": "create_bic_bit:kruidnoten",
        "value": 21
      },
      {
        "item": "create_bic_bit:kroket",
        "value": 50
      },
      {
        "item": "create_bic_bit:chocolate_glazed_stroopwafel",
        "value": 50
      },
      {
        "item": "create_bic_bit:cheese_souffle",
        "value": 62
      },
      {
        "item": "create_bic_bit:fries",
        "value": 67
      }
    ]
  },
  {
    "array": "cooking",
    "after": "society:lemon_beignets",
    "entries": [
      {
        "item": "butchery:cooked_pork_loin",
        "value": 63
      },
      {
        "item": "butchery:cooked_pork_belly",
        "value": 63
      },
      {
        "item": "butchery:cooked_pork_leg",
        "value": 72
      },
      {
        "item": "butchery:cooked_pork_shoulder",
        "value": 68
      },
      {
        "item": "butchery:cooked_ribeye_steak",
        "value": 72
      },
      {
        "item": "butchery:cooked_sirloin_steak",
        "value": 72
      },
      {
        "item": "butchery:cooked_tbone_steak",
        "value": 81
      },
      {
        "item": "butchery:cooked_chuck_steak",
        "value": 68
      },
      {
        "item": "butchery:cooked_rump_steak",
        "value": 68
      },
      {
        "item": "butchery:cooked_lamb_loin",
        "value": 68
      },
      {
        "item": "butchery:cooked_lamb_rib",
        "value": 59
      },
      {
        "item": "butchery:cooked_leg_of_lamb",
        "value": 77
      },
      {
        "item": "butchery:cooked_lamb_sirloin",
        "value": 72
      },
      {
        "item": "butchery:cooked_lamb_shoulder",
        "value": 68
      },
      {
        "item": "butchery:cooked_lamb_mince",
        "value": 33
      },
      {
        "item": "butchery:cooked_beef_mince",
        "value": 33
      },
      {
        "item": "butchery:cooked_llama_steak",
        "value": 54
      },
      {
        "item": "butchery:cooked_camel_meat",
        "value": 68
      },
      {
        "item": "butchery:cooked_horse_meat",
        "value": 54
      },
      {
        "item": "butchery:cooked_mule_steak",
        "value": 54
      },
      {
        "item": "butchery:cooked_donkey_steak",
        "value": 54
      },
      {
        "item": "butchery:cooked_wolf_meat",
        "value": 27
      },
      {
        "item": "butchery:cooked_fox_meat",
        "value": 27
      },
      {
        "item": "butchery:cooked_cat_meat",
        "value": 18
      },
      {
        "item": "butchery:cooked_ocelot_meat",
        "value": 57
      },
      {
        "item": "butchery:cooked_bat_meat",
        "value": 23
      },
      {
        "item": "butchery:cooked_chicken_leg",
        "value": 27
      },
      {
        "item": "butchery:cooked_chicken_wing",
        "value": 23
      },
      {
        "item": "butchery:cooked_cod_fillet",
        "value": 27
      },
      {
        "item": "butchery:cooked_salmon",
        "value": 32
      },
      {
        "item": "butchery:cooked_pufferfish",
        "value": 38
      },
      {
        "item": "butchery:cooked_dolphin_meat",
        "value": 135
      },
      {
        "item": "butchery:cooked_orange_frog_leg",
        "value": 33
      },
      {
        "item": "butchery:cooked_gray_frog_leg",
        "value": 33
      },
      {
        "item": "butchery:cooked_green_frog_leg",
        "value": 33
      },
      {
        "item": "butchery:cooked_pink_axolotl_fillet",
        "value": 78
      },
      {
        "item": "butchery:cooked_blue_axolotl_fillet",
        "value": 450
      },
      {
        "item": "butchery:cooked_cyan_axolotl_fillet",
        "value": 78
      },
      {
        "item": "butchery:cooked_gold_axolotl_fillet",
        "value": 102
      },
      {
        "item": "butchery:cooked_brown_axolotl_fillet",
        "value": 78
      },
      {
        "item": "butchery:cooked_warden_meat",
        "value": 2700
      },
      {
        "item": "butchery:cooked_dragon_meat",
        "value": 3300
      },
      {
        "item": "butchery:cooked_elder_guardian_meat",
        "value": 563
      },
      {
        "item": "butchery:cooked_guardian_meat",
        "value": 102
      },
      {
        "item": "butchery:cooked_enderman_steak",
        "value": 180
      },
      {
        "item": "butchery:cooked_creeper_steak",
        "value": 90
      },
      {
        "item": "butchery:cooked_creeper_leg",
        "value": 57
      },
      {
        "item": "butchery:cooked_hoglin_chunk",
        "value": 102
      },
      {
        "item": "butchery:cooked_strider_meat",
        "value": 78
      },
      {
        "item": "butchery:cooked_ravager_meat",
        "value": 405
      },
      {
        "item": "butchery:cooked_shulker_meat",
        "value": 248
      },
      {
        "item": "butchery:cooked_witch_meat",
        "value": 57
      },
      {
        "item": "butchery:cooked_pillager_meat",
        "value": 45
      },
      {
        "item": "butchery:cooked_evoker_meat",
        "value": 338
      },
      {
        "item": "butchery:cooked_vindicator_meat",
        "value": 68
      },
      {
        "item": "butchery:cooked_spider_leg",
        "value": 27
      },
      {
        "item": "butchery:cooked_cave_spider_leg",
        "value": 41
      },
      {
        "item": "butchery:cooked_silverfish_chunks",
        "value": 12
      },
      {
        "item": "butchery:cooked_endermite_chunks",
        "value": 33
      },
      {
        "item": "butchery:cooked_bee_back_meat",
        "value": 75
      },
      {
        "item": "butchery:cooked_sniffer_steak",
        "value": 338
      },
      {
        "item": "butchery:cooked_panda_steak",
        "value": 180
      },
      {
        "item": "butchery:cooked_turtle_meat",
        "value": 90
      },
      {
        "item": "butchery:cooked_heart",
        "value": 53
      },
      {
        "item": "butchery:cooked_liver",
        "value": 45
      },
      {
        "item": "butchery:cooked_stomach",
        "value": 33
      },
      {
        "item": "butchery:cooked_lungs",
        "value": 33
      },
      {
        "item": "butchery:cooked_kidney",
        "value": 33
      },
      {
        "item": "butchery:cooked_intestines",
        "value": 27
      },
      {
        "item": "butchery:cooked_enderman_liver",
        "value": 270
      },
      {
        "item": "butchery:cooked_enderman_lungs",
        "value": 203
      },
      {
        "item": "butchery:cooked_enderman_kidney",
        "value": 203
      },
      {
        "item": "butchery:cooked_enderman_intestines",
        "value": 158
      },
      {
        "item": "butchery:cooked_enderman_stomach",
        "value": 158
      },
      {
        "item": "butchery:cooked_sausage",
        "value": 41
      },
      {
        "item": "butchery:cooked_sausages",
        "value": 135
      },
      {
        "item": "butchery:cooked_blood_sausage",
        "value": 45
      },
      {
        "item": "butchery:cooked_blood_sausages",
        "value": 158
      },
      {
        "item": "butchery:cooked_ham",
        "value": 57
      },
      {
        "item": "butchery:cookedhumanmeat",
        "value": 33
      },
      {
        "item": "butchery:cooked_villager_steak",
        "value": 113
      },
      {
        "item": "create_bic_bit:cooked_herring",
        "value": 24
      }
    ]
  }
];
  groups.forEach(function (group) {
    var list = global[group.array];
    var index = list.findIndex(function (entry) { return entry.item === group.after; });
    if (index < 0) {
      console.warn('[SVE registry] Missing insertion anchor ' + group.after + '; appending entries. Review after base update.');
      index = list.length - 1;
    }
    group.entries.forEach(function (entry) {
      var existing = list.findIndex(function (value) { return value.item === entry.item; });
      if (existing >= 0) {
        console.warn('[SVE registry] Existing item ' + entry.item + '; retaining upstream entry. Review after base update.');
        return;
      }
      list.splice(++index, 0, entry);
      var category = group.array === 'artisanGoods' ? 'wood' : 'crop';
      global.trades.set(entry.item, {
        value: global.getConfiguredValue(entry.value, category),
        multiplier: 'shippingbin:' + category + '_sell_multiplier'
      });
    });
  });
})();
