// priority: 100
// The Valley 방송 시스템 설정. 숫자는 여기서만 바꾸면 된다.

global.TV_CONFIG = {
  // 처음 방송 상태 (true = 접속하면 방송 켜짐)
  defaultOn: true,

  // 채널 시작 구독자
  startSubs: 10,

  // 화제성: 이 시간(초)마다 절반으로 식음
  hypeHalfLifeSec: 600,
  // 잠수·방송 OFF일 때 식는 속도 배율
  afkDecayMult: 3,
  offDecayMult: 5,

  // 잠수 판정 (초)
  afkSoftSec: 300, // 5분: 빨리 식기 시작
  afkHardSec: 900, // 15분: [잠수] 표시, 후원·미션 정지

  // 활동 중이면 이 시간(초)마다 구독자 +1 (단골이 조금씩 늘어남)
  organicSubsEverySec: 600,

  // 정산 수수료 (구독자 기준 등급)
  tiers: [
    { name: "일반", minSubs: 0, fee: 0.3 },
    { name: "베스트", minSubs: 500, fee: 0.25 },
    { name: "파트너", minSubs: 3000, fee: 0.2 },
  ],

  // 미정산 한도 = base + 구독자 × perSub (차면 후원 멈춤)
  pendingCapBase: 20000,
  pendingCapPerSub: 100,

  // 랜덤 후원: 분당 기대 횟수 = min(max, base + 시청자 / perViewers)
  donationRateBase: 0.2,
  donationRatePerViewers: 300,
  donationRateMax: 3,
  // 후원 금액 ≈ 시청자 × 이 값 (랜덤 폭 있음)
  donationPerViewer: 1.5,
  donationMin: 8,
  // 가끔 오는 큰 후원
  bigDonationChance: 0.03,
  bigDonationMult: 10,
  // 후원 중 억까 비율
  trollChance: 0.15,

  // 미션: 분당 등장 확률, 진행 중이 아닐 때만
  missionChancePerMin: 0.08,
  missionMinGapSec: 300,

  // 집(리스폰 지점)에서 이 거리 안이면 억까 금지
  homeSafeRadius: 24,

  // 방송 채팅창: 보이는 줄 수, 줄이 사라지는 시간(초)
  chatLines: 6,
  chatLineLifeSec: 40,
};
