// priority: 8
// The Valley 방송: 시청자 규모에 따라 채팅창 분위기가 달라지게
//  ~99명   : 단골 위주, 잔잔
//  100명~  : 처음 온 사람·알고리즘 타고 온 사람, 시청자끼리 대꾸 조금
//  500명~  : 채팅 빨라짐, "채팅 왜 이렇게 빠름", 반응 도배(ㅋㅋㅋ 물결) 커짐, @답글
//  1000명~ : 처음 보는 닉네임이 대부분, 큰 반응 물결, 떡상 분위기
// 주의: 이 Rhino는 블록({ }) 안의 const를 오류로 처리함. let만.

const TV_CROWD = {
  tiers: [0, 100, 500, 1000],
  newNameShare: [0, 0.3, 0.55, 0.75], // 처음 보는 닉네임(자동 생성)이 채팅하는 비율
  crowdChance: [0, 0.08, 0.12, 0.18], // 평소 잡담 때 규모 전용 채팅이 끼어들 확률 (상황과 관련 없는 말이라 낮게)
  replyChance: [0.03, 0.06, 0.1, 0.14], // 다른 시청자 채팅에 @답글 달 확률
  extraLines: [0, 1, 2, 3], // 평소 잡담 한 번에 더 올라오는 줄 수 (최대)
};

global.TV_CROWD_LINES = [
  [],
  ["알고리즘 타고 왔어요", "처음 왔는데 뭐 하는 방송임?", "클립 보고 옴", "채팅 좀 빨라졌네", "선릿밸리 이거 재밌음?", "다들 어디서 옴?", "방장 오늘 떡상각", "시청자 {v}명 ㄷㄷ", "첫 채팅 ㅎㅇ", "구독 눌렀어요 ㅎㅎ"],
  ["채팅 왜 이렇게 빠름 ㅋㅋ", "{v}명 실화냐", "클립 누가 따줘", "방장 떡상 축하", "커뮤에서 보고 옴", "여기가 그 방송임?", "채팅 읽어주세요 제발", "채팅 하나도 안 읽음 ㅋㅋ", "다시보기로도 볼 듯", "채팅창 미쳤다 ㅋㅋㅋ", "오늘 사람 많네"],
  ["천 명 넘었다 ㄷㄷ", "역대급 방송", "오늘 레전드 찍네", "방장 출세했다 ㅋㅋ", "초창기부터 보던 사람 손", "나 시청자 10명일 때부터 봄", "숏츠에서 보고 옴", "채팅 따라가기 힘들다", "이 많은 사람 앞에서 이러기 있냐 ㅋㅋ", "오늘 무슨 날임?"],
];

global.TV_REPLY_LINES = ["ㄹㅇ", "ㅇㅈ", "그건 아니지 ㅋㅋ", "ㅋㅋㅋㅋ 공감", "님 뭔데 ㅋㅋ", "훈수 ㄴㄴ", "나도 그 생각함", "ㄴㄴ 아님", "ㅋㅋㅋ 정답", "말 되네", "이분 뭐야 ㅋㅋ"];

// 반응 물결 (큰 방송일수록 여러 명이 같은 반응을 도배)
global.TV_WAVE = ["ㅋㅋㅋㅋㅋㅋ", "ㅋㅋㅋㅋㅋㅋㅋㅋㅋ", "ㅋㅋㅋ", "ㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ", "ㄷㄷㄷ", "ㄷㄷㄷㄷㄷ", "와", "와아아", "?????", "??", "ㅋㅋㅋㅋㅋㅋㅋ 아"];

