// priority: 6
// The Valley 방송: 합방 모드
//  - 다른 플레이어(친구)가 근처에 오면 "합방"이 됨 → 시청자 조금 늘고 채팅이 둘을 비교·놀림
//  - 놀림은 오늘 실제 기록(사망·낚시·수확·광질·벌목·사냥·해골광산 깊이·통장)을 바탕으로 함
//  - 기록은 서버가 켜진 뒤부터 센다 (서버가 매일 껐다 켜지니 "오늘 기록")
// 주의: 이 Rhino는 블록({ }) 안의 const를 오류로 처리함. let만.

const TV_COLLAB = {
  range: 40, // 이 거리(블록) 안에 있으면 합방
  arriveHype: 8, // 합방 시작할 때 시청자 증가
  rejoinMin: 10, // 이 시간(분) 이상 떨어져 있다 다시 만나야 "등장" 반응
  chatChance: 0.15, // 합방 중 평소 잡담 때 합방 채팅을 할 확률
  factCooldownMin: 6, // 같은 기록 얘기는 이 시간(분)에 한 번
};

// 오늘 기록 (이름 → 기록). 서버를 껐다 켜면 초기화
global.TV_COLLAB_STAT = global.TV_COLLAB_STAT || {};

function tvCoStat(p) {
  let n = String(p.username);
  let s = global.TV_COLLAB_STAT[n];
  if (!s) {
    s = { deaths: 0, fish: 0, crops: 0, ores: 0, logs: 0, kills: 0, skull: 0 };
    global.TV_COLLAB_STAT[n] = s;
  }
  return s;
}

// 시청자가 부르는 이름: "Jungin_" → "Jungin님"
function tvCoCall(p) {
  return String(p.username).replace(/_+$/, "") + "님";
}

function tvCoPartner(player) {
  let best = null;
  let bestD = TV_COLLAB.range * TV_COLLAB.range;
  try {
    player.server.players.forEach((o) => {
      if (o == player || String(o.username) == String(player.username)) return;
      if (o.isFake && o.isFake()) return;
      if (String(o.level.dimension) != String(player.level.dimension)) return;
      let dx = o.x - player.x, dy = o.y - player.y, dz = o.z - player.z;
      let d = dx * dx + dy * dy + dz * dz;
      if (d < bestD) {
        bestD = d;
        best = o;
      }
    });
  } catch (err) {
    return null;
  }
  return best;
}

function tvCoBalance(p) {
  try {
    let acc = global.getPersonalOrCurioAccount(p.level, p);
    return acc ? Number(acc.getBalance()) : NaN;
  } catch (err) {
    return NaN;
  }
}

// ───────────── 기록 세기 (방송을 켰든 안 켰든 셈) ─────────────
BlockEvents.broken((e) => {
  let p = e.player;
  if (!p || p.isFake()) return;
  let id = String(e.block.id);
  let short = id.split(":")[1] || id;
  let s = tvCoStat(p);
  let isLog = false, isCrop = false;
  try {
    isLog = e.block.hasTag("minecraft:logs");
    isCrop = e.block.hasTag("minecraft:crops");
  } catch (err) {
    // 태그 확인 실패
  }
  if (isLog) s.logs++;
  else if (isCrop || /crop|wheat|carrot|potato|beetroot|melon|pumpkin|berry|grape|tomato|rice/.test(short)) s.crops++;
  else if (id.indexOf("_ore") >= 0 || id == "minecraft:ancient_debris") s.ores++;
});

EntityEvents.death((e) => {
  let ent = e.entity;
  if (ent.isPlayer()) {
    if (ent.isFake && ent.isFake()) return;
    tvCoStat(ent).deaths++;
    return;
  }
  let p = e.source ? e.source.player : null;
  if (!p || !p.isPlayer() || p.isFake()) return;
  let hostile = false;
  try {
    hostile = !!ent.isMonster();
  } catch (err) {
    hostile = false;
  }
  if (hostile) tvCoStat(p).kills++;
});

let tvCoFishOrig = global.tvOnFished;
global.tvOnFished = (player, itemIds) => {
  try {
    if (player && !player.isFake()) tvCoStat(player).fish += itemIds.length;
  } catch (err) {
    // 기록 실패해도 방송 반응은 그대로
  }
  if (tvCoFishOrig) tvCoFishOrig(player, itemIds);
};

