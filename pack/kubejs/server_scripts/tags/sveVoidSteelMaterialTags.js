// priority: 0
// The Valley: bridge Create Utilities materials to Create Metallurgy's Forge tags.
// Keep these tags separate from upstream Society scripts when updating the pack.
ServerEvents.tags("item", (event) => {
  event.add("forge:ingots/void_steel", "createutilities:void_steel_ingot");
  event.add("forge:plates/void_steel", "createutilities:void_steel_sheet");
  event.add("forge:storage_blocks/void_steel", "createutilities:void_steel_block");
});
