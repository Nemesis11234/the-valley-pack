// priority: -200
// Preserve the established Butchery raw-mince value and shipping multiplier
// for the canonical item; retain old-stock pricing without changing other meats.
if (global.trades && global.trades.has('butchery:raw_beef_mince')) {
  if (!global.trades.has('farm_and_charm:minced_beef')) {
    global.trades.set('farm_and_charm:minced_beef',
      Object.assign({}, global.trades.get('butchery:raw_beef_mince')));
  }
}
