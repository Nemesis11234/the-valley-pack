// priority: -1000
// Guild equipment cannot be crafted. Run after the pack's recipe additions.
// Existing quest rewards and non-Trove loot are intentionally preserved.
ServerEvents.recipes(function (event) {
  var rewards = [
  "botania:flight_tiara",
  "botania:thunder_sword",
  "illageandspillage:bag_of_horrors",
  "irons_spellbooks:concentration_amulet",
  "irons_spellbooks:cooldown_ring",
  "irons_spellbooks:fireward_ring",
  "irons_spellbooks:poisonward_ring",
  "irons_spellbooks:pyrium_staff",
  "irons_spellbooks:wicked_bone_ring",
  "relics:amphibian_boot",
  "relics:arrow_quiver",
  "relics:bastion_ring",
  "relics:blazing_flask",
  "relics:chorus_inhibitor",
  "relics:drowned_belt",
  "relics:elytra_booster",
  "relics:enders_hand",
  "relics:leather_belt",
  "relics:reflection_necklace",
  "relics:shadow_glaive",
  "relics:space_dissector",
  "relics:spore_sack"
];
  rewards.forEach(function (item) { event.remove({ output: item }); });
  // Botania wraps the cosmetic Tiara recipes in nested NBT output recipes.
  event.remove({ id: /^botania:flighttiara_[0-9]+$/ });
});
