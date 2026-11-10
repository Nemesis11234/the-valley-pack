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

  // 미정산 후원금 한도 없음. 병원비는 (계좌 + 미정산금) 기준으로 계산해서
  // 계좌에서 먼저 빼고, 모자란 만큼만 미정산금에서 뺌 (streamFeeHook.js)

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

  // 일간 순위: 매일 자정(UTC+9, 한국·일본 시간)에 정산, 1·2·3등 보너스 = 그날 최고 시청자 × 배수
  rankUtcOffsetHours: 9,
  rankRewards: [10, 5, 2],

  // 구독자 달성 트로피 (Trofers 모드 트로피 블록으로 지급)
  trophies: [
    { subs: 100, id: "thevalley:button_silver", name: "실버 버튼", color: "#D9D9D9", block: "trofers:medium_pillar" },
    { subs: 1000, id: "thevalley:button_gold", name: "골드 버튼", color: "#FFD54F", block: "trofers:medium_pillar" },
    { subs: 10000, id: "thevalley:button_diamond", name: "다이아 버튼", color: "#7FE7FF", block: "trofers:large_pillar" },
  ],

  // 비속어: 채팅에 섞이면 시청자가 빠짐. 같은 날 반복할수록 더 많이 빠지고, 3번째부터 구독자도 줄어듦
  swearWords: ["시발", "씨발", "ㅅㅂ", "ㅆㅂ", "병신", "ㅂㅅ", "좆", "존나", "ㅈㄴ", "개새", "새끼", "미친놈", "미친년", "꺼져", "닥쳐", "지랄", "ㅈㄹ", "fuck", "shit"],
  swearHype: 15, // 1번째 -15, 2번째 -30 ... (최대 -60)
  swearSubsFrom: 3, // 이 횟수부터 구독자 -1씩

  // 평소 잡담 간격(초): 시청자 적을 때 max ↔ 1,000명 이상일 때 min
  idleChatMaxSec: 15,
  idleChatMinSec: 2.5,
  // AI 잡담 간격(초)
  aiIdleMaxSec: 90,
  aiIdleMinSec: 25,

  // 방송 채팅창: 보이는 줄 수, 줄이 사라지는 시간(초)
  chatLines: 6,
  chatLineLifeSec: 40,
};