// 5초마다: 해골 광산 오늘 최고 깊이, 합방 시작 확인
PlayerEvents.tick((e) => {
  let p = e.player;
  if (p.age % 100 != 0 || p.isFake()) return;
  if (String(p.level.dimension) == "society:skull_cavern") {
    let depth = Math.max(0, Math.floor((511 - p.y) / 16));
    let s = tvCoStat(p);
    if (depth > s.skull) s.skull = depth;
  }
  if (typeof tvIsOn != "function" || !tvIsOn(p)) return;
  let partner = tvCoPartner(p);
  let mem = tvMem(p);
  let now = tvNow();
  if (partner) {
    let name = String(partner.username);
    let away = !mem.coLastSeen || mem.coLastName != name || now - mem.coLastSeen > TV_COLLAB.rejoinMin * 60000;
    mem.coLastSeen = now;
    mem.coLastName = name;
    if (away) tvCoArrive(p, partner);
  }
});

global.TV_COLLAB_LINES = {
  arrive: ["{B} 등장 ㄷㄷ", "합방이다!!", "{B} ㅎㅇ", "오 {B} 왔다", "합방각 ㅋㅋ", "{B} 반가워요", "둘이 같이 하는 거임?"],
  talk: ["둘이 케미 좋다", "{B}이랑 뭐 해요?", "합방 좋다", "{B} 방송도 켜요?", "둘이 싸우면 누가 이김?", "방장 {B} 따라다니는 중 ㅋㅋ", "둘이 역할 분담 ㄱㄱ",
    "{B} 오늘 폼 어때요?", "둘이 내기해요 ㅋㅋ", "{B}한테 훈수 받아요 ㅋㅋ", "{B} 채팅도 봐요?", "합방하니까 재밌네", "둘이 같이 하니까 든든하다", "{B} 지금 뭐 하는 거임?"],
};

// 기록 비교 문구. me = 방장이 이 기록에서 더 나쁨(놀림), you = 같이 하는 사람이 더 나쁨
const TV_CO_FACT = {
  deaths: {
    me: ["방장 오늘 {a}번 죽음 ㅋㅋ {B}은 {b}번", "사망 {a} 대 {b} ㅋㅋㅋ", "같이 하는데 왜 방장만 죽음 ㅋㅋ", "{B}은 멀쩡한데 방장 {a}번째 사망 ㅋㅋ"],
    you: ["{B} 오늘 {b}번 죽음 ㅋㅋ", "방장이 그나마 낫네 사망 {a} 대 {b} ㅋㅋ", "{B} 오늘 억까 당하는 중 ㅋㅋ", "{B} {b}번 죽은 거 실화냐"],
  },
  fish: { what: "낚시는", unit: "마리" },
  crops: { what: "수확은", unit: "개" },
  ores: { what: "광석은", unit: "개" },
  logs: { what: "벌목은", unit: "개" },
  kills: { what: "사냥은", unit: "마리" },
  skull: {
    me: ["해골광산 {B}은 {b}구간 방장은 {a}구간 ㅋㅋ", "깊이는 {B}이 이김 {b} 대 {a}", "방장 해골광산 {B}한테 밀림 ㅋㅋ"],
    you: ["해골광산은 방장이 더 깊이 감 {a} 대 {b}", "{B} {b}구간밖에 못 감 ㅋㅋ", "깊이는 방장 압승 ㅋㅋ"],
  },
  money: {
    me: ["{B}이 돈 더 많음 ㅋㅋ", "통장 차이 실화냐 ㅋㅋ", "{B}한테 돈 빌려요 ㅋㅋ", "방장 {B}보다 가난함 ㅋㅋ"],
    you: ["방장이 더 부자네", "{B} 통장 텅텅 ㅋㅋ", "{B} 돈 좀 빌려줘요 방장 ㅋㅋ"],
  },
};
const TV_CO_GENERIC = {
  me: ["{what} {B}이 더 잘하네 ㅋㅋ {b}{unit} 대 {a}{unit}", "{B} {b}{unit} 방장 {a}{unit} ㅋㅋ", "{what} 방장이 {B}한테 밀림 ㅋㅋ", "{what} {B} 압승 ㅋㅋ"],
  you: ["{what} 방장 압승 ㅋㅋ {a} 대 {b}", "{B} {b}{unit}밖에 안 됨 ㅋㅋ", "오늘 {what} 방장이 이김", "{what} 방장이 더 잘함 {a} 대 {b}"],
};

function tvCoArrive(player, partner) {
  let mem = tvMem(player);
  if (!mem.coArriveAt || tvNow() - mem.coArriveAt > 30 * 60000) {
    mem.coArriveAt = tvNow();
    tvChange(player, TV_COLLAB.arriveHype, 0, `${tvName(partner)}님과 합방`);
  }
  let B = tvCoCall(partner);
  let lines = global.TV_COLLAB_LINES.arrive;
  let n = 2 + tvCrowdTier(player);
  let used = {};
  for (let i = 0; i < n; i++) {
    let l = tvRand(lines);
    for (let k = 0; k < 4 && used[l]; k++) l = tvRand(lines);
    used[l] = 1;
    let v = tvPickViewer(player);
    mem.queue.push({ at: tvNow() + 500 + Math.random() * 4000, name: v.name, color: v.color, msg: tvFill(l, { B: B }) });
  }
}

