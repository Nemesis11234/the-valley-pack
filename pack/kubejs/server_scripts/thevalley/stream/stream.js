// priority: 10
// The Valley 방송 시스템 (1단계: 템플릿 채팅)
// priority 10: chatColors.js가 채팅을 취소하기 전에 반응하려고 먼저 불러옴
// 구독자 × 화제성 = 시청자. 모든 변동은 이유와 함께 표시된다.
// 상태는 player.persistentData(tv*)에 저장, 화면 채팅·대기열은 메모리에만.

console.info("[TheValley] stream.js loaded");

const TV = global.TV_CONFIG;
const TV_ACTIVE = {}; // uuid -> 메모리 상태
const TV_TICKS_PER_SEC = 20;

// ───────────── 기본 유틸 ─────────────

function tvNow() {
  return Date.now();
}
function tvRand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function tvFmt(n) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function tvJson(obj) {
  return JSON.stringify(obj);
}
function tvName(player) {
  return String(player.username);
}
function tvDay(server) {
  return Math.floor(Number(server.overworld().getDayTime()) / 24000);
}
function tvFill(text, vars) {
  let out = String(text);
  Object.keys(vars || {}).forEach((k) => {
    out = out.split("{" + k + "}").join(String(vars[k]));
  });
  return out;
}

function tvMem(player) {
  let id = String(player.uuid);
  if (!TV_ACTIVE[id]) {
    TV_ACTIVE[id] = {
      lastActive: tvNow(),
      lastYaw: 0,
      lastPitch: 0,
      chat: [], // {t, name, color, msg}
      queue: [], // {at, line}
      changes: [], // 최근 변동 기록
      lastBalance: null,
      organicAcc: 0,
      mission: null,
      lastMissionEnd: 0,
      lastIdleChat: tvNow(),
      afkAnnounced: false,
      lastViewers: -1,
    };
  }
  return TV_ACTIVE[id];
}

// ───────────── 저장 상태 ─────────────

function tvData(player) {
  let pd = player.persistentData;
  if (pd.tvInit != 1) {
    pd.tvInit = 1;
    pd.tvOn = TV.defaultOn ? 1 : 0;
    pd.tvChatOn = 1;
    pd.tvSubs = TV.startSubs;
    pd.tvHype = 0;
    pd.tvPending = 0;
    pd.tvDonatedTotal = 0;
    pd.tvSkullBest = 0;
    pd.tvFirsts = "{}";
    pd.tvDaily = "{}";
    pd.tvDailyDay = -1;
  }
  return pd;
}
function tvIsOn(player) {
  return Number(tvData(player).tvOn) == 1;
}
function tvSubs(player) {
  return Number(tvData(player).tvSubs) || 0;
}
function tvHype(player) {
  return Number(tvData(player).tvHype) || 0;
}
function tvViewers(player) {
  return Math.round(tvSubs(player) * (1 + tvHype(player) / 100));
}
function tvTier(player) {
  let subs = tvSubs(player);
  let tier = TV.tiers[0];
  TV.tiers.forEach((t) => {
    if (subs >= t.minSubs) tier = t;
  });
  return tier;
}
function tvGetObj(player, key) {
  try {
    return JSON.parse(String(tvData(player)[key] || "{}"));
  } catch (e) {
    return {};
  }
}
function tvSetObj(player, key, obj) {
  tvData(player)[key] = tvJson(obj);
}

// 처음이면 true를 돌려주고 기록
function tvFirst(player, key) {
  let firsts = tvGetObj(player, "tvFirsts");
  if (firsts[key]) return false;
  firsts[key] = 1;
  tvSetObj(player, "tvFirsts", firsts);
  return true;
}

// 같은 행동 반복 시 효과 감소 (아침마다 초기화): 1, 1/2, 1/3 ...
function tvDaily(player, key) {
  let pd = tvData(player);
  let day = tvDay(player.server);
  let daily = tvGetObj(player, "tvDaily");
  if (Number(pd.tvDailyDay) != day) {
    daily = {};
    pd.tvDailyDay = day;
  }
  daily[key] = (daily[key] || 0) + 1;
  tvSetObj(player, "tvDaily", daily);
  return 1 / daily[key];
}

// ───────────── 화면 표시 ─────────────

// 화면 글자는 § 색 코드만 쓸 수 있어서 가장 가까운 색으로 바꿈
const TV_MC_COLORS = [
  ["0", 0, 0, 0], ["1", 0, 0, 170], ["2", 0, 170, 0], ["3", 0, 170, 170],
  ["4", 170, 0, 0], ["5", 170, 0, 170], ["6", 255, 170, 0], ["7", 170, 170, 170],
  ["8", 85, 85, 85], ["9", 85, 85, 255], ["a", 85, 255, 85], ["b", 85, 255, 255],
  ["c", 255, 85, 85], ["d", 255, 85, 255], ["e", 255, 255, 85], ["f", 255, 255, 255],
];
function tvMcCode(hex) {
  let h = String(hex || "#FFFFFF").replace("#", "");
  let r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
  let best = "f", bestD = 1e9;
  TV_MC_COLORS.forEach((c) => {
    if (c[0] == "0" || c[0] == "1" || c[0] == "8") return; // 너무 어두운 색 제외
    let d = (c[1] - r) * (c[1] - r) + (c[2] - g) * (c[2] - g) + (c[3] - b) * (c[3] - b);
    if (d < bestD) { bestD = d; best = c[0]; }
  });
  return "§" + best;
}

function tvActionbar(player, text, color) {
  player.server.runCommandSilent(
    `title ${tvName(player)} actionbar ${tvJson({ text: text, color: color || "#F2C14E" })}`
  );
}

function tvRenderChat(player) {
  let mem = tvMem(player);
  let now = tvNow();
  mem.chat = mem.chat.filter((l) => now - l.t < TV.chatLineLifeSec * 1000).slice(-TV.chatLines);
  let show = Number(tvData(player).tvChatOn) == 1 && tvIsOn(player);
  let paint = {};
  for (let i = 0; i < TV.chatLines; i++) {
    let line = show ? mem.chat[mem.chat.length - TV.chatLines + i] : null;
    let y = -36 + i * 11;
    let id = `tvChat${i}`;
    if (line) {
      let body = `${tvMcCode(line.color)}${line.name}§f: ${line.gold ? "§e" : ""}${line.msg}`;
      paint[id + "Shadow"] = { type: "text", x: 6, z: -1, y: y + 1, text: line.name + ": " + line.msg, color: "#000000", alignX: "left", alignY: "center" };
      paint[id] = { type: "text", x: 5, y: y, text: body, color: "#FFFFFF", alignX: "left", alignY: "center" };
    } else {
      paint[id + "Shadow"] = { type: "text", x: 6, z: -1, y: y + 1, text: "", alignX: "left", alignY: "center" };
      paint[id] = { type: "text", x: 5, y: y, text: "", alignX: "left", alignY: "center" };
    }
  }
  let title = show ? `● LIVE  시청자 ${tvFmt(tvViewers(player))}` : "";
  paint.tvChatTitleShadow = { type: "text", x: 6, z: -1, y: -49, text: title, color: "#000000", alignX: "left", alignY: "center" };
  paint.tvChatTitle = { type: "text", x: 5, y: -50, text: title, color: "#FF5555", alignX: "left", alignY: "center" };
  player.paint(paint);
}

