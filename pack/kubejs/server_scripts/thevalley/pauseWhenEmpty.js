// The Valley: 접속자가 없으면 시간과 날씨를 멈춘다.
// 계절은 Serene Seasons 설정(progress_season_while_offline = false)으로 이미 멈추지만,
// 날짜·시간이 계속 흐르면 아무도 없을 때 출하·작물 성장이 돌아가서 계절과 어긋나기 때문.
// (Better Days, Serene Seasons 모두 doDaylightCycle 게임룰을 따름)

function theValleySetPaused(server, paused) {
  const value = paused ? 'false' : 'true'
  server.runCommandSilent(`gamerule doDaylightCycle ${value}`)
  server.runCommandSilent(`gamerule doWeatherCycle ${value}`)
  console.info(`[TheValley] ${paused ? '접속자 없음: 시간 멈춤' : '접속함: 시간 다시 흐름'}`)
}

// 서버가 켜질 때는 아무도 없으니 멈춘 상태로 시작
ServerEvents.loaded(event => {
  if (event.server.playerCount == 0) theValleySetPaused(event.server, true)
})

PlayerEvents.loggedIn(event => {
  theValleySetPaused(event.server, false)
})

PlayerEvents.loggedOut(event => {
  const server = event.server
  // 나가는 플레이어가 목록에서 빠진 뒤에 확인
  server.scheduleInTicks(20, () => {
    if (server.playerCount == 0) theValleySetPaused(server, true)
  })
})
