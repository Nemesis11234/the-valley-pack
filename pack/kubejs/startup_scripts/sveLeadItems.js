// Pack-owned items; full client/server restart required.
StartupEvents.registry("item", function (event) {
  event.create("sve:dirty_lead_dust")
    .displayName("Dirty Lead Dust")
    .texture("sve:item/dirty_lead_dust");
  event.create("sve:lead_dust")
    .displayName("Lead Dust")
    .texture("createmetallurgy:item/iron_dust")
    .color(0, 0x85819b);
});
