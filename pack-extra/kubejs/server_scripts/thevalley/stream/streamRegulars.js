// priority: 8
// The Valley 방송: 단골 시청자와 방송 기억
// - 스트리머마다 단골 시청자가 있음 (처음엔 6명, 큰 후원을 한 시청자가 새 단골이 되기도 함)
// - 방송을 켜면 단골이 출석 인사, 채팅·후원도 단골이 자주 함
// - 큰 장면(보스 처치, 고강화, 파괴, 큰 후원 등)을 기억해 두고 나중에 단골이 "어제 ~한 거" 하고 꺼냄
// - 가장 많이 후원한 단골은 "큰손"
// 주의: 이 Rhino는 블록({ }) 안의 const를 오류로 처리함. 블록 안에서는 let만.

const TV_REG = {
  startCount: 6, // 처음 단골 수
  maxCount: 10, // 최대 단골 수
  chatShare: 0.35, // 시청자 채팅 중 단골이 치는 비율
  donateShare: 0.5, // 후원 중 단골이 하는 비율
  bigDonorShare: 0.6, // 1만원 이상 후원 중 큰손(후원 1·2위 단골)이 하는 비율
  newRegularMin: 5000, // 단골 아닌 시청자가 이 이상 후원하면 단골이 됨
  greetCount: [2, 4], // 방송 켤 때 인사하는 단골 수
  memoryMax: 15, // 기억해 두는 장면 수
  memoryChatChance: 0.08, // 평소 잡담 중 기억 꺼내는 비율
  memoryMinAgeMin: 20, // 이 시간(분)이 지난 장면만 꺼냄 (방금 일은 다른 채팅이 반응함)
};

global.TV_REG_TEMPLATES = {
  greet: ["출첵", "오늘도 왔어요", "{p}님 하이", "출석 ㅋㅋ", "기다렸다", "왔다 ㅎㅇ", "오늘 뭐 해요?", "{v}번째 출석 ㅋㅋ", "알림 보고 바로 옴", "자리 맡았다"],
  greet_big: ["큰손 {d}님 왔다 ㄷㄷ", "{d}님 오셨다 ㅋㅋ 지갑 준비", "큰손 입장", "{d}님 ㅎㅇ요"],
  memory: [
    "{ago} {mem} 진짜 레전드였음",
    "{ago} {mem} 다시보기로 봤어요 ㅋㅋ",
    "{mem} 또 해줘요",
    "아직도 {ago} {mem} 생각남 ㅋㅋ",
    "{ago} {mem} 클립 떴던데",
    "{ago} {mem} 실시간으로 봤음 ㅋㅋ",
    "{mem} 그거 진짜였냐",
  ],
  donate_regular: ["오늘도 응원해요", "단골 후원 ㅋㅋ", "오늘도 왔으니 후원", "출석 후원", "맨날 보는 중"],
  new_regular: ["앞으로 자주 올게요", "팬 됐어요", "구독 박고 감", "오늘부터 1일"],
};

function tvRegGet(player) {
  let pd = tvData(player);
  let regs = null;
  try {
    regs = JSON.parse(String(pd.tvRegulars || ""));
  } catch (err) {
    regs = null;
  }
  if (!regs || typeof regs != "object") {
    regs = {};
    let pool = global.TV_VIEWERS.slice();
    for (let i = 0; i < TV_REG.startCount && pool.length; i++) {
      let v = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      regs[v.name] = { v: 0, d: 0 };
    }
    pd.tvRegulars = JSON.stringify(regs);
  }
  return regs;
}

function tvRegSave(player, regs) {
  tvData(player).tvRegulars = JSON.stringify(regs);
}

function tvRegViewer(name) {
  let found = null;
  global.TV_VIEWERS.forEach((v) => {
    if (v.name == name) found = v;
  });
  return found || { name: name, color: "#CCCCCC" };
}

// 큰손: 단골 중 후원 많이 한 순서 (후원한 적 있는 사람만)
function tvRegBigDonors(player, n) {
  let regs = tvRegGet(player);
  return Object.keys(regs)
    .filter((k) => regs[k].d > 0)
    .sort((a, b) => regs[b].d - regs[a].d)
    .slice(0, n || 2);
}

// 채팅할 시청자 뽑기 (단골 우선)
function tvPickViewer(player) {
  if (Math.random() < TV_REG.chatShare) {
    let names = Object.keys(tvRegGet(player));
    if (names.length) return tvRegViewer(tvRand(names));
  }
  return tvRand(global.TV_VIEWERS);
}

// 후원할 시청자 뽑기
function tvPickDonor(player, amount) {
  if (amount >= 10000 && Math.random() < TV_REG.bigDonorShare) {
    let big = tvRegBigDonors(player, 2);
    if (big.length) return tvRegViewer(tvRand(big));
  }
  let names = Object.keys(tvRegGet(player));
  if (names.length && Math.random() < TV_REG.donateShare) return tvRegViewer(tvRand(names));
  return tvRand(global.TV_VIEWERS);
}

