console.info("[DramTweaks] addMixerRecipesDramTweaks.js loaded");

ServerEvents.recipes((e) => {
  const createMixerRecipe = (inputs, output, count) => {
    e.custom({
      type: "create:mixing",
      results: [
        {
          item: output,
          count: count,
        },
      ],
      ingredients: inputs,
    });
  };

  const recipes = [
    {
      output: "create_bic_bit:kruidnoten",
      count: 2,
      inputs: [
        {
          item: "bakery:sweet_dough",
        },
        {
          item: "create_bic_bit:crushed_nether_wart",
        },
      ],
    },
    {
      output: "create_bic_bit:oliebollen",
      inputs: [
        {
          item: "farm_and_charm:dough",
        },
        {
          amount: 125,
          fluid: "create_bic_bit:frying_oil",
        },
      ],
    },
    {
      output: "create_bic_bit:raw_kroket",
      inputs: [
        {
          tag: "forge:raw_meat",
        },
        {
          item: "farm_and_charm:flour",
        },
        {
          item: "farm_and_charm:flour",
        },
        {
          amount: 250,
          fluid: "society:milk",
        },
      ],
    },
    {
      output: "create_bic_bit:raw_bitterballen",
      inputs: [
        {
          tag: "forge:raw_meat",
        },
        {
          item: "farm_and_charm:flour",
        },
        {
          amount: 250,
          fluid: "society:milk",
        },
      ],
    },
    {
      output: "create_bic_bit:raw_eggball",
      inputs: [
        {
          tag: "bakery:eggs",
        },
        {
          item: "farm_and_charm:flour",
        },
      ],
    },
    {
      output: "create_bic_bit:raw_frikandel",
      inputs: [
        {
          tag: "forge:raw_meat",
        },
        {
          item: "farm_and_charm:flour",
        },
        {
          tag: "bakery:eggs",
        },
      ],
    },
    {
      output: "create_bic_bit:raw_churros",
      inputs: [
        {
          item: "farm_and_charm:dough",
        },
        {
          item: "minecraft:sugar",
        },
      ],
    },
    {
      output: "create_bic_bit:raw_cheese_souffle",
      inputs: [
        {
          tag: "forge:cheese",
        },
        {
          item: "farm_and_charm:flour",
        },
      ],
    },
  ];
  recipes.forEach((recipe) => {
    createMixerRecipe(recipe.inputs, recipe.output, recipe.count || 1);
  });
});
