// priority: -100
// The Valley 방송 시스템: 팩의 병원비(global.handleFee, globalServer.js)가 청구될 때
// 미정산 후원금에서도 같은 비율로 뺀다. 우선순위를 낮춰 globalServer.js보다 늦게 불러온다.

if (global.handleFee && !global.handleFee.tvWrapped) {
  const tvOriginalHandleFee = global.handleFee;
  const tvWrappedHandleFee = (server, player, reason) => {
    tvOriginalHandleFee(server, player, reason);
    try {
      if (global.tvPendingFee) global.tvPendingFee(player, reason);
    } catch (err) {
      console.error("[TheValley] stream fee hook error: " + err);
    }
  };
  tvWrappedHandleFee.tvWrapped = true;
  global.handleFee = tvWrappedHandleFee;
  console.info("[TheValley] streamFeeHook.js: 병원비 연결됨");
} else {
  console.warn("[TheValley] streamFeeHook.js: global.handleFee 없음 또는 이미 연결됨");
}