const TV_NICK_A = ["배고픈", "졸린", "행복한", "지나가던", "퇴근한", "새벽의", "방구석", "전설의", "귀여운", "말랑한", "수상한", "평범한", "프로", "초보", "만렙"];
const TV_NICK_B = ["감자", "고구마", "치즈", "고양이", "곰", "두부", "라면", "김밥", "망고", "콩", "토끼", "오리", "호떡", "새우", "귤", "참치", "만두", "떡", "보리", "광부", "농부", "어부", "슬라임", "크리퍼"];
const TV_NICK_C = ["", "", "", "러버", "중독", "장인", "왕", "덕후", "킹", "좋아", "123", "99", "짱", "팬", "1호", "02", "7"];
const TV_NICK_COLORS = ["#FF9AA2", "#FFB7B2", "#FFDAC1", "#E2F0CB", "#B5EAD7", "#C7CEEA", "#9AD0EC", "#F6C6EA", "#D4A5FF", "#A0E7E5", "#FBE7C6", "#B4F8C8", "#FFAEBC", "#CCCCCC"];

function tvCrowdTier(player) {
  let v = tvViewers(player);
  let t = 0;
  TV_CROWD.tiers.forEach((min, i) => {
    if (v >= min) t = i;
  });
  return t;
}

// 명단에서 원래 40명 말고 다른 시청자 (규모가 클수록 처음 보는 닉네임이 많음)
function tvCrowdViewer(player) {
  for (let i = 0; i < 6; i++) {
    let v = tvPresentViewer(player);
    if (global.TV_ROSTER.indexOf(v) >= 40) return v;
  }
  return tvPresentViewer(player);
}

// 평소 잡담 때 규모에 맞는 채팅 (tvSecond가 부름)
function tvCrowdTick(player) {
  let t = tvCrowdTier(player);
  let mem = tvMem(player);
  let now = tvNow();
  if (t > 0 && Math.random() < TV_CROWD.crowdChance[t]) {
    // 규모 전용 채팅: 이번 단계와 아래 단계 문구 섞어서
    let pool = [];
    for (let i = 1; i <= t; i++) pool = pool.concat(global.TV_CROWD_LINES[i]);
    let used = mem.usedLines || (mem.usedLines = {});
    let line = tvRand(pool);
    for (let k = 0; k < 6 && used[line]; k++) line = tvRand(pool);
    if (!used[line]) {
      used[line] = now;
      let v = tvCrowdViewer(player);
      mem.queue.push({ at: now + Math.random() * 3000, name: v.name, color: v.color, msg: tvFill(line, { v: tvFmt(tvViewers(player)), p: tvName(player) }) });
    }
  }
  if (Math.random() < TV_CROWD.replyChance[t]) tvReplyChat(player);
}

// 다른 시청자 채팅에 @답글
function tvReplyChat(player) {
  let mem = tvMem(player);
  let recent = mem.chat.slice(-6).filter((l) => l.name && l.name.indexOf("[") < 0 && l.msg.indexOf("@") < 0 && l.msg.length >= 5);
  if (!recent.length) return;
  let target = tvRand(recent);
  let v = tvPickViewer(player);
  if (v.name == target.name) return;
  mem.queue.push({ at: tvNow() + 800 + Math.random() * 2500, name: v.name, color: v.color, msg: `@${target.name} ${tvRand(global.TV_REPLY_LINES)}` });
}

// ───────────── 시청자 1,500명 명단 (각자 성격·말버릇) ─────────────
// 매번 같은 씨앗으로 만들어서 서버를 껐다 켜도 같은 사람이 같은 성격으로 나옴.
// 앞의 40명은 원래 있던 시청자(TV_VIEWERS), 나머지는 자동으로 만든 닉네임.

const TV_PERSONAS = {
  react: { name: "리액션러", talk: 1.6 },
  tease: { name: "장난꾸러기", talk: 1.3 },
  coach: { name: "훈수꾼", talk: 1.2 },
  ask: { name: "질문러", talk: 1.0 },
  cheer: { name: "응원러", talk: 0.9 },
  info: { name: "고인물", talk: 0.8 },
  calm: { name: "힐링러", talk: 0.7 },
  lurker: { name: "눈팅족", talk: 0.15 },
};
const TV_PERSONA_ORDER = ["react", "react", "tease", "tease", "coach", "coach", "ask", "cheer", "info", "calm", "lurker", "lurker", "lurker"];

