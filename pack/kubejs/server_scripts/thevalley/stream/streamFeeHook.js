// priority: -100
// The Valley 방송 시스템: 병원비(global.handleFee, globalServer.js)를 낼 때
// 미정산 후원금도 계좌에 있는 돈으로 쳐서 계산하고, 계좌에서 먼저 빼고 모자란 만큼만 미정산금에서 뺀다.
// 방법: 잠깐 미정산금을 잔고에 더한 상태로 원래 병원비를 걷고, 남은 잔고를 계좌/미정산금으로 다시 나눈다.
// 우선순위를 낮춰 globalServer.js보다 늦게 불러온다.

// Rhino는 최상위 if 블록 안의 const를 전역으로 취급해서 "redeclaration" 오류가 나므로 함수로 감싼다
(function () {
if (global.handleFee && !global.handleFee.tvWrapped) {
  const tvOriginalHandleFee = global.handleFee;
  const tvFeeFmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const tvWrappedHandleFee = (server, player, reason) => {
    let account = null;
    let pending = 0;
    try {
      pending = Number(player.persistentData.tvPending) || 0;
      if (pending > 0) account = global.getPersonalOrCurioAccount(player.level, player);
    } catch (err) {
      account = null;
    }
    if (!account || pending <= 0) {
      tvOriginalHandleFee(server, player, reason);
      return;
    }
    const balance = Number(account.getBalance()) || 0;
    account.setBalance(balance + pending);
    try {
      tvOriginalHandleFee(server, player, reason);
    } finally {
      const after = Number(account.getBalance()) || 0;
      const paid = balance + pending - after;
      if (after >= pending) {
        // 계좌로 다 냈음: 미정산금은 그대로
        account.setBalance(after - pending);
      } else {
        // 계좌가 0이 되고 모자란 만큼 미정산금에서
        account.setBalance(0);
        const fromPending = pending - after;
        player.persistentData.tvPending = after;
        player.tell(
          Text.of(`[방송] 병원비 ${tvFeeFmt(paid)}: 계좌 ${tvFeeFmt(balance)} + 미정산 후원금 ${tvFeeFmt(fromPending)} (남은 미정산금 ${tvFeeFmt(after)})`).red()
        );
      }
    }
  };
  tvWrappedHandleFee.tvWrapped = true;
  global.handleFee = tvWrappedHandleFee;
  console.info("[TheValley] streamFeeHook.js: 병원비 연결됨");
} else {
  console.warn("[TheValley] streamFeeHook.js: global.handleFee 없음 또는 이미 연결됨");
}
})();