function tvPushChat(player, name, color, msg, gold) {
  let mem = tvMem(player);
  mem.chat.push({ t: tvNow(), name: name, color: color, msg: msg, gold: !!gold });
  tvRenderChat(player);
}

// 시청자 채팅 n줄을 0~spread초에 걸쳐 흘려보냄
function tvViewerChat(player, category, vars, count, spreadSec) {
  if (!tvIsOn(player)) return;
  let lines = global.TV_TEMPLATES[category];
  if (!lines) return;
  let mem = tvMem(player);
  let n = count || 2 + Math.floor(Math.random() * 3);
  let used = {};
  for (let i = 0; i < n; i++) {
    let line = tvRand(lines);
    let tries = 0;
    while (used[line] && tries++ < 5) line = tvRand(lines);
    used[line] = 1;
    let viewer = tvRand(global.TV_VIEWERS);
    let delay = Math.random() * (spreadSec || 6) * 1000;
    mem.queue.push({ at: tvNow() + delay, name: viewer.name, color: viewer.color, msg: tvFill(line, vars) });
  }
}

function tvUpdateSidebar(server) {
  server.runCommandSilent(
    `scoreboard objectives add tv_viewers dummy ${tvJson({ text: "시청자 순위", color: "#FF5555" })}`
  );
  server.runCommandSilent("scoreboard objectives setdisplay sidebar tv_viewers");
  server.runCommandSilent(`team add tv_afk ${tvJson({ text: "잠수" })}`);
  server.runCommandSilent(`team modify tv_afk prefix ${tvJson({ text: "[잠수] ", color: "gray" })}`);
}

function tvSetSidebarScore(player) {
  let server = player.server;
  if (tvIsOn(player)) {
    server.runCommandSilent(`scoreboard players set ${tvName(player)} tv_viewers ${tvViewers(player)}`);
  } else {
    server.runCommandSilent(`scoreboard players reset ${tvName(player)} tv_viewers`);
  }
}

// ───────────── 시청자 변동 ─────────────

// hypeDelta: 화제성 점수, subsDelta: 구독자, reason: 화면에 보일 이유
function tvChange(player, hypeDelta, subsDelta, reason) {
  if (!tvIsOn(player)) return;
  let pd = tvData(player);
  let before = tvViewers(player);
  pd.tvHype = Math.max(0, tvHype(player) + hypeDelta);
  if (subsDelta) pd.tvSubs = Math.max(TV.startSubs, tvSubs(player) + subsDelta);
  let after = tvViewers(player);
  let diff = after - before;
  let mem = tvMem(player);
  mem.changes.push({ t: tvNow(), diff: diff, subs: subsDelta || 0, reason: reason });
  if (mem.changes.length > 12) mem.changes.shift();
  if (diff != 0 || subsDelta) {
    let sign = diff >= 0 ? "+" : "";
    let subsText = subsDelta ? `  (구독자 ${subsDelta > 0 ? "+" : ""}${subsDelta})` : "";
    tvActionbar(player, `${sign}${tvFmt(diff)} 시청자 · ${reason}${subsText}`, diff >= 0 ? "#7EE0A1" : "#F28B82");
  }
  tvSessionNote(player, diff, reason);
  tvCheckTrophies(player);
  tvSetSidebarScore(player);
  tvRenderChat(player);
}

function tvMarkActive(player) {
  let mem = tvMem(player);
  let wasAfk = tvNow() - mem.lastActive > TV.afkHardSec * 1000;
  mem.lastActive = tvNow();
  if (wasAfk) {
    player.server.runCommandSilent(`team leave ${tvName(player)}`);
    mem.afkAnnounced = false;
    tvViewerChat(player, "stream_back", {}, 2, 4);
  }
}

function tvAfkSec(player) {
  return (tvNow() - tvMem(player).lastActive) / 1000;
}

// 이벤트 반응 공통: 점수 + 채팅 + (큰 장면이면) 후원 확률
function tvEvent(player, hype, subs, reason, category, vars) {
  if (!tvIsOn(player)) return;
  tvMarkActive(player);
  tvChange(player, hype, subs, reason);
  // 큰 장면은 AI가 이어서 반응 (템플릿은 1줄만 먼저)
  let aiUsed = Math.abs(hype) >= 15 && global.tvAiRequest && global.tvAiRequest(player, "event", reason);
  if (category) tvViewerChat(player, category, vars || {}, aiUsed ? 1 : null, hype >= 50 ? 10 : 6);
  if (hype >= 20 && Math.random() < Math.min(0.8, hype / 100)) {
    player.server.scheduleInTicks(40 + Math.floor(Math.random() * 120), () => {
      if (player.isRemoved()) return;
      tvDonate(player, { reason: reason, mult: 1 + hype / 50 });
    });
  }
}

// ───────────── 후원 ─────────────

function tvRoundCoins(n) {
  // 코인 단위에 맞게 반올림 (8, 64, 512 ...)
  if (n < 64) return Math.max(TV.donationMin, Math.round(n / 8) * 8);
  if (n < 4096) return Math.round(n / 64) * 64;
  return Math.round(n / 512) * 512;
}

