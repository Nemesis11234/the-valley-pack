// The Valley 강화 시스템 (시작 스크립트): 강화석 아이템 등록 + 강화 단계에 따른 능력치
// 강화 단계는 아이템 NBT tvEnhance(1~15)에 저장. 능력치는 Forge 이벤트로 붙여서 원래 능력치를 건드리지 않는다.

// 단계별 누적 보너스 (인덱스 = 강화 단계)
global.TV_ENHANCE_STATS = {
  // 무기 공격력 % (원래 공격력 기준)
  weaponPct: [0, 4, 8, 12, 16, 20, 25, 30, 35, 40, 50, 60, 72, 85, 100, 120],
  // 방어구 한 부위당 방어력 +
  armor: [0, 0.3, 0.6, 0.9, 1.2, 1.5, 1.8, 2.1, 2.4, 2.7, 3.2, 3.7, 4.2, 4.7, 5.2, 6],
  // 방어구 한 부위당 최대 체력 + (2 = 하트 1칸), +10부터
  health: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6],
};

StartupEvents.registry("item", (e) => {
  e.create("thevalley:enhance_stone_low").texture("thevalley:item/enhance_stone_low").displayName("하급 강화석")
    .tooltip(Text.of("대장장이 작업대에서 +1~+5 강화에 사용").gray());
  e.create("thevalley:enhance_stone_mid").texture("thevalley:item/enhance_stone_mid").displayName("중급 강화석")
    .tooltip(Text.of("대장장이 작업대에서 +6~+10 강화에 사용").gray());
  e.create("thevalley:enhance_stone_high").texture("thevalley:item/enhance_stone_high").displayName("상급 강화석")
    .tooltip(Text.of("대장장이 작업대에서 +11~+15 강화에 사용").gray());
});

const $TvAttributes = Java.loadClass("net.minecraft.world.entity.ai.attributes.Attributes");
const $TvAttributeModifier = Java.loadClass("net.minecraft.world.entity.ai.attributes.AttributeModifier");
const $TvOperation = Java.loadClass("net.minecraft.world.entity.ai.attributes.AttributeModifier$Operation");
const $TvArmorItem = Java.loadClass("net.minecraft.world.item.ArmorItem");
const $TvUUID = Java.loadClass("java.util.UUID");

const TV_ENH_UUID = {
  mainhand: $TvUUID.fromString("7a3c1e52-1f0b-4c6e-9a51-2b7d0c9e1001"),
  head: $TvUUID.fromString("7a3c1e52-1f0b-4c6e-9a51-2b7d0c9e1002"),
  chest: $TvUUID.fromString("7a3c1e52-1f0b-4c6e-9a51-2b7d0c9e1003"),
  legs: $TvUUID.fromString("7a3c1e52-1f0b-4c6e-9a51-2b7d0c9e1004"),
  feet: $TvUUID.fromString("7a3c1e52-1f0b-4c6e-9a51-2b7d0c9e1005"),
};
const TV_ENH_HP_UUID = {
  head: $TvUUID.fromString("7a3c1e52-1f0b-4c6e-9a51-2b7d0c9e1012"),
  chest: $TvUUID.fromString("7a3c1e52-1f0b-4c6e-9a51-2b7d0c9e1013"),
  legs: $TvUUID.fromString("7a3c1e52-1f0b-4c6e-9a51-2b7d0c9e1014"),
  feet: $TvUUID.fromString("7a3c1e52-1f0b-4c6e-9a51-2b7d0c9e1015"),
};

ForgeEvents.onEvent("net.minecraftforge.event.ItemAttributeModifierEvent", (e) => {
  try {
    const stack = e.getItemStack();
    const tag = stack.getTag();
    if (!tag || !tag.contains("tvEnhance")) return;
    const level = Math.max(0, Math.min(15, tag.getInt("tvEnhance")));
    if (level <= 0) return;
    const slot = String(e.getSlotType().getName());
    const item = stack.getItem();
    const st = global.TV_ENHANCE_STATS;

    if (item instanceof $TvArmorItem) {
      if (String(item.getType().getSlot().getName()) != slot) return;
      e.addModifier($TvAttributes.ARMOR, new $TvAttributeModifier(TV_ENH_UUID[slot], "tv_enhance_armor", st.armor[level], $TvOperation.ADDITION));
      if (st.health[level] > 0) {
        e.addModifier($TvAttributes.MAX_HEALTH, new $TvAttributeModifier(TV_ENH_HP_UUID[slot], "tv_enhance_health", st.health[level], $TvOperation.ADDITION));
      }
      return;
    }
    if (slot != "mainhand") return;
    // 원래 공격력(플레이어 기본 1 + 무기 덧셈 보정) 기준으로 % 만큼 더함
    let base = 1;
    e.getOriginalModifiers().get($TvAttributes.ATTACK_DAMAGE).forEach((m) => {
      if (m.getOperation() == $TvOperation.ADDITION) base += m.getAmount();
    });
    const bonus = Math.round(base * st.weaponPct[level]) / 100;
    if (bonus > 0) {
      e.addModifier($TvAttributes.ATTACK_DAMAGE, new $TvAttributeModifier(TV_ENH_UUID.mainhand, "tv_enhance_damage", bonus, $TvOperation.ADDITION));
    }
  } catch (err) {
    console.error("[TheValley] enhance attribute error: " + err);
  }
});
