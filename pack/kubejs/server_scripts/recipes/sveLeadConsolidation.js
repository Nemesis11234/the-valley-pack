// priority: -1000
// The Society recipe is added by a script, not loaded from a datapack.
// KubeJS 2001.6.5 remove() searches originalRecipes only; inspect addedRecipes too.
ServerEvents.recipes(function (event) {
  var removed = 0;
  event.addedRecipes.forEach(function (recipe) {
    recipe.serialize();
    var data = JSON.parse(recipe.json.toString());
    if (data.type !== 'create:mixing' || data.heatRequirement !== 'superheated') return;
    var ingredients = data.ingredients || [];
    var results = data.results || [];
    if (ingredients.length === 2 &&
        ingredients.some(function (x) { return x.item === 'oreganized:lead_ingot'; }) &&
        ingredients.some(function (x) { return x.item === 'create:powdered_obsidian'; }) &&
        results.length === 1 && results[0].fluid === 'oreganized:molten_lead' && results[0].amount === 200) {
      recipe.remove();
      removed++;
    }
  });
  if (removed !== 1) console.warn('[SVE lead] Expected one Society ingot/obsidian recipe, found ' + removed + '. Review base changes.');
});