function tvDonate(player, opt) {
  if (!tvIsOn(player)) return;
  if (tvAfkSec(player) > TV.afkHardSec) return;
  let pd = tvData(player);
  let mem = tvMem(player);
  let viewer = tvRand(global.TV_VIEWERS);
  let base = Math.max(TV.donationMin, tvViewers(player) * TV.donationPerViewer);
  base *= (opt && opt.mult) || 1;
  base *= 0.4 + Math.random() * 1.2;
  if (Math.random() < TV.bigDonationChance) base *= TV.bigDonationMult;
  let amount = tvRoundCoins(base);

  let troll = !(opt && opt.reason) && Math.random() < TV.trollChance;
  pd.tvPending = Number(pd.tvPending) + amount;
  pd.tvDonatedTotal = Number(pd.tvDonatedTotal) + amount;
  tvSessionDonation(player, amount, viewer.name);

  let message;
  if (troll) {
    let done = tvTroll(player, viewer);
    message = done ? done : tvRand(global.TV_TEMPLATES.troll_skip);
  } else if (opt && opt.reason) {
    message = tvRand([`${opt.reason} 축하합니다!`, "이건 못참지", "보너스입니다", "레전드 기념"]);
  } else {
    message = tvRand(["화이팅!", "재밌게 보고 있어요", "커피값", "오늘도 힐링", "농사 화이팅", "구독했어요", "밥 사드세요"]);
  }

  tvPushChat(player, "[후원] " + viewer.name, viewer.color, `${tvFmt(amount)} 후원 · ${message}`, true);
  player.server.runCommandSilent(
    `execute as ${tvName(player)} at @s run playsound minecraft:block.note_block.bell player @s ~ ~ ~ 0.6 ${troll ? 0.6 : 1.4}`
  );
  if (amount >= 2048) {
    player.server.runCommandSilent(
      global.getEmbersTextAPICommand(
        tvName(player),
        `{anchor:"TOP_CENTER",background:1,align:"TOP_CENTER",color:"#FFD54F",offsetY:40}`,
        80,
        Text.of(`${viewer.name}님 ${tvFmt(amount)} 후원!`).toJson()
      )
    );
  }
  if (Math.random() < 0.4) tvViewerChat(player, troll ? "troll" : "donation_thanks", {}, 1, 4);
}

function tvSettleHint(player, full) {
  let pd = tvData(player);
  player.server.runCommandSilent(
    `tellraw ${tvName(player)} ${tvJson([
      { text: "[방송] ", color: "#FF5555" },
      { text: `미정산 후원금 ${tvFmt(pd.tvPending)} `, color: "#FFFFFF" },
      {
        text: "[정산하기]",
        color: "#FFD54F",
        bold: true,
        clickEvent: { action: "run_command", value: "/stream settle" },
        hoverEvent: { action: "show_text", contents: `수수료 ${Math.round(tvTier(player).fee * 100)}% 떼고 계좌로 입금` },
      },
    ])}`
  );
}

function tvSettle(player) {
  let pd = tvData(player);
  let pending = Number(pd.tvPending) || 0;
  if (pending <= 0) {
    player.tell(Text.of("[방송] 정산할 후원금이 없어요.").gray());
    return 0;
  }
  let tier = tvTier(player);
  let fee = Math.round(pending * tier.fee);
  let net = pending - fee;
  let account;
  try {
    account = global.getPersonalOrCurioAccount(player.level, player);
  } catch (e) {
    account = null;
  }
  if (!account) {
    player.tell(Text.of("[방송] 은행 계좌를 찾지 못했어요. 은행원 주민에게 계좌를 만든 뒤 다시 시도해 주세요.").red());
    return 0;
  }
  account.setBalance(Number(account.getBalance()) + net);
  pd.tvPending = 0;
  let mem = tvMem(player);
  if (mem.lastBalance != null) mem.lastBalance += net; // 수입 감지에서 제외
  player.server.runCommandSilent(
    `tellraw ${tvName(player)} ${tvJson([
      { text: "[방송] 정산 완료 ", color: "#FF5555" },
      { text: `후원 ${tvFmt(pending)} − 수수료 ${tvFmt(fee)}(${tier.name} ${Math.round(tier.fee * 100)}%) = `, color: "#FFFFFF" },
      { text: `${tvFmt(net)} 입금`, color: "#7EE0A1", bold: true },
    ])}`
  );
  player.server.runCommandSilent(`execute as ${tvName(player)} at @s run playsound minecraft:entity.player.levelup player @s ~ ~ ~ 0.5 1.2`);
  return 1;
}

// ───────────── 억까 ─────────────

function tvBossNearby(player) {
  let found = false;
  try {
    player.level.getEntitiesWithin(player.boundingBox.inflate(48)).forEach((e) => {
      if (!found && e.isLiving() && !e.isPlayer() && Number(e.maxHealth) >= 100) found = true;
    });
  } catch (err) {
    // 확인 실패하면 안전하게 보스 있음으로 처리
    found = true;
  }
  return found;
}

function tvTrollSafe(player) {
  if (player.isCreative() || player.isSpectator()) return false;
  let dim = String(player.level.dimension);
  if (dim != "minecraft:overworld") return false; // 해골 광산·네더 등은 제외
  if (player.health < player.maxHealth * 0.6) return false;
  if (player.isSleeping()) return false;
  let home = player.getRespawnPosition();
  if (home) {
    let dx = player.x - home.x, dz = player.z - home.z;
    if (Math.sqrt(dx * dx + dz * dz) < TV.homeSafeRadius) return false;
  }
  if (tvBossNearby(player)) return false;
  return true;
}

// 실행했으면 메시지, 못 했으면 null
function tvTroll(player, viewer) {
  if (!tvTrollSafe(player)) return null;
  let subs = tvSubs(player);
  let name = tvName(player);
  let s = player.server;
  let around = (mob, n) => {
    for (let i = 0; i < n; i++) {
      let a = Math.random() * Math.PI * 2;
      let r = 4 + Math.random() * 3;
      s.runCommandSilent(`execute at ${name} run summon ${mob} ~${(Math.cos(a) * r).toFixed(1)} ~ ~${(Math.sin(a) * r).toFixed(1)}`);
    }
  };
  let light = [
    () => { around("minecraft:chicken", 8); return "닭 선물입니다 ㅋㅋ"; },
    () => { s.runCommandSilent(`effect give ${name} minecraft:levitation 3 0`); return "날아라~"; },
    () => { s.runCommandSilent(`effect give ${name} minecraft:slowness 10 1`); return "천천히 가세요"; },
    () => { around("minecraft:zombie", 2); return "좀비 친구 보내드림"; },
    () => { s.runCommandSilent(`execute at ${name} run summon minecraft:firework_rocket ~ ~1 ~`); return "축하 폭죽!"; },
  ];
  let mid = [
    () => { around("minecraft:zombie", 3); around("minecraft:skeleton", 1); return "좀비 파티 ㅋㅋ"; },
    () => { around("minecraft:creeper", 1); return "크리퍼 선물입니다 ㅋㅋ"; },
    () => { around("minecraft:spider", 2); return "거미 2마리 배달"; },
    () => { s.runCommandSilent(`execute at ${name} run spreadplayers ~ ~ 0 30 false ${name}`); return "어디로 갈까~"; },
  ];
  let hard = [
    () => { around("minecraft:vindicator", 2); return "일리저 형님들 출동"; },
    () => { around("minecraft:witch", 1); around("minecraft:zombie", 3); return "마녀와 친구들"; },
    () => { around("minecraft:creeper", 2); return "크리퍼 2마리 ㅋㅋㅋ"; },
  ];
  let pool = light;
  if (subs >= 300) pool = light.concat(mid);
  if (subs >= 2000) pool = mid.concat(hard);
  return tvRand(pool)();
}

