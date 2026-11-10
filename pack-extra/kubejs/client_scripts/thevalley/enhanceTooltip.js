// The Valley 강화 시스템: 강화된 아이템 이름 앞에 +단계, 아래에 강화 정보 표시

const tvEnhanceTooltip = (item, advanced, text) => {
  let nbt = item.nbt;
  if (!nbt || !nbt.contains("tvEnhance")) return;
  let level = nbt.getInt("tvEnhance");
  if (level <= 0) return;
  let color = level >= 13 ? "#FF5555" : level >= 10 ? "#FFAA00" : level >= 5 ? "#C77DFF" : "#7EE0A1";
  text.set(0, Text.of(`+${level} `).color(color).bold(true).append(text.get(0)));
  text.add(1, Text.of(`강화 +${level} / 15`).color(color));
};

ItemEvents.tooltip((tooltip) => {
  if (tooltip.addAdvancedToAll) tooltip.addAdvancedToAll(tvEnhanceTooltip);
  else tooltip.addAdvanced(Ingredient.all, tvEnhanceTooltip);
});
