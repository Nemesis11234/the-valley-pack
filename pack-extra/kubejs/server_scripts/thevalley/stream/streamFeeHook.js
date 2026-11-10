// priority: -100
// The Valley 방송 시스템: 팩의 병원비(global.handleFee, globalServer.js)가 청구될 때
// 미정산 후원금에서도 같은 비율로 뺀다. 우선순위를 낮춰 globalServer.js보다 늦게 불러온다.

if (global.handleFee && !global.handleFee.tvWrapped) {
  const tvOriginalHandleFee = global.handleFee;
  // 계좌에서 실제로 걷힌 금액(잔고 감소 + 늘어난 빚)을 재서, 미정산금 병원비와 합쳐 상한을 한 번만 적용
  const tvFeeBalance = (player) => {
    try {
      return Number(global.getPersonalOrCurioAccount(player.level, player).getBalance()) || 0;
    } catch (err) {
      return 0;
    }
  };
  const tvFeeDebt = (server, player) => {
    let debt = 0;
    const debts = server.persistentData.debts;
    if (!debts) return 0;
    for (let i = 0; i < debts.length; i++) {
      if (String(debts[i].uuid) === String(player.getUuid())) debt = Number(debts[i].amount) || 0;
    }
    return debt;
  };
  const tvWrappedHandleFee = (server, player, reason) => {
    const balBefore = tvFeeBalance(player);
    const debtBefore = tvFeeDebt(server, player);
    tvOriginalHandleFee(server, player, reason);
    try {
      const charged = Math.max(0, balBefore - tvFeeBalance(player)) + Math.max(0, tvFeeDebt(server, player) - debtBefore);
      if (global.tvPendingFee) global.tvPendingFee(player, reason, charged);
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