// ───────────── 미션 ─────────────

function tvBossbarId(player) {
  return "tv:m_" + tvName(player).toLowerCase();
}

function tvMissionStart(player) {
  let mem = tvMem(player);
  if (mem.mission || !tvIsOn(player)) return;
  if (String(player.level.dimension) != "minecraft:overworld" && Math.random() < 0.7) return;
  let viewer = tvRand(global.TV_VIEWERS);
  let types = ["kill", "mine", "fish"];
  if (String(player.level.dimension) == "minecraft:overworld") types.push("goto");
  let type = tvRand(types);
  let m;
  if (type == "goto") {
    let a = Math.random() * Math.PI * 2;
    let r = 80 + Math.random() * 100;
    let tx = Math.round(player.x + Math.cos(a) * r), tz = Math.round(player.z + Math.sin(a) * r);
    m = { type: type, tx: tx, tz: tz, goal: 1, sec: 180, text: `3분 안에 좌표 (${tx}, ${tz})까지 와라` };
  } else if (type == "kill") {
    let n = 5 + Math.floor(Math.random() * 6);
    m = { type: type, goal: n, sec: 300, text: `5분 안에 적대 몹 ${n}마리 잡기` };
  } else if (type == "mine") {
    let n = 16 + Math.floor(Math.random() * 17);
    m = { type: type, goal: n, sec: 180, text: `3분 안에 원목이나 광석 ${n}개 캐기` };
  } else {
    let n = 1 + Math.floor(Math.random() * 3);
    m = { type: type, goal: n, sec: 300, text: `5분 안에 물고기 ${n}마리 낚기` };
  }
  m.progress = 0;
  m.from = viewer.name;
  m.ends = tvNow() + m.sec * 1000;
  m.reward = tvRoundCoins(Math.max(64, tvViewers(player) * 3));
  mem.mission = m;

  let id = tvBossbarId(player);
  let s = player.server;
  s.runCommandSilent(`bossbar remove ${id}`);
  s.runCommandSilent(`bossbar add ${id} ${tvJson({ text: `[미션] ${m.text}  보상 ${tvFmt(m.reward)}`, color: "#FFD54F" })}`);
  s.runCommandSilent(`bossbar set ${id} color yellow`);
  s.runCommandSilent(`bossbar set ${id} max ${m.sec}`);
  s.runCommandSilent(`bossbar set ${id} value ${m.sec}`);
  s.runCommandSilent(`bossbar set ${id} players ${tvName(player)}`);
  tvPushChat(player, "[미션] " + viewer.name, viewer.color, `미션: ${m.text}! 성공하면 ${tvFmt(m.reward)}`, true);
  tvViewerChat(player, "mission_start", {}, 2, 5);
}

function tvMissionProgress(player, type, amount) {
  let m = tvMem(player).mission;
  if (!m || m.type != type) return;
  m.progress += amount || 1;
  if (m.progress >= m.goal) tvMissionEnd(player, true);
}

function tvMissionEnd(player, success) {
  let mem = tvMem(player);
  let m = mem.mission;
  if (!m) return;
  mem.mission = null;
  mem.lastMissionEnd = tvNow();
  player.server.runCommandSilent(`bossbar remove ${tvBossbarId(player)}`);
  if (success) {
    let pd = tvData(player);
    pd.tvPending = Number(pd.tvPending) + m.reward;
    pd.tvDonatedTotal = Number(pd.tvDonatedTotal) + m.reward;
    tvSessionDonation(player, m.reward, m.from);
    if (mem.session) mem.session.missions++;
    tvChange(player, 40, 2, "미션 성공");
    tvPushChat(player, "[후원] " + m.from, "#FFD54F", `미션 성공! ${tvFmt(m.reward)} 후원`, true);
    tvViewerChat(player, "mission_success", {}, 3, 5);
    player.server.runCommandSilent(`execute as ${tvName(player)} at @s run playsound minecraft:ui.toast.challenge_complete player @s ~ ~ ~ 0.6 1`);
  } else {
    tvChange(player, -20, 0, "미션 실패");
    tvViewerChat(player, "mission_fail", {}, 2, 5);
  }
}

function tvMissionTick(player) {
  let m = tvMem(player).mission;
  if (!m) return;
  let left = Math.max(0, Math.ceil((m.ends - tvNow()) / 1000));
  player.server.runCommandSilent(`bossbar set ${tvBossbarId(player)} value ${left}`);
  if (m.type == "goto") {
    let dx = player.x - m.tx, dz = player.z - m.tz;
    if (Math.sqrt(dx * dx + dz * dz) < 8) return tvMissionEnd(player, true);
  } else {
    player.server.runCommandSilent(
      `bossbar set ${tvBossbarId(player)} name ${tvJson({ text: `[미션] ${m.text} (${m.progress}/${m.goal})  보상 ${tvFmt(m.reward)}`, color: "#FFD54F" })}`
    );
  }
  if (left <= 0) tvMissionEnd(player, false);
}

// ───────────── 주기 처리 (플레이어마다 1초) ─────────────

