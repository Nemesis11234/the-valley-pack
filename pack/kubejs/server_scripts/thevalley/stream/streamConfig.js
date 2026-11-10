// priority: 100
// The Valley 방송 시스템 설정. 숫자는 여기서만 바꾸면 된다.

global.TV_CONFIG = {
  // 처음 방송 상태 (true = 접속하면 방송 켜짐)
  defaultOn: true,

  // 채널 시작 구독자
  startSubs: 10,

  // 화제성 최대치 (시청자 = 구독자 × (1 + 화제성/100), 최대 3배)
  hypeMax: 200,

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

  // 랜덤 후원 횟수: 1초마다 확률로 뽑아서 실제 횟수는 매번 달라짐.
  //   분당 평균 = min(max, base + 시청자 / perViewers) → 10명 약 시간당 6번, 100명 9번, 1,000명 36번, 1,800명 이상 60번
  donationRateBase: 0.1,
  donationRatePerViewers: 2000,
  donationRateMax: 1.0,
  // 후원 금액: 100원 ~ donationMax 사이에서 랜덤 (100원 단위). 큰 금액일수록 드묾 (파레토 분포).
  //   alpha가 클수록 큰 금액이 더 드묾. 시청자 적을 때 alphaLow ↔ 1,000명 이상 alphaHigh
  //   alpha 1.3 기준(평균 약 390원): 500원 이상 14%, 1,000원 이상 5%, 1만 원 이상 0.24%, 5만 원 이상 0.03%
  //   alpha 1.15 기준(평균 약 530원): 500원 이상 18%, 1,000원 이상 7.5%, 1만 원 이상 0.5%, 5만 원 이상 0.08%
  donationMin: 100,
  donationMax: 100000,
  donationAlphaLow: 1.3,
  donationAlphaHigh: 1.15,
  // 이 금액 이상 후원은 AI가 상황에 맞는 후원 메시지를 씀 (AI 켜져 있을 때)
  aiDonationMin: 5000,
  // 큰 장면 축하 후원: 이 화제성 이상일 때만, 확률은 최대 이 값
  eventDonationMinHype: 25,
  eventDonationMaxChance: 0.5,
  // 후원 중 억까 비율
  trollChance: 0.15,

  // 미션: 분당 등장 확률, 진행 중이 아닐 때만
  missionChancePerMin: 0.08,
  missionMinGapSec: 300,
  missionRewardMin: 300,
  // 시청자 사연(아이템 보내 달라는 요청): 분당 등장 확률, 제한 시간, 출하가 대비 배수
  requestChancePerMin: 0.06,
  requestSec: 1200,
  requestPriceMult: 1.5,
  requestRewardMax: 10000,
  // 요청 개수는 "목표 가치 ÷ 아이템 가격": 목표 가치 = base + 시청자 × 3 (최대 targetMax)
  requestTargetBase: 400,
  requestTargetMax: 5000,
  // 요청 대상 아이템 가격 범위 (출하가)
  requestValueMin: 10,
  requestValueMax: 1000,
  missionRewardMax: 5000,

  // 집(리스폰 지점)에서 이 거리 안이면 억까 금지
  homeSafeRadius: 24,

  // 일간 순위: 매일 자정(UTC+9, 한국·일본 시간)에 정산, 1·2·3등 보너스 = 그날 최고 시청자 × 배수
  rankUtcOffsetHours: 9,
  rankRewards: [10, 5, 2],
  rankRewardCaps: [20000, 10000, 5000], // 1·2·3등 보너스 최대

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
  idleChatMaxSec: 5,
  idleChatMinSec: 1.2,
  // AI 잡담 간격(초)
  aiIdleMaxSec: 90,
  aiIdleMinSec: 25,

  // 업적: 선릿 밸리(society) 업적 위주 + 마인크래프트 주요 업적만 반응. 위에서부터 처음 맞는 규칙 적용, 없으면 무시
  advancementRules: [
    { id: "society:main/money/obtain_prismatic_coin", hype: 150, subs: 20 },
    { id: "society:main/money/obtain_ancient_coin", hype: 80, subs: 10 },
    { id: "society:main/money/obtain_neptunium_coin", hype: 50, subs: 5 },
    { id: "society:main/money/obtain_sun", hype: 25, subs: 3 },
    { id: "society:main/obtain_prismatic_shard", hype: 40, subs: 5 },
    { prefix: "society:main/machines/", hype: 10, subs: 1 },
    { prefix: "society:main/materials/", hype: 8, subs: 1 },
    // 마인크래프트 주요 업적
    { id: "minecraft:end/kill_dragon", hype: 150, subs: 15 },
    { id: "minecraft:adventure/adventuring_time", hype: 60, subs: 5 },
    { id: "minecraft:nether/netherite_armor", hype: 60, subs: 5 },
    { id: "minecraft:adventure/kill_all_mobs", hype: 50, subs: 5 },
    { id: "minecraft:nether/create_full_beacon", hype: 40, subs: 4 },
    { id: "minecraft:nether/all_effects", hype: 40, subs: 4 },
    { id: "minecraft:end/elytra", hype: 40, subs: 4 },
    { id: "minecraft:end/respawn_dragon", hype: 40, subs: 3 },
    { id: "minecraft:story/enter_the_end", hype: 40, subs: 3 },
    { id: "minecraft:nether/summon_wither", hype: 30, subs: 2 },
    { id: "minecraft:adventure/hero_of_the_village", hype: 30, subs: 3 },
    { id: "minecraft:husbandry/balanced_diet", hype: 30, subs: 3 },
    { id: "minecraft:adventure/totem_of_undying", hype: 25, subs: 2 },
    { id: "minecraft:husbandry/bred_all_animals", hype: 25, subs: 2 },
    { id: "minecraft:husbandry/complete_catalogue", hype: 20, subs: 2 },
    { id: "minecraft:story/enter_the_nether", hype: 20, subs: 2 },
    { id: "minecraft:story/follow_ender_eye", hype: 20, subs: 2 },
    { id: "minecraft:nether/find_fortress", hype: 15, subs: 1 },
    { id: "minecraft:nether/find_bastion", hype: 15, subs: 1 },
    { id: "minecraft:story/cure_zombie_villager", hype: 15, subs: 1 },
  ],

  // 방송 채팅창: 보이는 줄 수, 줄이 사라지는 시간(초)
  chatLines: 8,
  chatLineLifeSec: 40,
};
