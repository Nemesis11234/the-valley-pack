// priority: -200
// SVE addon prices. Keep global.plorts unchanged: Society uses that array
// to generate 16-plort heart recipes, which these addon breeds do not use.
global.sveSlimeShipping = {};
var sveAddonSlimePrices = [
  { type: "splendid_slimes:ink", value: 128, mod: "slimes_and_slimebooks" },
  { type: "splendid_slimes:runic", value: 256, mod: "slimes_and_slimebooks" },
  { type: "splendid_slimes:sculk", value: 128, mod: "deeper_and_slimier" }
];
sveAddonSlimePrices.forEach(function (entry) {
  if (!Platform.isLoaded(entry.mod)) return;
  var heartValue = entry.value * 16;
  global.sveSlimeShipping[entry.type] = { plort: entry.value, heart: heartValue };
  global.trades.set("splendid_slimes:plort/" + entry.type, {
    value: global.getConfiguredValue(entry.value, "crop"),
    multiplier: "shippingbin:crop_sell_multiplier"
  });
  global.trades.set("splendid_slimes:slime_heart/" + entry.type, {
    value: global.getConfiguredValue(heartValue, "crop"),
    multiplier: "shippingbin:crop_sell_multiplier"
  });
});