function tvSecond(player) {
  let pd = tvData(player);
  let mem = tvMem(player);
  let on = tvIsOn(player);

  // 잠수 판정: 시점 회전만 이동으로 인정 (물줄기 잠수 방지)
  let yaw = Number(player.getYRot()), pitch = Number(player.getXRot());
  if (Math.abs(yaw - mem.lastYaw) > 0.5 || Math.abs(pitch - mem.lastPitch) > 0.5) tvMarkActive(player);
  mem.lastYaw = yaw;
  mem.lastPitch = pitch;
  if (player.isSleeping()) mem.lastActive = tvNow();
  let afk = tvAfkSec(player);

  // 화제성 식기
  let mult = 1;
  if (!on) mult = TV.offDecayMult;
  else if (afk > TV.afkSoftSec) mult = TV.afkDecayMult;
  let factor = Math.pow(0.5, mult / TV.hypeHalfLifeSec);
  pd.tvHype = tvHype(player) * factor;
  if (pd.tvHype < 0.05) pd.tvHype = 0;

  if (!on) return;

  // 잠수 단계
  if (afk > TV.afkHardSec && !mem.afkAnnounced) {
    mem.afkAnnounced = true;
    player.server.runCommandSilent(`team join tv_afk ${tvName(player)}`);
    tvViewerChat(player, "afk", {}, 3, 20);
  }

  // 활동 중이면 단골이 조금씩 늘어남
  if (afk < TV.afkSoftSec) {
    mem.organicAcc++;
    if (mem.organicAcc >= TV.organicSubsEverySec) {
      mem.organicAcc = 0;
      tvChange(player, 0, 1, "꾸준한 방송");
    }
  }

  // 채팅 대기열 흘려보내기
  let now = tvNow();
  if (mem.queue.length) {
    let ready = mem.queue.filter((q) => q.at <= now);
    mem.queue = mem.queue.filter((q) => q.at > now);
    ready.forEach((q) => tvPushChat(player, q.name, q.color, q.msg));
  }

  // 조용할 때 잡담
  if (afk < TV.afkSoftSec && now - mem.lastIdleChat > 45000 && Math.random() < 0.05) {
    mem.lastIdleChat = now;
    if (!(now - (mem.aiIdleAt || 0) > 180000 && global.tvAiRequest && global.tvAiRequest(player, "idle", "특별한 일 없이 플레이 중"))) {
      tvViewerChat(player, "idle", {}, 1, 2);
    } else {
      mem.aiIdleAt = now;
    }
  }

  // 해골 광산 깊이 기록
  if (String(player.level.dimension) == "society:skull_cavern") {
    let depth = Math.max(0, Math.floor((511 - player.y) / 16));
    if (depth > Number(pd.tvSkullBest)) {
      let gained = depth - Number(pd.tvSkullBest);
      pd.tvSkullBest = depth;
      tvEvent(player, 5 * gained, 3 * gained, `해골 광산 ${depth}구간 신기록`, "skull_depth", { depth: depth });
    }
  }

  // 미션
  tvMissionTick(player);

  // 수입·지출 감지 (10초마다)
  if (player.age % (TV_TICKS_PER_SEC * 10) < TV_TICKS_PER_SEC) tvCheckBalance(player);

  // 랜덤 후원
  if (afk < TV.afkHardSec) {
    let perMin = Math.min(TV.donationRateMax, TV.donationRateBase + tvViewers(player) / TV.donationRatePerViewers);
    if (Math.random() < perMin / 60) tvDonate(player, null);
    if (!mem.mission && now - mem.lastMissionEnd > TV.missionMinGapSec * 1000 && Math.random() < TV.missionChancePerMin / 60) {
      tvMissionStart(player);
    }
  }

  // 순위·채팅창 갱신 (5초마다, 시청자 수가 바뀌었을 때)
  if (player.age % (TV_TICKS_PER_SEC * 5) < TV_TICKS_PER_SEC) {
    let v = tvViewers(player);
    if (v != mem.lastViewers) {
      mem.lastViewers = v;
      tvSetSidebarScore(player);
    }
    tvRenderChat(player);
  }
}

function tvCheckBalance(player) {
  let account;
  try {
    account = global.getPersonalOrCurioAccount(player.level, player);
  } catch (e) {
    return;
  }
  if (!account) return;
  let mem = tvMem(player);
  let bal = Number(account.getBalance()) || 0;
  if (mem.lastBalance == null) {
    mem.lastBalance = bal;
    return;
  }
  let diff = bal - mem.lastBalance;
  mem.lastBalance = bal;
  if (diff >= 500) {
    let big = diff >= 20000;
    let hype = Math.min(60, Math.round(Math.log(diff) * 3)) * tvDaily(player, "income");
    tvEvent(player, hype, 0, `수입 ${tvFmt(diff)}`, big ? "income_big" : "income_small", { amt: tvFmt(diff) });
  } else if (diff <= -2000) {
    tvViewerChat(player, "spend", {}, 1, 4);
  }
}

// ───────────── 이벤트 연결 ─────────────

const TV_RARE_ORES = {
  "minecraft:emerald_ore": "에메랄드", "minecraft:deepslate_emerald_ore": "에메랄드",
  "minecraft:ancient_debris": "고대 잔해",
};

BlockEvents.broken((e) => {
  let player = e.player;
  if (!player || player.isFake()) return;
  tvMarkActive(player);
  if (!tvIsOn(player)) return;
  let id = String(e.block.id);
  if (id == "minecraft:diamond_ore" || id == "minecraft:deepslate_diamond_ore") {
    if (tvFirst(player, "diamond")) tvEvent(player, 25, 10, "생애 첫 다이아몬드!", "diamond_first", {});
    else tvEvent(player, Math.round(25 * tvDaily(player, "diamond")), 0, "다이아몬드", "diamond", {});
  } else if (TV_RARE_ORES[id] || id.indexOf("iridium") >= 0) {
    let label = TV_RARE_ORES[id] || "이리듐";
    let first = tvFirst(player, "ore:" + id);
    tvEvent(player, Math.round(20 * tvDaily(player, "ore:" + id)), first ? 3 : 0, first ? `첫 ${label}!` : label, "rare_ore", { item: label });
  }
  if (id.indexOf("_ore") >= 0 || id == "minecraft:ancient_debris" || e.block.hasTag("minecraft:logs")) tvMissionProgress(player, "mine", 1);
});

EntityEvents.death((e) => {
  let entity = e.entity;
  // 스트리머가 죽음
  if (entity.isPlayer()) {
    if (entity.isFake && entity.isFake()) return;
    let boss = tvBossNearby(entity);
    if (boss) tvEvent(entity, 10, 0, "보스전 사망 (레전드 장면)", "death_boss", {});
    else tvEvent(entity, -30, 0, "사망", "death", {});
    let m = tvMem(entity).mission;
    if (m) tvMissionEnd(entity, false);
    return;
  }
  let player = e.source ? e.source.player : null;
  if (!player || !player.isPlayer() || player.isFake()) return;
  tvMarkActive(player);
  if (!entity.isLiving()) return;
  let hp = Number(entity.maxHealth) || 0;
  let mobName = String(entity.displayName.string);
  let typeId = String(entity.type);
  let hostile = false;
  try {
    hostile = String(entity.getType().getCategory().getName()) == "monster";
  } catch (err) {
    hostile = false;
  }
  if (hostile) tvMissionProgress(player, "kill", 1);
  if (hp >= 500) {
    let first = tvFirst(player, "boss:" + typeId);
    tvEvent(player, first ? 300 : 120, first ? 50 : 5, `${mobName} 처치!`, "kill_boss", { mob: mobName });
  } else if (hp >= 100) {
    let first = tvFirst(player, "mini:" + typeId);
    tvEvent(player, first ? 50 : 20, first ? 10 : 0, `${mobName} 처치`, "kill_mini", { mob: mobName });
  } else if (hostile && tvFirst(player, "kill:" + typeId)) {
    tvChange(player, 3, 1, `처음 잡은 몹: ${mobName}`);
  }
});

