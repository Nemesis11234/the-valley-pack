// Hide every spell/level variant by item ID, without matching specific NBT.
// Item-list cleanup only: no recipes, categories, or loot are removed.
JEIEvents.hideItems(function (event) {
  event.hide('irons_spellbooks:scroll');
});
