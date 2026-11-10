// The Valley 방송 시스템: 낚시 이벤트를 서버 스크립트(global.tvOnFished)로 넘긴다.
// Forge 이벤트는 시작 스크립트에서만 등록할 수 있어서 따로 둔다.

ForgeEvents.onEvent("net.minecraftforge.event.entity.player.ItemFishedEvent", (e) => {
  try {
    if (!global.tvOnFished) return;
    const ids = [];
    e.getDrops().forEach((drop) => {
      if (drop.hasTag("minecraft:fishes")) ids.push(String(drop.id));
    });
    if (ids.length) global.tvOnFished(e.getEntity(), ids);
  } catch (err) {
    console.error("[TheValley] streamFishing error: " + err);
  }
});