PlayerEvents.chat((e) => {
  let player = e.player;
  tvMarkActive(player);
  if (!tvIsOn(player)) return;
  let msg = String(e.message);
  if (global.tvAiRequest && global.tvAiRequest(player, "chat", msg)) return; // AI가 답함
  let matched = null;
  global.TV_CHAT_REPLIES.forEach((r) => {
    if (!matched && r.keys.some((k) => msg.indexOf(k) >= 0)) matched = r;
  });
  let mem = tvMem(player);
  if (matched) {
    let n = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < n; i++) {
      let v = tvRand(global.TV_VIEWERS);
      mem.queue.push({ at: tvNow() + 1000 + Math.random() * 4000, name: v.name, color: v.color, msg: tvRand(matched.lines) });
    }
  } else if (Math.random() < 0.3) {
    let v = tvRand(global.TV_VIEWERS);
    mem.queue.push({ at: tvNow() + 1500 + Math.random() * 3000, name: v.name, color: v.color, msg: tvRand(["ㅇㅇ", "ㄹㅇ", "ㅋㅋ", "맞아요", "?"]) });
  }
});

ItemEvents.rightClicked((e) => {
  if (e.player && !e.player.isFake()) tvMarkActive(e.player);
});
BlockEvents.rightClicked((e) => {
  if (e.player && !e.player.isFake()) tvMarkActive(e.player);
});
BlockEvents.placed((e) => {
  if (e.player && !e.player.isFake()) tvMarkActive(e.player);
});

if (PlayerEvents.advancement) {
  PlayerEvents.advancement((e) => {
    let player = e.player;
    if (!player || !tvIsOn(player)) return;
    let title = "업적";
    try {
      title = String(e.advancement.displayText.string).replace(/[\[\]]/g, "");
    } catch (err) {
      title = "업적";
    }
    tvEvent(player, 8, 3, `업적: ${title}`, "advancement", { item: title });
  });
}

// 강화: enhance.js가 결과마다 부름
global.tvOnEnhance = (player, result, level, name) => {
  if (!player || !tvIsOn(player)) return;
  let vars = { item: name, n: level };
  if (result == "success") {
    if (level >= 7) tvEvent(player, Math.round(level * level * 0.8), level >= 10 ? level : 0, `+${level} 강화 성공`, "enhance_success", vars);
    else tvViewerChat(player, "enhance_success", vars, 1, 3);
  } else if (result == "break") {
    // 파괴는 방송에선 최고의 장면
    tvEvent(player, Math.round(level * level), 0, `+${level} ${name} 파괴`, "enhance_break", vars);
  } else if (result == "down") {
    tvEvent(player, level >= 7 ? 8 : 2, 0, `강화 실패 (+${level} → +${level - 1})`, "enhance_fail", vars);
  } else {
    tvViewerChat(player, "enhance_fail", vars, 1, 3);
  }
};

// 낚시: 시작 스크립트(streamFishing.js)의 Forge 이벤트가 이 함수를 부름
global.tvOnFished = (player, itemIds) => {
  if (!player || player.isFake() || !tvIsOn(player)) return;
  tvMarkActive(player);
  itemIds.forEach((id) => {
    let trade = global.trades ? global.trades.get(String(id)) : null;
    let value = trade ? Number(trade.value) : 0;
    let label = id;
    try {
      label = String(Item.of(id).displayName.string).replace(/[\[\]]/g, "");
    } catch (err) {
      label = id;
    }
    let first = tvFirst(player, "fish:" + id);
    let hype = Math.max(1, Math.min(40, Math.round(value / 16))) * (first ? 2 : 1) * tvDaily(player, "fish:" + id);
    let cat = value >= 160 ? "fish_big" : "fish_small";
    if (first) cat = "fish_first";
    tvEvent(player, Math.round(hype), first ? 2 : 0, first ? `처음 낚은 ${label}` : label, cat, { item: label });
    tvMissionProgress(player, "fish", 1);
  });
};

PlayerEvents.loggedIn((e) => {
  let player = e.player;
  tvData(player);
  let mem = tvMem(player);
  mem.lastActive = tvNow();
  mem.lastBalance = null;
  tvUpdateSidebar(player.server);
  tvEnsureMenuObjectives(player.server);
  player.server.runCommandSilent(`team leave ${tvName(player)}`);
  tvSetSidebarScore(player);
  player.server.scheduleInTicks(60, () => {
    if (player.isRemoved()) return;
    tvShowStoredRecap(player);
    tvApplyRankAwards(player);
  });
  if (tvIsOn(player)) {
    player.server.scheduleInTicks(100, () => {
      if (player.isRemoved()) return;
      tvSessionStart(player);
      tvChange(player, 10, 0, "방송 시작");
      tvViewerChat(player, "stream_on", {}, 3, 8);
      player.tell(Text.of("[방송] 방송 중이에요. /방송 을 입력하면 메뉴가 열려요.").gray());
    });
  }
});

PlayerEvents.loggedOut((e) => {
  let player = e.player;
  let id = String(player.uuid);
  player.server.runCommandSilent(`bossbar remove ${tvBossbarId(player)}`);
  try {
    tvSessionEnd(player, true);
  } catch (err) {
    console.error("[TheValley] stream recap error: " + err);
  }
  delete TV_ACTIVE[id];
});

PlayerEvents.tick((e) => {
  let player = e.player;
  if (player.age % TV_TICKS_PER_SEC != 0) return;
  if (player.isFake()) return;
  try {
    tvSecond(player);
  } catch (err) {
    console.error("[TheValley] stream tick error: " + err);
  }
});

// ───────────── 방송 결산 ─────────────
// 레전드 장면 = 이번 방송에서 시청자가 가장 많이 늘어난 순간 3개 (같은 이유는 한 번만)

function tvSessionStart(player) {
  let mem = tvMem(player);
  let v = tvViewers(player);
  mem.session = { start: tvNow(), startViewers: v, peak: v, donated: 0, donations: 0, topDonation: null, missions: 0, highlights: [], subsStart: tvSubs(player) };
}

function tvSessionNote(player, diff, reason) {
  let mem = tvMem(player);
  if (!mem.session) return;
  let v = tvViewers(player);
  if (v > mem.session.peak) mem.session.peak = v;
  tvRankNote(player, v);
  if (diff <= 0 || reason == "방송 시작" || reason == "꾸준한 방송") return;
  let h = mem.session.highlights;
  let same = h.filter((x) => x.reason == reason)[0];
  if (same) {
    if (diff > same.diff) same.diff = diff;
  } else {
    h.push({ reason: reason, diff: diff });
  }
  h.sort((a, b) => b.diff - a.diff);
  if (h.length > 3) h.length = 3;
}

function tvSessionDonation(player, amount, from) {
  let mem = tvMem(player);
  if (!mem.session) return;
  mem.session.donated += amount;
  mem.session.donations++;
  if (!mem.session.topDonation || amount > mem.session.topDonation.amount) mem.session.topDonation = { amount: amount, from: from };
}

