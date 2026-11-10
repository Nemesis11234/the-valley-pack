// Aircraft recipes use Create's propeller through sveReplaceRecipes.js.
ServerEvents.recipes(function (event) {
  event.remove({ id: 'immersive_aircraft:propeller' });
});
