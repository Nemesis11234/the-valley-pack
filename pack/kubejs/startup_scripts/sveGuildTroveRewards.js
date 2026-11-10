// priority: -1000
// Scope the exclusion to Relic Troves. Preserve society:relics and all existing quests.
(function () {
  var changed = 0;
  global.extractinatorRecipes.forEach(function (recipe) {
    if (recipe.input !== 'society:relic_trove') return;
    recipe.output.forEach(function (entry) {
      if (entry && entry.drop === '#society:relics' && entry.drop_chance === 1) {
        entry.drop = '#sve:relic_trove_rewards';
        changed++;
      }
    });
  });
  if (changed !== 1) throw new Error('[SVE Guild] Relic Trove layout changed; expected exactly one relic pool, found ' + changed);
})();