function tvRecapLines(r) {
  let min = Math.max(1, Math.round(r.durationSec / 60));
  let lines = [
    "§c━━━━━━ 오늘 방송 결산 ━━━━━━",
    `§f방송 시간 §e${min >= 60 ? Math.floor(min / 60) + "시간 " + (min % 60) + "분" : min + "분"}§f · 최고 시청자 §e${tvFmt(r.peak)}§f명`,
    `§f구독자 §e${tvFmt(r.subsStart)} → ${tvFmt(r.subsEnd)}§f (${r.subsEnd - r.subsStart >= 0 ? "+" : ""}${tvFmt(r.subsEnd - r.subsStart)})`,
    `§f받은 후원 §e${tvFmt(r.donated)}§f (${r.donations}회) · 미션 성공 §e${r.missions}§f번`,
  ];
  if (r.topDonation) lines.push(`§f최고 후원 §e${tvFmt(r.topDonation.amount)}§f · ${r.topDonation.from}`);
  if (r.highlights.length) {
    lines.push("§6레전드 장면");
    r.highlights.forEach((h, i) => lines.push(`  §e${i + 1}. §f${h.reason} §a(+${tvFmt(h.diff)}명)`));
  }
  lines.push("§c━━━━━━━━━━━━━━━━━━━━━━");
  return lines;
}

function tvSessionEnd(player, loggingOut) {
  let mem = tvMem(player);
  let sess = mem.session;
  mem.session = null;
  if (!sess) return;
  let durationSec = (tvNow() - sess.start) / 1000;
  if (durationSec < 120) return; // 2분 미만은 결산 안 함
  let recap = {
    durationSec: durationSec, peak: sess.peak, subsStart: sess.subsStart, subsEnd: tvSubs(player),
    donated: sess.donated, donations: sess.donations, topDonation: sess.topDonation, missions: sess.missions, highlights: sess.highlights,
  };
  if (loggingOut) {
    tvData(player).tvLastRecap = tvJson(recap); // 다음 접속 때 보여줌
  } else {
    tvRecapLines(recap).forEach((l) => player.tell(l));
  }
}

function tvShowStoredRecap(player) {
  let pd = tvData(player);
  let raw = String(pd.tvLastRecap || "");
  if (!raw) return;
  pd.tvLastRecap = "";
  try {
    player.tell("§7지난 방송 결산이에요.");
    tvRecapLines(JSON.parse(raw)).forEach((l) => player.tell(l));
  } catch (err) {
    console.error("[TheValley] recap parse error: " + err);
  }
}

// ───────────── 구독자 달성 트로피 ─────────────

function tvCheckTrophies(player) {
  let subs = tvSubs(player);
  TV.trophies.forEach((t) => {
    if (subs < t.subs) return;
    if (!tvFirst(player, "trophy:" + t.id)) return;
    let name = tvName(player);
    player.server.runCommandSilent(`give ${name} ${t.block}{BlockEntityTag:{Trophy:"${t.id}"}}`);
    player.server.runCommandSilent(
      `tellraw @a ${tvJson([{ text: "[방송] ", color: "#FF5555" }, { text: `${name}님 구독자 ${tvFmt(t.subs)}명 달성! `, color: "#FFFFFF" }, { text: t.name, color: t.color, bold: true }])}`
    );
    player.server.runCommandSilent(`execute as ${name} at @s run playsound minecraft:ui.toast.challenge_complete player @s ~ ~ ~ 1 1`);
    tvViewerChat(player, "trophy", { item: t.name }, 4, 6);
  });
}

// ───────────── 일간 순위 ─────────────
// 오른쪽 순위표는 실시간 시청자. 매일 자정(한국·일본 시간)에 그날 최고 시청자 순위로 보너스 후원 (미정산금으로)
// 서버 컴퓨터 시간대와 상관없이 UTC+TV.rankUtcOffsetHours 기준으로 날짜를 셈

function tvRankWeek(server) {
  return Math.floor((Date.now() + TV.rankUtcOffsetHours * 3600000) / 86400000);
}
function tvRankLoad(server) {
  try {
    let raw = server.persistentData.tvRankJson;
    if (raw) return JSON.parse(String(raw));
  } catch (err) {
    console.error("[TheValley] rank load error: " + err);
  }
  return { week: tvRankWeek(server), players: {}, awards: {} };
}
function tvRankSave(server, data) {
  server.persistentData.tvRankJson = tvJson(data);
}

function tvRankNote(player, viewers) {
  let server = player.server;
  let data = tvRankLoad(server);
  let id = String(player.uuid);
  let cur = data.players[id];
  if (cur && cur.peak >= viewers) return;
  data.players[id] = { name: tvName(player), peak: viewers };
  tvRankSave(server, data);
}

function tvRankCheck(server) {
  let data = tvRankLoad(server);
  let week = tvRankWeek(server);
  if (week == data.week) return;
  let ranked = Object.keys(data.players)
    .map((id) => ({ id: id, name: data.players[id].name, peak: data.players[id].peak }))
    .sort((a, b) => b.peak - a.peak)
    .slice(0, TV.rankRewards.length);
  if (ranked.length) {
    server.runCommandSilent(`tellraw @a ${tvJson({ text: "━━━━ [방송] 오늘의 시청자 순위 ━━━━", color: "#FF5555" })}`);
    ranked.forEach((r, i) => {
      let award = tvRoundCoins(r.peak * TV.rankRewards[i]);
      data.awards[r.id] = (data.awards[r.id] || 0) + award;
      server.runCommandSilent(
        `tellraw @a ${tvJson([{ text: `${i + 1}등 `, color: "#FFD54F", bold: true }, { text: `${r.name} · 최고 ${tvFmt(r.peak)}명 · 보너스 후원 ${tvFmt(award)}`, color: "#FFFFFF" }])}`
      );
    });
  }
  data.week = week;
  data.players = {};
  tvRankSave(server, data);
  server.players.forEach((p) => tvApplyRankAwards(p));
}

function tvApplyRankAwards(player) {
  let server = player.server;
  let data = tvRankLoad(server);
  let id = String(player.uuid);
  let award = data.awards[id];
  if (!award) return;
  delete data.awards[id];
  tvRankSave(server, data);
  let pd = tvData(player);
  pd.tvPending = Number(pd.tvPending) + award;
  pd.tvDonatedTotal = Number(pd.tvDonatedTotal) + award;
  player.tell(Text.of(`[방송] 일간 순위 보너스 ${tvFmt(award)}이 미정산 후원금에 들어왔어요.`).gold());
}

ServerEvents.tick((e) => {
  let server = e.server;
  if (server.tickCount % 600 != 0) return; // 30초마다
  try {
    tvRankCheck(server);
  } catch (err) {
    console.error("[TheValley] rank tick error: " + err);
  }
});

