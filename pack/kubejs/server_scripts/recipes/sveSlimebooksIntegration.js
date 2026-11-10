// priority: -200
// SVE: restore addon hearts after Society removes default heart recipes.
ServerEvents.recipes(function (event) {
  if (!Platform.isLoaded("slimes_and_slimebooks")) return;
  event.remove({id: "splendid_slimes:plort_pressing/ink_plort_pressing"});
  event.custom({
  "type": "splendid_slimes:plort_pressing",
  "ingredient": {
    "count": 1,
    "item": "irons_spellbooks:rare_ink"
  },
  "output": {
    "item": "splendid_slimes:slime_heart",
    "nbt": {
      "slime": {
        "id": "splendid_slimes:slimy"
      }
    }
  },
  "result": {
    "item": "splendid_slimes:slime_heart",
    "nbt": {
      "slime": {
        "id": "splendid_slimes:ink"
      }
    }
  }
}).id("splendid_slimes:plort_pressing/ink_plort_pressing");
  event.remove({id: "splendid_slimes:plort_pressing/ink_plort_pressing2"});
  event.custom({
  "type": "splendid_slimes:plort_pressing",
  "ingredient": {
    "count": 64,
    "item": "splendid_slimes:plort",
    "nbt": {
      "plort": {
        "id": "splendid_slimes:ink"
      }
    }
  },
  "result": {
    "item": "splendid_slimes:slime_heart",
    "nbt": {
      "slime": {
        "id": "splendid_slimes:ink"
      }
    }
  }
}).id("splendid_slimes:plort_pressing/ink_plort_pressing2");
  event.remove({id: "splendid_slimes:plort_pressing/runic_plort_pressing"});
  event.custom({
  "type": "splendid_slimes:plort_pressing",
  "ingredient": {
    "count": 1,
    "item": "irons_spellbooks:blank_rune"
  },
  "output": {
    "item": "splendid_slimes:slime_heart",
    "nbt": {
      "slime": {
        "id": "splendid_slimes:ink"
      }
    }
  },
  "result": {
    "item": "splendid_slimes:slime_heart",
    "nbt": {
      "slime": {
        "id": "splendid_slimes:runic"
      }
    }
  }
}).id("splendid_slimes:plort_pressing/runic_plort_pressing");
  event.remove({id: "splendid_slimes:plort_ripping/ink_plort_ripping"});
  event.custom({
  "type": "splendid_slimes:plort_ripping",
  "ingredient": {
    "item": "splendid_slimes:plort",
    "nbt": {
      "plort": {
        "id": "splendid_slimes:ink"
      }
    }
  },
  "results": [
    {
      "item": "irons_spellbooks:common_ink",
      "count": 1,
      "weight": 95
    },
    {
      "item": "irons_spellbooks:uncommon_ink",
      "count": 1,
      "weight": 5
    }
  ]
}).id("splendid_slimes:plort_ripping/ink_plort_ripping");
});
