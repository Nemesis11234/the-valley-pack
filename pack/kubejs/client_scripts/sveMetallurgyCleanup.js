JEIEvents.hideItems((event) => {
  ["createmetallurgy:molten_tin_bucket", "createmetallurgy:molten_nickel_bucket", "createmetallurgy:molten_lithium_bucket", "createmetallurgy:molten_osmium_bucket", "createmetallurgy:molten_bronze_bucket", "createmetallurgy:molten_constantan_bucket", "createmetallurgy:molten_invar_bucket", "createmetallurgy:molten_necromium_bucket", "createdeco:brass_coinstack", "createdeco:copper_coinstack", "createdeco:gold_coinstack", "createdeco:industrial_iron_coinstack", "createdeco:iron_coinstack", "createdeco:netherite_coinstack", "createdeco:zinc_coinstack", "createdeco:netherite_nugget"].forEach((item) => event.hide(item));
});
JEIEvents.hideFluids((event) => {
  ["createmetallurgy:molten_tin", "createmetallurgy:molten_nickel", "createmetallurgy:molten_lithium", "createmetallurgy:molten_osmium", "createmetallurgy:molten_bronze", "createmetallurgy:molten_constantan", "createmetallurgy:molten_invar", "createmetallurgy:molten_necromium"].forEach((fluid) => event.hide(fluid));
});
