// Remove only the redundant heated 1000 mB -> 1000 mB echo recipe.
ServerEvents.recipes(function (event) {
  event.remove({ id: 'create_deep_dark:mixing_molten_echo_compat' });
});