// 성격별로 자기가 자주 하는 말 (평소 잡담 때)
global.TV_PERSONA_LINES = {
  react: ["ㅋㅋㅋㅋㅋ", "와", "ㄷㄷ", "미쳤다", "아 ㅋㅋㅋ", "오", "헐", "ㅋㅋㅋ", "이거지", "ㅇㅈ"],
  tease: ["방장 오늘도 노잼 ㅋㅋ", "실력 이슈 ㅋㅋ", "방장 길치임?", "오늘도 노숙각", "훈수 들어도 못함 ㅋㅋ", "방장 원래 이럼?", "이게 플레이냐 ㅋㅋ", "어제도 이러지 않았나 ㅋㅋ"],
  coach: ["물부터 주셈", "그거 팔면 손해임", "곡괭이 먼저 바꿔요", "퀘스트북 확인 좀", "인벤 정리 좀 ㅋㅋ", "상자 좀 만들어요 인벤 터지겠다"],
  ask: ["몇 일차예요?", "이거 무슨 모드팩임?", "다음엔 뭐 해요?", "오늘 몇 시까지 함?", "이거 혼자 하는 거예요?", "브금 뭐예요?", "방송 매일 함?"],
  cheer: ["방장 화이팅", "가보자고", "오늘 폼 좋다", "오늘 뭔가 될 것 같음", "오늘 방송 일찍 켰네"],
  info: ["비 오는 날 메기 나옴", "해골광산 깊이 가면 이리듐 나옴", "무지갯빛 파편 진짜 비쌈", "계절 지나면 작물 다 죽음", "출하는 아침에 정산됨", "슬라임 키우면 돈 됨", "낚시는 아침이 잘 됨"],
  calm: ["브금 좋다", "평화롭다", "틀어놓고 과제 중", "밥 먹으면서 보는 중", "퇴근하고 옴", "이런 방송 좋다", "오늘 하루 끝"],
  lurker: ["ㅎㅇ", "ㅎㅇㅎㅇ", "잘 보고 있어요", "ㅋㅋ"],
};

// 말버릇 (그 사람이 치는 채팅에 가끔 붙음)
const TV_QUIRKS = ["", "", "", "laugh", "laugh", "dots", "excl", "nospace", "q"];

