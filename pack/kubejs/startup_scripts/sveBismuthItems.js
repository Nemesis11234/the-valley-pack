// Pack-owned items; restart Minecraft after installation.
StartupEvents.registry("item", (event) => {
  event.create("sve:dirty_bismuth_dust")
    .displayName("Dirty Bismuth Dust")
    .texture("createmetallurgy:item/dirty_iron_dust")
    .color(0, 0xd8b6e8);
  event.create("sve:bismuth_dust")
    .displayName("Bismuth Dust")
    .texture("createmetallurgy:item/iron_dust")
    .color(0, 0xd8b6e8);
});
