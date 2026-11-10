// priority: -400
// Minimum practical ingredient floors, final shipping values (no extra 1.4x).
// Uses guaranteed batch outputs; no fuel, equipment or rare-cut valuation.
(() => {
  const trades = global.trades;
  const namespace = 'create_bic_bit:';
  const value = (id) => {
    if (!trades.has(id)) throw new Error('[SVE food pricing] Missing baseline: ' + id);
    return Number(trades.get(id).value);
  };
  const grain = Math.min(value('minecraft:wheat'), value('farm_and_charm:barley'),
    value('farm_and_charm:oat'), value('farm_and_charm:corn'));
  const flour = grain / 4; // Farm & Charm mincer.
  const sugar = value('minecraft:sugar_cane') / 2; // Guaranteed Create milling output.
  const yeast = (grain + sugar) / 12; // Pack's cooking-pot recipe; reusable water vessel.
  const dough = (flour + yeast) / 5; // Pack's mixer recipe.
  const milk = value('society:sheep_milk'); // 250 mB Society milk, no container.
  const meat = value('butchery:raw_silverfish_chunks'); // One fixed cheapest priced raw-meat baseline.
  const egg = value('minecraft:egg');
  const cheese = value('meadow:piece_of_sheep_cheese');
  const oil = value('society:oil') / 2; // 250 mB/bottle, 125 mB/serving; no bottle credit.
  const paper = value('minecraft:sugar_cane'); // Three cane -> three paper.
  const fluids = {
    'create:chocolate': sugar + value('minecraft:cocoa_beans') + milk,
    'create_bic_bit:ketchup': sugar + value('minecraft:nether_wart')
      + 2 * Math.min(value('minecraft:beetroot'), value('farmersdelight:tomato')),
    'create_bic_bit:mayonnaise': 3 * egg + milk
  }; // Costs per 250 mB; water and reusable containers excluded.
  const floors = {
    fries: value('minecraft:potato') + oil,
    oliebollen: dough + oil,
    churros: dough + sugar + oil,
    eggball: egg + flour + oil,
    bitterballen: meat + flour + milk + oil,
    kroket: meat + 2 * flour + milk + oil,
    frikandel: meat + flour + egg + oil,
    cheese_souffle: cheese + flour + oil,
    chocolate_glazed_stroopwafel: value(namespace + 'stroopwafel') + fluids['create:chocolate']
  };
  const basePrice = (name) => trades.has(namespace + name) ? value(namespace + name) : 0;
  const price = (name) => Math.max(basePrice(name), Math.ceil(floors[name] || 0));
  const upgrades = [
  {
    "input": "churros",
    "extra": {
      "item": "minecraft:paper"
    },
    "output": "wrapped_churros",
    "count": 1
  },
  {
    "input": "chocolate_glazed_stroopwafel",
    "extra": {
      "item": "minecraft:paper"
    },
    "output": "wrapped_chocolate_glazed_stroopwafel",
    "count": 1
  },
  {
    "input": "fries",
    "extra": {
      "item": "minecraft:paper"
    },
    "output": "wrapped_fries",
    "count": 1
  },
  {
    "input": "stroopwafel",
    "extra": {
      "item": "minecraft:paper"
    },
    "output": "wrapped_stroopwafel",
    "count": 1
  },
  {
    "input": "churros",
    "extra": {
      "amount": 250,
      "fluid": "create:chocolate",
      "nbt": {}
    },
    "output": "coated_churros",
    "count": 1
  },
  {
    "input": "frikandel_sandwich",
    "extra": {
      "amount": 250,
      "fluid": "create_bic_bit:ketchup",
      "nbt": {}
    },
    "output": "ketchup_topped_frikandel_sandwich",
    "count": 1
  },
  {
    "input": "kroket_sandwich",
    "extra": {
      "amount": 250,
      "fluid": "create_bic_bit:ketchup",
      "nbt": {}
    },
    "output": "ketchup_topped_kroket_sandwich",
    "count": 1
  },
  {
    "input": "ketchup_topped_frikandel_sandwich",
    "extra": {
      "amount": 250,
      "fluid": "create_bic_bit:mayonnaise",
      "nbt": {}
    },
    "output": "mayonnaise_ketchup_topped_frikandel_sandwich",
    "count": 1
  },
  {
    "input": "ketchup_topped_kroket_sandwich",
    "extra": {
      "amount": 250,
      "fluid": "create_bic_bit:mayonnaise",
      "nbt": {}
    },
    "output": "mayonnaise_ketchup_topped_kroket_sandwich",
    "count": 1
  },
  {
    "input": "frikandel_sandwich",
    "extra": {
      "amount": 250,
      "fluid": "create_bic_bit:mayonnaise",
      "nbt": {}
    },
    "output": "mayonnaise_topped_frikandel_sandwich",
    "count": 1
  },
  {
    "input": "mayonnaise_topped_frikandel_sandwich",
    "extra": {
      "amount": 250,
      "fluid": "create_bic_bit:ketchup",
      "nbt": {}
    },
    "output": "mayonnaise_ketchup_topped_frikandel_sandwich",
    "count": 1
  },
  {
    "input": "mayonnaise_topped_kroket_sandwich",
    "extra": {
      "amount": 250,
      "fluid": "create_bic_bit:ketchup",
      "nbt": {}
    },
    "output": "mayonnaise_ketchup_topped_kroket_sandwich",
    "count": 1
  },
  {
    "input": "kroket_sandwich",
    "extra": {
      "amount": 250,
      "fluid": "create_bic_bit:mayonnaise",
      "nbt": {}
    },
    "output": "mayonnaise_topped_kroket_sandwich",
    "count": 1
  },
  {
    "input": "wrapped_churros",
    "extra": {
      "amount": 250,
      "fluid": "create:chocolate",
      "nbt": {}
    },
    "output": "wrapped_coated_churros",
    "count": 1
  },
  {
    "input": "wrapped_stroopwafel",
    "extra": {
      "amount": 250,
      "fluid": "create:chocolate",
      "nbt": {}
    },
    "output": "wrapped_chocolate_glazed_stroopwafel",
    "count": 1
  },
  {
    "input": "wrapped_fries",
    "extra": {
      "amount": 250,
      "fluid": "create_bic_bit:ketchup",
      "nbt": {}
    },
    "output": "wrapped_ketchup_topped_fries",
    "count": 1
  },
  {
    "input": "wrapped_ketchup_topped_fries",
    "extra": {
      "amount": 250,
      "fluid": "create_bic_bit:mayonnaise",
      "nbt": {}
    },
    "output": "wrapped_mayonnaise_ketchup_topped_fries",
    "count": 1
  },
  {
    "input": "wrapped_fries",
    "extra": {
      "amount": 250,
      "fluid": "create_bic_bit:mayonnaise",
      "nbt": {}
    },
    "output": "wrapped_mayonnaise_topped_fries",
    "count": 1
  },
  {
    "input": "wrapped_mayonnaise_topped_fries",
    "extra": {
      "amount": 250,
      "fluid": "create_bic_bit:ketchup",
      "nbt": {}
    },
    "output": "wrapped_mayonnaise_ketchup_topped_fries",
    "count": 1
  },
  {
    "input": "frikandel",
    "extra": {
      "item": "minecraft:bread"
    },
    "output": "frikandel_sandwich",
    "count": 1
  },
  {
    "input": "kroket",
    "extra": {
      "item": "minecraft:bread"
    },
    "output": "kroket_sandwich",
    "count": 1
  }
];
  // Ingredient values for assembled meals use the finished ingredient's revised
  // shipping price, preventing a sandwich upgrade from destroying sale value.
  let candidates;
  for (let pass = 0; pass < upgrades.length; pass++) {
    candidates = {};
    upgrades.forEach((recipe) => {
      if (!Object.prototype.hasOwnProperty.call(floors, recipe.input) && !basePrice(recipe.input)) return;
      const extra = recipe.extra;
      const cost = extra.item === 'minecraft:paper' ? paper : extra.item ? value(extra.item)
        : fluids[extra.fluid] * extra.amount / 250;
      if (!Number.isFinite(cost)) throw new Error('[SVE food pricing] Unknown extra ingredient');
      const total = (price(recipe.input) + cost) / recipe.count;
      candidates[recipe.output] = candidates[recipe.output] === undefined ? total
        : Math.min(candidates[recipe.output], total);
    });
    Object.keys(candidates).forEach((name) => { floors[name] = candidates[name]; });
  }
  Object.keys(floors).forEach((name) => {
    const id = namespace + name;
    const old = trades.get(id);
    trades.set(id, Object.assign({}, old || {multiplier:'shippingbin:crop_sell_multiplier'},
      {value: Math.max(old ? Number(old.value) : 0, Math.ceil(floors[name]))}));
  });
  global.sveFoodPriceFloors = floors;
})();