// 후원 기록. 단골이면 누적, 아니면 큰 후원일 때 새 단골. 단골이면 true
function tvRegDonated(player, name, amount) {
  let regs = tvRegGet(player);
  if (regs[name]) {
    regs[name].d = (Number(regs[name].d) || 0) + amount;
    tvRegSave(player, regs);
    return true;
  }
  if (amount < TV_REG.newRegularMin) return false;
  let names = Object.keys(regs);
  if (names.length >= TV_REG.maxCount) {
    // 가장 덜 온 단골 한 명이 빠짐
    names.sort((a, b) => regs[a].v + regs[a].d / 1000 - (regs[b].v + regs[b].d / 1000));
    delete regs[names[0]];
  }
  regs[name] = { v: 1, d: amount };
  tvRegSave(player, regs);
  let mem = tvMem(player);
  let v = tvRegViewer(name);
  mem.queue.push({ at: tvNow() + 2500, name: v.name, color: v.color, msg: tvRand(global.TV_REG_TEMPLATES.new_regular) });
  return false;
}

// 방송 시작: 단골 출석 인사
function tvRegGreet(player) {
  if (!tvIsOn(player)) return;
  let regs = tvRegGet(player);
  let names = Object.keys(regs);
  if (!names.length) return;
  let mem = tvMem(player);
  let n = TV_REG.greetCount[0] + Math.floor(Math.random() * (TV_REG.greetCount[1] - TV_REG.greetCount[0] + 1));
  let big = tvRegBigDonors(player, 1)[0];
  let delay = 1500;
  let shuffled = names.slice().sort(() => Math.random() - 0.5).slice(0, n);
  if (big && shuffled.indexOf(big) < 0 && Math.random() < 0.5) shuffled.push(big);
  shuffled.forEach((name) => {
    regs[name].v = (Number(regs[name].v) || 0) + 1;
    let v = tvRegViewer(name);
    delay += 1200 + Math.random() * 3000;
    mem.queue.push({ at: tvNow() + delay, name: v.name, color: v.color, msg: tvFill(tvRand(global.TV_REG_TEMPLATES.greet), { p: tvName(player), v: regs[name].v }) });
    if (name == big) {
      let other = tvPickViewer(player);
      if (other.name != big) {
        delay += 900;
        mem.queue.push({ at: tvNow() + delay, name: other.name, color: other.color, msg: tvFill(tvRand(global.TV_REG_TEMPLATES.greet_big), { d: big }) });
      }
    }
  });
  tvRegSave(player, regs);
}

// ───────────── 방송 기억 ─────────────
// text는 "~한 거" 꼴 (예: "+12 강화 성공한 거")

function tvRemember(player, text) {
  let pd = tvData(player);
  let list = [];
  try {
    list = JSON.parse(String(pd.tvMemories || "[]"));
  } catch (err) {
    list = [];
  }
  if (!Array.isArray(list)) list = [];
  list = list.filter((m) => m.t != text);
  list.push({ t: String(text), at: Date.now() });
  if (list.length > TV_REG.memoryMax) list = list.slice(-TV_REG.memoryMax);
  pd.tvMemories = JSON.stringify(list);
}

function tvMemories(player) {
  try {
    let list = JSON.parse(String(tvData(player).tvMemories || "[]"));
    return Array.isArray(list) ? list : [];
  } catch (err) {
    return [];
  }
}

function tvAgo(at) {
  let min = (Date.now() - Number(at)) / 60000;
  if (min < 120) return "아까";
  if (min < 60 * 30) return "어제";
  if (min < 60 * 24 * 7) return "며칠 전에";
  return "예전에";
}

// 단골이 예전 장면을 꺼냄. 꺼낼 게 없으면 false
function tvRegMemoryChat(player) {
  let old = tvMemories(player).filter((m) => Date.now() - Number(m.at) > TV_REG.memoryMinAgeMin * 60000);
  let names = Object.keys(tvRegGet(player));
  if (!old.length || !names.length) return false;
  let m = tvRand(old);
  let v = tvRegViewer(tvRand(names));
  let msg = tvFill(tvRand(global.TV_REG_TEMPLATES.memory), { ago: tvAgo(m.at), mem: m.t }).replace(/^\s+/, "");
  tvMem(player).queue.push({ at: tvNow() + Math.random() * 2000, name: v.name, color: v.color, msg: msg.slice(0, 40) });
  return true;
}

// AI에게 넘길 단골·기억 요약
function tvRegAiContext(player) {
  let regs = tvRegGet(player);
  let names = Object.keys(regs);
  let big = tvRegBigDonors(player, 2);
  let lines = [];
  if (names.length) lines.push(`단골 시청자: ${names.join(", ")}${big.length ? ` (큰손: ${big.join(", ")})` : ""}`);
  let mems = tvMemories(player).slice(-5);
  if (mems.length) lines.push(`지난 방송 명장면: ${mems.map((m) => `${tvAgo(m.at)} ${m.t}`).join(" / ")}`);
  return lines.join("\n");
}
