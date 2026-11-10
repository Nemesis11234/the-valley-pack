// Hide all material/NBT variants from JEI's item list.
// Does not remove items, recipes, or Chisels & Bits functionality.
JEIEvents.hideItems(function (event) {
  event.hide('chiselsandbits:block_bit');
});
