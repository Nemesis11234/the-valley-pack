// priority: -200
// SVE: register after Society removes default heart recipes.
ServerEvents.recipes(function (event) {
  if (!Platform.isLoaded("deeper_and_slimier")) return;
  if (Platform.isLoaded("slimes_and_slimebooks")) {
  event.custom({
  "type": "splendid_slimes:plort_pressing",
  "ingredient": {
    "item": "create_deep_dark:echo_ingot",
    "count": 4
  },
  "output": {
    "item": "splendid_slimes:slime_heart",
    "nbt": {
      "slime": {
        "id": "splendid_slimes:runic"
      }
    }
  },
  "result": {
    "item": "splendid_slimes:slime_heart",
    "nbt": {
      "slime": {
        "id": "splendid_slimes:sculk"
      }
    }
  }
}).id("sve:slimes/sculk_from_runic");
  }
  event.custom({
  "type": "splendid_slimes:plort_pressing",
  "ingredient": {
    "item": "splendid_slimes:plort",
    "count": 64,
    "nbt": {
      "plort": {
        "id": "splendid_slimes:sculk"
      }
    }
  },
  "result": {
    "item": "splendid_slimes:slime_heart",
    "nbt": {
      "slime": {
        "id": "splendid_slimes:sculk"
      }
    }
  }
}).id("sve:slimes/sculk_from_plorts");
});
