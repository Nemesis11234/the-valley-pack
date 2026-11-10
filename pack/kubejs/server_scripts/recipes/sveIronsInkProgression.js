// priority: -100
// SVE ink progression. Preserve scroll recycling and all bottle handling.
ServerEvents.recipes(function (event) {
  event.remove({id: "irons_spellbooks:alchemist_cauldron/brew_uncommon_ink"});
  event.remove({id: "irons_spellbooks:alchemist_cauldron/brew_rare_ink"});
  event.remove({id: "irons_spellbooks:alchemist_cauldron/brew_epic_ink"});
  event.remove({id: "irons_spellbooks:alchemist_cauldron/brew_legendary_ink"});
  event.custom({
  "type": "minecraft:crafting_shapeless",
  "ingredients": [
    {
      "item": "supplementaries:antique_ink"
    },
    {
      "item": "supplementaries:antique_ink"
    },
    {
      "item": "supplementaries:antique_ink"
    },
    {
      "item": "supplementaries:antique_ink"
    },
    {
      "item": "supplementaries:antique_ink"
    },
    {
      "item": "supplementaries:antique_ink"
    }
  ],
  "result": {
    "item": "society:legendary_ink",
    "count": 1
  }
}).id("sve:ink/antique_to_society_ink");
  event.custom({
  "type": "minecraft:crafting_shaped",
  "pattern": [
    "DDD",
    "DID",
    "DDD"
  ],
  "key": {
    "D": {
      "item": "minecraft:black_dye"
    },
    "I": {
      "item": "society:legendary_ink"
    }
  },
  "result": {
    "item": "irons_spellbooks:common_ink",
    "count": 1
  }
}).id("sve:ink/common_ink");
  event.custom({
  "type": "create:mixing",
  "ingredients": [
    {
      "fluid": "irons_spellbooks:common_ink",
      "amount": 750
    },
    {
      "fluid": "create_enchantment_industry:experience",
      "amount": 250
    },
    {
      "item": "botania:green_petal"
    },
    {
      "item": "botania:green_petal"
    },
    {
      "item": "botania:green_petal"
    },
    {
      "item": "botania:green_petal"
    }
  ],
  "results": [
    {
      "fluid": "irons_spellbooks:uncommon_ink",
      "amount": 250
    }
  ],
  "heatRequirement": "heated"
}).id("sve:ink/uncommon_ink");
  event.custom({
  "type": "create:mixing",
  "ingredients": [
    {
      "fluid": "irons_spellbooks:uncommon_ink",
      "amount": 750
    },
    {
      "fluid": "create_enchantment_industry:experience",
      "amount": 250
    },
    {
      "item": "botania:blue_petal"
    },
    {
      "item": "botania:blue_petal"
    },
    {
      "item": "botania:blue_petal"
    },
    {
      "item": "botania:blue_petal"
    },
    {
      "item": "botania:blue_petal"
    },
    {
      "item": "botania:blue_petal"
    }
  ],
  "results": [
    {
      "fluid": "irons_spellbooks:rare_ink",
      "amount": 250
    }
  ],
  "heatRequirement": "heated"
}).id("sve:ink/rare_ink");
  event.custom({
  "type": "create:mixing",
  "ingredients": [
    {
      "fluid": "irons_spellbooks:rare_ink",
      "amount": 750
    },
    {
      "fluid": "create_enchantment_industry:experience",
      "amount": 250
    },
    {
      "item": "botania:pink_petal"
    },
    {
      "item": "botania:pink_petal"
    },
    {
      "item": "botania:pink_petal"
    },
    {
      "item": "botania:pink_petal"
    },
    {
      "item": "botania:pink_petal"
    },
    {
      "item": "botania:pink_petal"
    },
    {
      "item": "botania:pink_petal"
    },
    {
      "item": "botania:pink_petal"
    }
  ],
  "results": [
    {
      "fluid": "irons_spellbooks:epic_ink",
      "amount": 250
    }
  ],
  "heatRequirement": "superheated"
}).id("sve:ink/epic_ink");
  event.custom({
  "type": "create:mixing",
  "ingredients": [
    {
      "fluid": "irons_spellbooks:epic_ink",
      "amount": 750
    },
    {
      "fluid": "create_enchantment_industry:experience",
      "amount": 250
    },
    {
      "item": "botania:yellow_petal_block"
    },
    {
      "item": "botania:yellow_petal_block"
    },
    {
      "item": "botania:yellow_petal_block"
    },
    {
      "item": "botania:yellow_petal_block"
    }
  ],
  "results": [
    {
      "fluid": "irons_spellbooks:legendary_ink",
      "amount": 250
    }
  ],
  "heatRequirement": "superheated"
}).id("sve:ink/legendary_ink");
});