// ───────────── 명령어 ─────────────

function tvSetOn(player, on) {
  let pd = tvData(player);
  pd.tvOn = on ? 1 : 0;
  let mem = tvMem(player);
  if (!on) {
    if (mem.mission) {
      mem.mission = null;
      player.server.runCommandSilent(`bossbar remove ${tvBossbarId(player)}`);
    }
    player.tell(Text.of("[방송] 방송을 껐어요. 시청자가 서서히 빠져요.").gray());
    tvSessionEnd(player, false);
  } else {
    player.tell(Text.of("[방송] 방송을 켰어요!").green());
    tvSessionStart(player);
    tvChange(player, 10, 0, "방송 시작");
    tvViewerChat(player, "stream_on", {}, 3, 8);
  }
  tvSetSidebarScore(player);
  tvRenderChat(player);
  return 1;
}

function tvStats(player) {
  let pd = tvData(player);
  let tier = tvTier(player);
  let mem = tvMem(player);
  let lines = [
    `§c[방송 통계]§r ${tvIsOn(player) ? "§aON" : "§7OFF"}`,
    `§f시청자 §e${tvFmt(tvViewers(player))}§f = 구독자 §e${tvFmt(tvSubs(player))}§f × 화제성 §e${(1 + tvHype(player) / 100).toFixed(2)}배`,
    `§f등급 §e${tier.name}§f (정산 수수료 ${Math.round(tier.fee * 100)}%)`,
    `§f미정산 후원금 §e${tvFmt(pd.tvPending)}§7 (병원비는 계좌에서 먼저, 모자라면 여기서)`,
    `§f누적 후원 §e${tvFmt(pd.tvDonatedTotal)}§f · 해골 광산 최고 ${pd.tvSkullBest}구간`,
    "§7최근 변동:",
  ];
  mem.changes.slice(-6).reverse().forEach((c) => {
    let sign = c.diff >= 0 ? "§a+" : "§c";
    lines.push(`  ${sign}${tvFmt(c.diff)}§7 · ${c.reason}${c.subs ? ` (구독자 ${c.subs > 0 ? "+" : ""}${c.subs})` : ""}`);
  });
  lines.forEach((l) => player.tell(l));
  if (Number(pd.tvPending) > 0) tvSettleHint(player, false);
  return 1;
}

function tvToggleChat(player, on) {
  tvData(player).tvChatOn = on ? 1 : 0;
  tvRenderChat(player);
  player.tell(Text.of(`[방송] 방송 채팅창 ${on ? "켬" : "끔"}`).gray());
  return 1;
}

// ───────────── 병원비 ─────────────
// streamFeeHook.js: 미정산금도 계좌에 있는 돈으로 쳐서 병원비를 계산하고, 계좌에서 먼저 뺀다.

// ───────────── 메뉴 (SVDialog 창) ─────────────
// 창 글자는 서버에서 점수판 값으로 채워지므로, 열기 직전에 점수를 맞춰 둔다.
const TV_MENU_OBJECTIVES = ["tv_m_on", "tv_m_chat", "tv_m_viewers", "tv_m_subs", "tv_m_pending", "tv_m_fee", "tv_m_net"];

function tvSyncMenuScores(player) {
  let s = player.server;
  let name = tvName(player);
  let pd = tvData(player);
  let tier = tvTier(player);
  let pending = Number(pd.tvPending) || 0;
  let vals = {
    tv_m_on: tvIsOn(player) ? 1 : 0,
    tv_m_chat: Number(pd.tvChatOn) == 1 ? 1 : 0,
    tv_m_viewers: tvIsOn(player) ? tvViewers(player) : 0,
    tv_m_subs: tvSubs(player),
    tv_m_pending: Math.min(2000000000, pending),
    tv_m_fee: Math.round(tier.fee * 100),
    tv_m_net: Math.min(2000000000, pending - Math.round(pending * tier.fee)),
  };
  Object.keys(vals).forEach((k) => s.runCommandSilent(`scoreboard players set ${name} ${k} ${vals[k]}`));
}

function tvOpenMenu(player) {
  tvSyncMenuScores(player);
  player.server.runCommandSilent(`dialog ${tvName(player)} show ${tvName(player)} thevalley_stream_menu`);
  return 1;
}

// 메뉴 버튼이 부르는 명령: 실행 후 2틱 뒤 새 값으로 메뉴를 다시 연다
function tvMenuAction(player, fn) {
  fn(player);
  player.server.scheduleInTicks(2, () => {
    if (!player.isRemoved()) tvOpenMenu(player);
  });
  return 1;
}

ServerEvents.commandRegistry((event) => {
  let { commands: Commands } = event;
  let run = (fn) => (ctx) => {
    let player = ctx.source.player;
    if (!player) return 0;
    return fn(player) || 1;
  };
  let build = (root, words) =>
    Commands.literal(root)
      .executes(run(tvOpenMenu))
      .then(Commands.literal("menu_toggle").executes(run((p) => tvMenuAction(p, (q) => tvSetOn(q, !tvIsOn(q))))))
      .then(Commands.literal("menu_settle").executes(run((p) => tvMenuAction(p, tvSettle))))
      .then(Commands.literal("menu_chat").executes(run((p) => tvMenuAction(p, (q) => tvToggleChat(q, Number(tvData(q).tvChatOn) != 1)))))
      .then(Commands.literal(words.on).executes(run((p) => tvSetOn(p, true))))
      .then(Commands.literal(words.off).executes(run((p) => tvSetOn(p, false))))
      .then(Commands.literal(words.stats).executes(run(tvStats)))
      .then(Commands.literal(words.settle).executes(run(tvSettle)))
      .then(Commands.literal("ai").requires((src) => src.hasPermission(2)).executes(run((p) => (global.tvAiStats ? global.tvAiStats(p) : 0))))
      .then(
        Commands.literal(words.chat)
          .then(Commands.literal(words.on).executes(run((p) => tvToggleChat(p, true))))
          .then(Commands.literal(words.off).executes(run((p) => tvToggleChat(p, false))))
      );
  event.register(build("stream", { on: "on", off: "off", stats: "stats", settle: "settle", chat: "chat" }));
  event.register(build("방송", { on: "켜기", off: "끄기", stats: "통계", settle: "정산", chat: "채팅" }));
});

function tvEnsureMenuObjectives(server) {
  TV_MENU_OBJECTIVES.forEach((o) => server.runCommandSilent(`scoreboard objectives add ${o} dummy`));
}

ServerEvents.loaded((e) => {
  tvUpdateSidebar(e.server);
  tvEnsureMenuObjectives(e.server);
});