// 지금 말할 만한 기록 차이들
function tvCoFacts(player, partner) {
  let a = tvCoStat(player), b = tvCoStat(partner);
  let out = [];
  if (a.deaths + b.deaths >= 2 && Math.abs(a.deaths - b.deaths) >= 2) out.push({ k: "deaths", a: a.deaths, b: b.deaths, meWorse: a.deaths > b.deaths });
  ["fish", "crops", "ores", "logs", "kills"].forEach((k) => {
    let hi = Math.max(a[k], b[k]), lo = Math.min(a[k], b[k]);
    if (hi >= 5 && hi >= lo * 2 + 2) out.push({ k: k, a: a[k], b: b[k], meWorse: a[k] < b[k] });
  });
  if (Math.max(a.skull, b.skull) >= 3 && Math.abs(a.skull - b.skull) >= 3) out.push({ k: "skull", a: a.skull, b: b.skull, meWorse: a.skull < b.skull });
  let ma = tvCoBalance(player), mb = tvCoBalance(partner);
  if (!isNaN(ma) && !isNaN(mb) && Math.max(ma, mb) >= 1000 && Math.max(ma, mb) >= Math.min(ma, mb) * 2) out.push({ k: "money", a: ma, b: mb, meWorse: ma < mb });
  return out;
}

// 합방 중 잡담 (stream.js 평소 잡담이 부름). 했으면 true
function tvCollabChat(player) {
  let partner = tvCoPartner(player);
  if (!partner || Math.random() >= TV_COLLAB.chatChance) return false;
  let mem = tvMem(player);
  let now = tvNow();
  let last = mem.coFactAt || (mem.coFactAt = {});
  let facts = tvCoFacts(player, partner).filter((f) => !last[f.k] || now - last[f.k] > (f.k == "money" ? 20 : TV_COLLAB.factCooldownMin) * 60000);
  let B = tvCoCall(partner);
  let line;
  if (facts.length && Math.random() < 0.75) {
    let f = tvRand(facts);
    last[f.k] = now;
    let def = TV_CO_FACT[f.k];
    let pool = def.me ? def[f.meWorse ? "me" : "you"] : TV_CO_GENERIC[f.meWorse ? "me" : "you"];
    line = tvFill(tvRand(pool), { B: B, a: f.a, b: f.b, what: def.what || "", unit: def.unit || "" });
  } else {
    if (Math.random() < 0.5) return false;
    // 합방 잡담은 15분 안에 같은 말 안 함
    let used = mem.coUsed || (mem.coUsed = {});
    let pool = global.TV_COLLAB_LINES.talk.filter((l) => !used[l] || now - used[l] > 900000);
    if (!pool.length) return false;
    let l = tvRand(pool);
    used[l] = now;
    line = tvFill(l, { B: B });
  }
  let v = tvPickViewer(player);
  mem.queue.push({ at: now + Math.random() * 2500, name: v.name, color: v.color, msg: line });
  // 놀림엔 가끔 맞장구
  if (/ㅋ/.test(line) && Math.random() < 0.4) {
    let w = tvPickViewer(player);
    mem.queue.push({ at: now + 1500 + Math.random() * 2500, name: w.name, color: w.color, msg: tvRand(["ㅋㅋㅋㅋ", "ㄹㅇㅋㅋ", "팩트 ㅋㅋ", "ㅇㅈ ㅋㅋㅋ", "아 ㅋㅋ 팩폭"]) });
  }
  return true;
}

// AI에게 넘길 합방 정보
function tvCollabAiContext(player) {
  let partner = tvCoPartner(player);
  if (!partner) return "";
  let a = tvCoStat(player), b = tvCoStat(partner);
  let f = (k) => `${a[k]}/${b[k]}`;
  return `합방 중: ${tvName(partner)} (시청자는 "${tvCoCall(partner)}"이라고 부름). 오늘 기록 방장/${tvName(partner)}: 사망 ${f("deaths")}, 낚시 ${f("fish")}, 수확 ${f("crops")}, 광석 ${f("ores")}, 벌목 ${f("logs")}, 사냥 ${f("kills")}, 해골광산 ${f("skull")}구간. 놀릴 땐 이 기록만 근거로.`;
}
