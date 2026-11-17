// priority: 0
// 새 월드(초기화 직후)면 스폰 주변 지형을 미리 만들어 둔다 (Chunky 모드).
//  - 돌아다닐 때 서버가 그 자리에서 지형을 만들며 생기는 렉을 줄이기 위함
//  - 월드마다 한 번만. 사람이 접속해 있으면 잠깐 멈추고, 아무도 없으면 이어서 함
// 주의: 이 Rhino는 블록({ }) 안의 const를 오류로 처리함. let만.

const TV_PREGEN = {
  radius: 1000, // 스폰에서 이 거리(블록)까지. 1000이면 약 1만 5천 청크, 이 서버로 10~20분 정도
  manageHours: 3, // 시작 후 이 시간 동안만 멈춤·재개 관리 (그 뒤엔 끝났다고 봄)
};

let tvPregenPaused = false;

ServerEvents.loaded((e) => {
  let server = e.server;
  let pd = server.persistentData;
  if (pd.getLong("tvPregenAt") > 0) return;
  // 서버가 막 켜졌을 땐 Chunky가 아직 준비 전이라 명령이 무시됨 → 10초 뒤에 시작 (2026-11-17 확인)
  server.scheduleInTicks(200, () => {
    let spawn = server.overworld().getSharedSpawnPos();
    let x = spawn.x, z = spawn.z;
    server.runCommandSilent("chunky world minecraft:overworld");
    server.runCommandSilent(`chunky center ${x} ${z}`);
    server.runCommandSilent(`chunky radius ${TV_PREGEN.radius}`);
    server.runCommandSilent("chunky start");
    pd.putLong("tvPregenAt", Date.now());
    tvPregenPaused = false;
    console.info(`[pregen] 새 월드: 스폰(${x}, ${z}) 주변 반경 ${TV_PREGEN.radius} 지형 미리 만들기 시작`);
  });
});

ServerEvents.tick((e) => {
  let server = e.server;
  if (server.tickCount % 200 != 0) return;
  let at = server.persistentData.getLong("tvPregenAt");
  if (!at || Date.now() - at > TV_PREGEN.manageHours * 3600000) return;
  let online = server.players.size() > 0;
  if (online && !tvPregenPaused) {
    server.runCommandSilent("chunky pause");
    tvPregenPaused = true;
    console.info("[pregen] 접속자 있음: 지형 미리 만들기 잠깐 멈춤");
  } else if (!online && tvPregenPaused) {
    server.runCommandSilent("chunky continue");
    tvPregenPaused = false;
    console.info("[pregen] 접속자 없음: 지형 미리 만들기 이어서 함");
  }
});