function tvSeedRand(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function tvBuildRoster() {
  let rnd = tvSeedRand(20261114);
  let pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  let roster = [];
  let seen = {};
  let add = (name, color) => {
    if (seen[name]) return;
    seen[name] = 1;
    let type = pick(TV_PERSONA_ORDER);
    roster.push({
      name: name,
      color: color,
      type: type,
      quirk: pick(TV_QUIRKS),
      talk: TV_PERSONAS[type].talk * (0.5 + rnd()),
      donor: rnd() * rnd(), // 대부분 낮고 몇 명만 높음
    });
  };
  global.TV_VIEWERS.forEach((v) => add(v.name, v.color));
  let tries = 0;
  while (roster.length < 1500 && tries++ < 20000) {
    let r = rnd();
    let name = r < 0.4 ? pick(TV_NICK_A) + pick(TV_NICK_B) : r < 0.8 ? pick(TV_NICK_B) + pick(TV_NICK_C) : pick(TV_NICK_B) + pick(TV_NICK_B);
    if (rnd() < 0.25) name += Math.floor(rnd() * 100);
    add(name.slice(0, 10), pick(TV_NICK_COLORS));
  }
  return roster;
}

global.TV_ROSTER = tvBuildRoster();
global.TV_ROSTER_MAP = {};
global.TV_ROSTER.forEach((v) => (global.TV_ROSTER_MAP[v.name] = v));

function tvViewerByName(name) {
  return global.TV_ROSTER_MAP[name] || { name: name, color: "#CCCCCC", type: "react", quirk: "", talk: 1, donor: 0.1 };
}

// 스트리머마다 시청자 순서가 달라서 (같은 1,500명이어도) 방송마다 보는 사람이 다름
function tvAudienceOffset(player) {
  let s = String(player.uuid);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % global.TV_ROSTER.length;
}

// 지금 방송을 보고 있는 시청자 중 한 명 (말 많은 사람이 더 자주)
function tvPresentViewer(player) {
  let n = global.TV_ROSTER.length;
  let present = Math.max(40, Math.min(n, tvViewers(player)));
  let off = tvAudienceOffset(player);
  for (let i = 0; i < 12; i++) {
    let r = Math.floor(Math.random() * present);
    // 원래 40명은 항상 보는 중, 나머지는 시청자 수만큼
    let v = r < 40 ? global.TV_ROSTER[r] : global.TV_ROSTER[40 + ((off + r) % (n - 40))];
    if (Math.random() * 2.5 < v.talk) return v;
  }
  return global.TV_ROSTER[Math.floor(Math.random() * 40)];
}

// 말버릇 붙이기
function tvQuirk(name, msg) {
  let v = global.TV_ROSTER_MAP[name];
  if (!v || !v.quirk || Math.random() > 0.18 || msg.indexOf("@") == 0) return msg;
  let excited = /[ㅋㄷ!?]|와|미쳤|레전드|대박|컨|개쩐/.test(msg);
  if (v.quirk == "laugh" && msg.indexOf("ㅋ") < 0) return msg + " ㅋㅋㅋ";
  if (v.quirk == "dots") return excited ? msg : msg + "..";
  if (v.quirk == "excl" && !/[!?]$/.test(msg)) return msg + "!!";
  if (v.quirk == "nospace") return msg.replace(/ /g, "");
  if (v.quirk == "q" && !excited && msg.length > 3 && /요$|임$|음$/.test(msg)) return msg + "?";
  return msg;
}

// 성격대로 한마디 (평소 잡담 때 가끔)
function tvPersonaChat(player) {
  let v = tvPickViewer(player);
  let lines = global.TV_PERSONA_LINES[v.type] || global.TV_PERSONA_LINES.react;
  let mem = tvMem(player);
  let used = mem.usedLines || (mem.usedLines = {});
  let line = tvRand(lines);
  for (let k = 0; k < 5 && used[line]; k++) line = tvRand(lines);
  if (used[line] && v.type != "react") return false;
  used[line] = tvNow();
  mem.queue.push({ at: tvNow() + Math.random() * 2500, name: v.name, color: v.color, msg: tvFill(line, { p: tvName(player) }) });
  return true;
}

// AI에게 넘길 "지금 보는 시청자" 일부 (닉네임(성격))
function tvAiAudience(player, count) {
  let out = {};
  Object.keys(tvRegGet(player)).forEach((n) => (out[n] = tvViewerByName(n)));
  for (let i = 0; i < count * 3 && Object.keys(out).length < count; i++) {
    let v = tvPresentViewer(player);
    out[v.name] = v;
  }
  return Object.keys(out).slice(0, count).map((n) => `${n}(${TV_PERSONAS[out[n].type] ? TV_PERSONAS[out[n].type].name : "리액션러"})`);
}

// ───────────── 성격 × 상황 대사 ─────────────
// 성격대로 말하되 "지금 화면에서 일어나는 일"에 대해 말하게 (관련 없는 잡담 줄이기)
global.TV_PERSONA_SIT = {
  chopping: {
    coach: ["묘목 다시 심어요", "도끼 좋은 걸로 바꾸셈", "원목 판자로 바꿔 둬요", "나무 위쪽도 다 캐요 공중부양 남음"],
    ask: ["그 나무로 뭐 지어요?", "몇 개 캐는 거예요?", "집 짓는 거임?"],
    tease: ["나무가 뭔 죄임 ㅋㅋ", "숲 파괴범 등장", "환경단체 출동각"],
    info: ["숯 만들어 두면 편함"],
    cheer: ["오 많이 캤다", "나무 부자 ㅋㅋ"],
    calm: ["이런 노가다 보는 게 좋음", "평화롭다"],
  },
  mining: {
    coach: ["횃불 박으면서 가요", "곡괭이 바꿀 때 됐는데", "광석 보이면 주변도 캐요", "인벤 꽉 차기 전에 올라가요"],
    ask: ["철 나왔어요?", "몇 층까지 내려갈 거임?", "다이아 언제 나와요?"],
    tease: ["캐도 캐도 돌 ㅋㅋ", "다이아 없는 광질 실화냐", "광부 체험 중"],
    info: ["다이아는 더 깊게 가야 나옴", "용암 근처 조심 아이템 날아감"],
    cheer: ["제발 다이아 하나만", "오늘 뭐 나올 듯"],
    calm: ["광질 보고 있으면 잠 옴"],
  },
  harvest: {
    coach: ["바로 다시 심어요", "출하함에 넣는 거 잊지 마셈", "좋은 건 남겨서 요리해요"],
    ask: ["이번 수확 얼마 나와요?", "이거 출하하면 얼마예요?"],
    tease: ["농사 적성 찾았네 ㅋㅋ", "농부 다 됐네"],
    info: ["품질 좋은 건 더 비싸게 팔림", "계절 지나면 작물 죽음"],
    cheer: ["풍년이다", "부자 되자"],
    calm: ["평화롭다", "이 맛에 농사하지"],
  },
  planting: {
    coach: ["물 주는 거 잊지 마요", "그거 이번 계절 거 맞음?"],
    ask: ["뭐 심는 거예요?", "언제 다 자라요?"],
    tease: ["줄 삐뚤어졌는데 ㅋㅋ", "밭 모양 실화냐"],
    info: ["계절 바뀌면 작물 다 죽음", "스프링클러 있으면 편함"],
    cheer: ["잘 자라라"],
    calm: ["농사 방송 좋다"],
  },
  fishing: {
    coach: ["타이밍 잘 봐요", "미끼 쓰면 더 잘 잡힘", "통발도 놔 둬요"],
    ask: ["뭐 잡았어요?", "제일 비싼 물고기 뭐임?"],
    tease: ["멸치만 낚네 ㅋㅋ", "낚시 실력 실화냐"],
    info: ["비 오는 날 잘 잡힘", "시간대마다 나오는 물고기 다름"],
    cheer: ["대물 가즈아", "다음엔 큰 거"],
    calm: ["낚시 보면 시간 순삭", "물소리 좋다"],
  },
  night: {
    coach: ["집에 가요 밤이에요", "침대 쓰면 밤 넘김", "횃불 들고 다녀요"],
    ask: ["왜 밤에 나와 있어요?", "침대 있어요?"],
    tease: ["밤에 산책 간 큼 ㅋㅋ", "생존 감각 0"],
    info: ["밤엔 몹 스폰됨", "자면 밤 스킵 가능"],
    cheer: ["밤 버텨라", "살아서 돌아와요"],
    calm: ["밤하늘 이쁘다", "밤 분위기 좋다"],
  },
  low_hp: {
    coach: ["먹어 먹어 빨리", "일단 도망가요", "물약 있으면 마셔요"],
    ask: ["음식 있어요?", "괜찮아요?"],
    tease: ["피 관리 무엇 ㅋㅋ", "죽을 각 보인다"],
    info: ["배부르면 체력 차요"],
    cheer: ["버텨!!", "아 제발"],
  },
  hungry: {
    coach: ["밥부터 먹어요", "요리해서 먹으면 더 좋음"],
    ask: ["음식 있어요?"],
    tease: ["굶으면서 일하는 방장 ㅋㅋ"],
    info: ["배고프면 체력 안 참"],
  },
  mob: {
    coach: ["칼 들어요", "거리 두고 싸워요", "뒤로 빠지면서 쳐요"],
    tease: ["몹한테도 지겠는데 ㅋㅋ"],
    cheer: ["잡아!!", "ㄱㄱ"],
    info: ["방패 있으면 편함"],
  },
  creeper: {
    coach: ["뒤로 빠져요!!", "치고 빠지기 해요"],
    tease: ["펑 각 ㅋㅋㅋ", "집 날아가는 거 보고 싶다"],
    info: ["크리퍼는 고양이 무서워함"],
  },
  underground: {
    coach: ["올라갈 길 기억해요", "횃불 한쪽 벽에만 박으면 길 안 잃음", "용암 조심"],
    ask: ["여기 어디예요?", "몇 층이에요?"],
    tease: ["길 잃는 각 ㅋㅋ", "두더지 방장"],
    info: ["깊을수록 좋은 광석 나옴"],
    calm: ["동굴 분위기 좋다"],
  },
  skull: {
    coach: ["체력 관리 잘해요", "폭탄 아끼지 마요", "사다리 보이면 바로 내려가요"],
    ask: ["몇 층까지 가요?", "폭탄 있어요?"],
    tease: ["여기서 죽으면 손해 개큼 ㅋㅋ"],
    info: ["깊이 갈수록 비싼 광석 나옴"],
    cheer: ["오늘 신기록 각"],
  },
  rain: {
    coach: ["비 오는 날은 낚시 가요", "물 안 줘도 되나 확인해 봐요"],
    ask: ["비 오는데 뭐 해요?"],
    tease: ["비 맞는 방장 ㅋㅋ"],
    info: ["비 오는 날 물고기 잘 잡힘"],
    calm: ["빗소리 좋다", "비 오는 날 감성"],
  },
  building: {
    coach: ["창문 좀 내요", "지붕 모양 바꿔 봐요", "조명 달아요"],
    ask: ["뭐 짓는 거예요?", "집 크기 얼마예요?"],
    tease: ["두부집 ㄷㄷ", "이게 집이라고? ㅋㅋ"],
    cheer: ["벌써 이쁘다", "건축 감 좋다"],
    calm: ["집 이쁘게 나올 듯"],
  },
  still: {
    coach: ["퀘스트북 봐요 ㅋㅋ"],
    ask: ["뭐 고민해요?", "렉 걸림?"],
    tease: ["방장 멍때리는 중 ㅋㅋ", "화면 멈춘 줄"],
  },
};

// 성격대로 + 지금 상황에 맞게. 상황에 맞는 대사가 없으면 가끔만 일반 성격 대사
const tvPersonaGeneric = tvPersonaChat;
tvPersonaChat = function (player) {
  let v = tvPickViewer(player);
  let sits = tvSituations(player).filter((s) => global.TV_PERSONA_SIT[s.k] && global.TV_PERSONA_SIT[s.k][v.type]);
  let mem = tvMem(player);
  let used = mem.usedLines || (mem.usedLines = {});
  if (sits.length && Math.random() < 0.75) {
    let total = 0;
    sits.forEach((s) => (total += s.w));
    let r = Math.random() * total;
    let pick = sits[0];
    for (let i = 0; i < sits.length; i++) {
      r -= sits[i].w;
      if (r <= 0) {
        pick = sits[i];
        break;
      }
    }
    let lines = global.TV_PERSONA_SIT[pick.k][v.type];
    let line = tvRand(lines);
    for (let k = 0; k < 4 && used[line]; k++) line = tvRand(lines);
    if (!used[line]) {
      used[line] = tvNow();
      mem.queue.push({ at: tvNow() + Math.random() * 2500, name: v.name, color: v.color, msg: tvFill(line, Object.assign({ p: tvName(player) }, pick.v || {})) });
      return true;
    }
  }
  // 그 외엔 평소 잡담 (모든 대사를 화면에 맞추면 오히려 인위적. 단 고인물 정보는 상황 없이 하면 엉뚱해서 뺌)
  if (v.type != "info" && Math.random() < 0.6) {
    let gl = global.TV_PERSONA_LINES[v.type];
    let line = tvRand(gl);
    for (let k = 0; k < 4 && used[line]; k++) line = tvRand(gl);
    if (used[line] && v.type != "react") return false;
    used[line] = tvNow();
    mem.queue.push({ at: tvNow() + Math.random() * 2500, name: v.name, color: v.color, msg: tvFill(line, { p: tvName(player) }) });
    return true;
  }
  return false;
};
