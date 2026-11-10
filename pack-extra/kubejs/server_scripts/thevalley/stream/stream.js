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

// 이 서버의 Rhino는 일부 마인크래프트 함수 이름(getYRot, getTag 등)을 못 찾고 같은 이름의 필드만 보여줌.
// 함수가 있으면 함수를, 없으면 필드를 읽는다. (2026-11-10 실서버 진단으로 확인)
function tvG(obj, field, method) {
  if (obj == null) return undefined;
  if (method && typeof obj[method] === "function") return obj[method]();
  return obj[field];
}

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
      idleGap: 15000,
      afkAnnounced: false,
      lastViewers: -1,
    };
  }
  return TV_ACTIVE[id];
}

// ───────────── 저장 상태 ─────────────

// 전원 초기화 번호: 서버에 저장된 번호와 플레이어 번호가 다르면 다음 접속 때 방송 데이터를 새로 시작
function tvServerEpoch(server) {
  let ep = server.persistentData.tvResetEpoch;
  return ep ? String(ep) : "0";
}

function tvData(player) {
  let pd = player.persistentData;
  let epoch = tvServerEpoch(player.server);
  if (pd.tvInit == 1 && String(pd.tvEpoch || "0") != epoch) pd.tvInit = 0;
  if (pd.tvInit != 1) {
    pd.tvEpoch = epoch;
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
  // 숫자가 깨졌으면(NaN) 복구
  ["tvPending", "tvDonatedTotal", "tvHype", "tvSkullBest"].forEach((k) => {
    if (!isFinite(Number(pd[k]))) pd[k] = 0;
  });
  if (!isFinite(Number(pd.tvSubs))) pd.tvSubs = TV.startSubs;
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
// 채팅 분주함 0~1: 시청자 10명 0.33, 100명 0.67, 1,000명 이상 1
function tvBusy(player) {
  let v = Math.max(1, tvViewers(player));
  return Math.max(0, Math.min(1, Math.log(v) / Math.log(10) / 3));
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
  let n = count || 3 + Math.floor(Math.random() * 3) + Math.round(tvBusy(player) * 4);
  let used = {};
  for (let i = 0; i < n; i++) {
    let line = tvRand(lines);
    let tries = 0;
    while (used[line] && tries++ < 5) line = tvRand(lines);
    used[line] = 1;
    let viewer = tvRand(global.TV_VIEWERS);
    let delay = Math.random() * (spreadSec || 6) * 1000;
    let fv = { p: tvName(player) };
    Object.keys(vars || {}).forEach((k) => (fv[k] = vars[k]));
    mem.queue.push({ at: tvNow() + delay, name: viewer.name, color: viewer.color, msg: tvFill(line, fv) });
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

// ───────────── 최근 행동 기록 (AI 상황 설명용, 최근 90초) ─────────────

function tvNote(player, what, count) {
  let mem = tvMem(player);
  let now = tvNow();
  let acts = mem.recentActs || (mem.recentActs = {});
  let a = acts[what] || (acts[what] = { n: 0, t: now });
  a.n += count || 1;
  a.t = now;
}

function tvRecentSummary(player) {
  let acts = tvMem(player).recentActs || {};
  let now = tvNow();
  let out = [];
  Object.keys(acts).forEach((k) => {
    if (now - acts[k].t > 90000) delete acts[k];
    else out.push(`${k} ${acts[k].n}`);
  });
  return out.slice(0, 8).join(", ");
}

// ───────────── 시청자 변동 ─────────────

// hypeDelta: 화제성 점수, subsDelta: 구독자, reason: 화면에 보일 이유
function tvChange(player, hypeDelta, subsDelta, reason) {
  if (!tvIsOn(player)) return;
  let pd = tvData(player);
  let before = tvViewers(player);
  pd.tvHype = Math.max(0, Math.min(TV.hypeMax, tvHype(player) + hypeDelta));
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
  if (hype >= TV.eventDonationMinHype && Math.random() < Math.min(TV.eventDonationMaxChance, hype / 200)) {
    player.server.scheduleInTicks(40 + Math.floor(Math.random() * 120), () => {
      if (player.isRemoved()) return;
      tvDonate(player, { reason: reason, boost: hype >= 100 ? 2 : 1 });
    });
  }
}

// ───────────── 후원 ─────────────

// 금액은 100원 단위 (십의 자리 없음)
function tvRoundCoins(n) {
  return Math.max(100, Math.round(n / 100) * 100);
}

// 후원 금액 뽑기: 100원 ~ 최대치 사이 랜덤 (파레토 분포: 작은 금액이 대부분, 큰 금액은 드묾)
// boost: 큰 장면 보너스 배수
function tvPickDonation(player, boost) {
  let alpha = TV.donationAlphaLow - (TV.donationAlphaLow - TV.donationAlphaHigh) * tvBusy(player);
  let u = Math.max(1e-9, Math.random());
  let amount = TV.donationMin / Math.pow(u, 1 / alpha);
  amount *= boost ? 1 + boost : 1;
  return Math.min(TV.donationMax, tvRoundCoins(amount));
}

function tvDonate(player, opt) {
  if (!tvIsOn(player)) return;
  if (tvAfkSec(player) > TV.afkHardSec) return;
  let pd = tvData(player);
  let mem = tvMem(player);
  let viewer = tvRand(global.TV_VIEWERS);
  let amount = tvPickDonation(player, (opt && opt.boost) || 0);

  let troll = !(opt && opt.reason) && Math.random() < TV.trollChance;
  pd.tvPending = Number(pd.tvPending) + amount;
  pd.tvDonatedTotal = Number(pd.tvDonatedTotal) + amount;
  tvSessionDonation(player, amount, viewer.name);

  let message;
  let dm = global.TV_DONATION_MESSAGES;
  if (troll) {
    let done = tvTroll(player, viewer);
    message = done ? done : tvRand(global.TV_TEMPLATES.troll_skip);
  } else if (opt && opt.reason) {
    message = tvFill(tvRand(dm.event), { item: opt.reason, p: tvName(player) });
  } else {
    let pool = amount >= 10000 ? dm.huge : amount >= 2000 ? dm.big : amount >= 500 ? dm.mid : dm.small;
    message = tvFill(tvRand(pool), { p: tvName(player) });
  }

  // 큰 후원은 AI가 지금 상황에 맞춰 후원 메시지를 씀 (6초 안에 답이 없으면 템플릿 메시지)
  if (!troll && amount >= TV.aiDonationMin && global.tvAiRequest) {
    let shown = false;
    let show = (msg, extraLines) => {
      if (shown || player.isRemoved()) return;
      shown = true;
      tvShowDonation(player, viewer, amount, msg, false, extraLines);
    };
    let seq = global.tvAiRequest(player, "donation", opt && opt.reason ? opt.reason : "평소처럼 플레이 중", { donor: viewer.name, amount: amount, names: [viewer.name] }, (p, lines) => {
      if (!lines.length) return show(message, []);
      show(lines[0].m.slice(0, 50) || message, lines.slice(1));
    });
    if (seq) {
      player.server.scheduleInTicks(120, () => show(message, []));
      return;
    }
  }
  tvShowDonation(player, viewer, amount, message, troll, []);
}

function tvShowDonation(player, viewer, amount, message, troll, extraLines) {
  tvPushChat(player, "[후원] " + viewer.name, viewer.color, `${tvFmt(amount)} 후원 · ${message}`, true);
  let mem = tvMem(player);
  let delay = 0;
  (extraLines || []).forEach((l) => {
    if (!l.m) return;
    delay += 800 + Math.random() * 2000;
    let v = tvRand(global.TV_VIEWERS);
    mem.queue.push({ at: tvNow() + delay, name: l.n || v.name, color: v.color, msg: l.m.slice(0, 40) });
  });
  player.server.runCommandSilent(
    `execute as ${tvName(player)} at @s run playsound minecraft:block.note_block.bell player @s ~ ~ ~ 0.6 ${troll ? 0.6 : 1.4}`
  );
  if (amount >= 10000) {
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
  let fee = Math.min(pending, Math.ceil((pending * tier.fee) / 100) * 100); // 수수료도 100원 단위
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
    let dx = player.x - Number(tvG(home, "x", "getX")), dz = player.z - Number(tvG(home, "z", "getZ"));
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
      let a = Math.random() * 6.283185307179586;
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
    let a = Math.random() * 6.283185307179586;
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
  m.reward = tvRoundCoins(Math.min(TV.missionRewardMax, Math.max(TV.missionRewardMin, tvViewers(player) * 2)));
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

// ───────────── 시청자 사연 (택배 요청) ─────────────
// 시청자가 선릿 밸리 아이템을 보내 달라고 함. 모아서 [보내기]를 누르면 출하 가격보다 비싸게(×requestPriceMult) 사 감.
// 절반 이상은 지금 가방에 있는 팔 수 있는 아이템 중에서 골라서, 할 수 있는 요청이 나오게 함.

function tvCountItem(player, id) {
  let inv = player.inventory;
  let n = 0;
  for (let i = 0; i < inv.getContainerSize(); i++) {
    let st = inv.getItem(i);
    if (!st.isEmpty() && String(st.id) == id) n += st.count;
  }
  return n;
}

function tvTakeItem(player, id, count) {
  let inv = player.inventory;
  let left = count;
  for (let i = 0; i < inv.getContainerSize() && left > 0; i++) {
    let st = inv.getItem(i);
    if (st.isEmpty() || String(st.id) != id) continue;
    let take = Math.min(left, st.count);
    st.shrink(take);
    left -= take;
  }
  return count - left;
}

function tvItemLabel(id) {
  try {
    return String(Item.of(id).displayName.string).replace(/[\[\]]/g, "");
  } catch (err) {
    return id;
  }
}

function tvTradeValue(id) {
  let t = global.trades ? global.trades.get(String(id)) : null;
  return t ? Number(t.value) || 0 : 0;
}

function tvRequestPick(player) {
  let cand = [];
  let inv = player.inventory;
  for (let i = 0; i < inv.getContainerSize(); i++) {
    let st = inv.getItem(i);
    if (st.isEmpty()) continue;
    let id = String(st.id);
    let v = tvTradeValue(id);
    if (v >= TV.requestValueMin && v <= TV.requestValueMax && cand.indexOf(id) < 0) cand.push(id);
  }
  if (cand.length && Math.random() < 0.6) return tvRand(cand);
  let pool = [];
  [global.crops, global.animalProducts, global.cooking].forEach((list) => {
    (list || []).forEach((e) => {
      let v = tvTradeValue(e.item);
      if (v >= TV.requestValueMin && v <= TV.requestValueMax) pool.push(String(e.item));
    });
  });
  if (!pool.length) return cand.length ? tvRand(cand) : null;
  return tvRand(pool);
}

function tvRequestStart(player) {
  let mem = tvMem(player);
  if (mem.mission || !tvIsOn(player)) return;
  let id = tvRequestPick(player);
  if (!id) return;
  let value = tvTradeValue(id);
  let target = Math.min(TV.requestTargetMax, TV.requestTargetBase + tvViewers(player) * 3);
  let goal = Math.max(1, Math.min(64, Math.round(target / value)));
  let viewer = tvRand(global.TV_VIEWERS);
  let label = tvItemLabel(id);
  let m = {
    type: "request",
    item: id,
    label: label,
    goal: goal,
    progress: 0,
    sec: TV.requestSec,
    from: viewer.name,
    text: `${label} ${goal}개 보내 주세요`,
  };
  m.ends = tvNow() + m.sec * 1000;
  m.reward = tvRoundCoins(Math.min(TV.requestRewardMax, value * goal * TV.requestPriceMult));
  mem.mission = m;
  let bid = tvBossbarId(player);
  let s = player.server;
  s.runCommandSilent(`bossbar remove ${bid}`);
  s.runCommandSilent(`bossbar add ${bid} ${tvJson({ text: `[사연] ${m.text}  보상 ${tvFmt(m.reward)}`, color: "#FFB3E6" })}`);
  s.runCommandSilent(`bossbar set ${bid} color pink`);
  s.runCommandSilent(`bossbar set ${bid} max ${m.sec}`);
  s.runCommandSilent(`bossbar set ${bid} value ${m.sec}`);
  s.runCommandSilent(`bossbar set ${bid} players ${tvName(player)}`);
  let story = tvFill(tvRand(global.TV_REQUEST_STORIES), { item: label, n: goal, p: tvName(player) });
  tvPushChat(player, "[사연] " + viewer.name, viewer.color, `${story} (보상 ${tvFmt(m.reward)})`, true);
  s.runCommandSilent(
    `tellraw ${tvName(player)} ${tvJson([
      { text: "[사연] ", color: "#FFB3E6" },
      { text: `${viewer.name}: ${label} ${goal}개를 보내 주면 ${tvFmt(m.reward)} 후원 (출하가의 ${TV.requestPriceMult}배, ${Math.round(m.sec / 60)}분 안에) `, color: "#FFFFFF" },
      { text: "[보내기]", color: "#FFB3E6", bold: true, clickEvent: { action: "run_command", value: "/stream send" }, hoverEvent: { action: "show_text", contents: "가방에서 꺼내서 보내요" } },
    ])}`
  );
}

function tvRequestHint(player) {
  let m = tvMem(player).mission;
  if (!m || m.type != "request") return;
  player.server.runCommandSilent(
    `tellraw ${tvName(player)} ${tvJson([
      { text: "[사연] ", color: "#FFB3E6" },
      { text: `${m.label} ${m.goal}개가 모였어요! `, color: "#FFFFFF" },
      { text: "[보내기]", color: "#FFB3E6", bold: true, clickEvent: { action: "run_command", value: "/stream send" }, hoverEvent: { action: "show_text", contents: `${m.from}님에게 보내고 ${tvFmt(m.reward)} 받기` } },
    ])}`
  );
}

function tvRequestSend(player) {
  let mem = tvMem(player);
  let m = mem.mission;
  if (!m || m.type != "request") {
    player.tell(Text.of("[사연] 지금 받은 사연이 없어요.").gray());
    return 0;
  }
  let have = tvCountItem(player, m.item);
  if (have < m.goal) {
    player.tell(Text.of(`[사연] ${m.label}이(가) 모자라요 (${have}/${m.goal})`).red());
    return 0;
  }
  tvTakeItem(player, m.item, m.goal);
  tvPushChat(player, m.from, "#FFB3E6", tvFill(tvRand(global.TV_REQUEST_THANKS), { item: m.label, p: tvName(player) }));
  tvMissionEnd(player, true);
  return 1;
}

function tvMissionTick(player) {
  let m = tvMem(player).mission;
  if (!m) return;
  let left = Math.max(0, Math.ceil((m.ends - tvNow()) / 1000));
  player.server.runCommandSilent(`bossbar set ${tvBossbarId(player)} value ${left}`);
  if (m.type == "request") {
    let have = tvCountItem(player, m.item);
    player.server.runCommandSilent(
      `bossbar set ${tvBossbarId(player)} name ${tvJson({ text: `[사연] ${m.label} ${m.goal}개 보내 주세요 (보유 ${Math.min(have, m.goal)}/${m.goal})  보상 ${tvFmt(m.reward)}`, color: "#FFB3E6" })}`
    );
    if (have >= m.goal && !m.readyNotified) {
      m.readyNotified = true;
      tvRequestHint(player);
    }
  } else if (m.type == "goto") {
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
  let yaw = Number(tvG(player, "yRot", "getYRot")) || 0, pitch = Number(tvG(player, "xRot", "getXRot")) || 0;
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

  // 평소 잡담: 시청자가 많을수록 자주, 여러 명이 (10명 약 15초마다 1줄 → 1,000명 2~3초마다 여러 줄)
  let busy = tvBusy(player);
  if (afk < TV.afkSoftSec && now - mem.lastIdleChat > mem.idleGap) {
    mem.lastIdleChat = now;
    mem.idleGap = (TV.idleChatMaxSec - (TV.idleChatMaxSec - TV.idleChatMinSec) * busy) * 1000 * (0.6 + Math.random() * 0.8);
    let aiIdleGap = (TV.aiIdleMaxSec - (TV.aiIdleMaxSec - TV.aiIdleMinSec) * busy) * 1000;
    if (now - (mem.aiIdleAt || 0) > aiIdleGap && global.tvAiRequest && global.tvAiRequest(player, "idle", "특별한 일 없이 플레이 중")) {
      mem.aiIdleAt = now;
    } else {
      let n = 1 + Math.floor(Math.random() * (2 + busy * 4));
      tvViewerChat(player, Math.random() < 0.6 ? "idle" : "chat_generic", {}, n, 3);
    }
  }

  // 해골 광산 깊이 기록
  if (String(player.level.dimension) == "society:skull_cavern") {
    let depth = Math.max(0, Math.floor((511 - player.y) / 16));
    if (depth > Number(pd.tvSkullBest)) {
      let gained = depth - Number(pd.tvSkullBest);
      pd.tvSkullBest = depth;
      tvEvent(player, 4 * gained, gained, `해골 광산 ${depth}구간 신기록`, "skull_depth", { depth: depth });
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
    if (!mem.mission && now - mem.lastMissionEnd > TV.missionMinGapSec * 1000 && Math.random() < TV.requestChancePerMin / 60) {
      tvRequestStart(player);
    } else if (!mem.mission && now - mem.lastMissionEnd > TV.missionMinGapSec * 1000 && Math.random() < TV.missionChancePerMin / 60) {
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
  tvNote(player, `캔 블록 ${id.split(":")[1] || id}`, 1);
  if (id == "minecraft:diamond_ore" || id == "minecraft:deepslate_diamond_ore") {
    if (tvFirst(player, "diamond")) tvEvent(player, 25, 5, "생애 첫 다이아몬드!", "diamond_first", {});
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
    if (m && m.type != "request") tvMissionEnd(entity, false); // 사연은 죽어도 유지
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
    hostile = !!entity.isMonster();
  } catch (err) {
    hostile = false;
  }
  if (hostile) tvMissionProgress(player, "kill", 1);
  tvNote(player, `처치 ${mobName}`, 1);
  if (hp >= 500) {
    let first = tvFirst(player, "boss:" + typeId);
    tvEvent(player, first ? 150 : 60, first ? 30 : 3, `${mobName} 처치!`, "kill_boss", { mob: mobName });
  } else if (hp >= 100) {
    let first = tvFirst(player, "mini:" + typeId);
    tvEvent(player, first ? 40 : Math.round(15 * tvDaily(player, "mini")), first ? 5 : 0, `${mobName} 처치`, "kill_mini", { mob: mobName });
  } else if (hostile && tvFirst(player, "kill:" + typeId)) {
    tvChange(player, 3, 1, `처음 잡은 몹: ${mobName}`);
  }
});

// 비속어 → 시청자 이탈 (공백·숫자·특수문자를 빼고 검사)
function tvSwearCheck(player, msg) {
  let words = TV.swearWords || [];
  let norm = String(msg).toLowerCase().replace(/[\s0-9.,!?~_\-*^@#$%&()\[\]{}'"]/g, "");
  if (!words.some((w) => norm.indexOf(w) >= 0)) return false;
  let mult = Math.round(1 / tvDaily(player, "swear")); // 오늘 몇 번째인지
  let hype = -Math.min(60, TV.swearHype * mult);
  let subs = mult >= TV.swearSubsFrom ? -1 : 0;
  tvEvent(player, hype, subs, mult > 1 ? `비속어 (오늘 ${mult}번째)` : "비속어", "swear", {});
  return true;
}

PlayerEvents.chat((e) => {
  let player = e.player;
  tvMarkActive(player);
  if (!tvIsOn(player)) return;
  let msg = String(e.message);
  if (tvSwearCheck(player, msg)) return;
  if (global.tvAiRequest && global.tvAiRequest(player, "chat", msg)) return; // AI가 답함
  let matched = null;
  global.TV_CHAT_REPLIES.forEach((r) => {
    if (!matched && r.keys.some((k) => msg.indexOf(k) >= 0)) matched = r;
  });
  let mem = tvMem(player);
  if (matched) {
    let n = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < n; i++) {
      let v = tvRand(global.TV_VIEWERS);
      mem.queue.push({ at: tvNow() + 1000 + Math.random() * 4000, name: v.name, color: v.color, msg: tvRand(matched.lines) });
    }
  } else {
    // 키워드가 없어도 스트리머가 말하면 항상 1~2명은 반응
    let n = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < n; i++) {
      let v = tvRand(global.TV_VIEWERS);
      mem.queue.push({ at: tvNow() + 1200 + Math.random() * 3500, name: v.name, color: v.color, msg: tvRand(global.TV_TEMPLATES.chat_generic) });
    }
  }
});

ItemEvents.rightClicked((e) => {
  if (e.player && !e.player.isFake()) tvMarkActive(e.player);
});
BlockEvents.rightClicked((e) => {
  if (e.player && !e.player.isFake()) tvMarkActive(e.player);
});
BlockEvents.placed((e) => {
  if (!e.player || e.player.isFake()) return;
  tvMarkActive(e.player);
  tvNote(e.player, `놓은 블록 ${String(e.block.id).split(":")[1]}`, 1);
});

// 업적: 선릿 밸리 주요 업적만 (streamConfig.js의 advancementRules)
function tvAdvRule(id) {
  let rules = TV.advancementRules || [];
  for (let i = 0; i < rules.length; i++) {
    let r = rules[i];
    if ((r.id && r.id == id) || (r.prefix && id.indexOf(r.prefix) == 0)) return r;
  }
  return null;
}

if (PlayerEvents.advancement) {
  PlayerEvents.advancement((e) => {
    let player = e.player;
    if (!player || player.isFake() || !tvIsOn(player)) return;
    let adv = e.advancement;
    let id = String(adv.id());
    let rule = tvAdvRule(id);
    if (!rule) return;
    let title = "업적";
    try {
      title = String(adv.getTitle().string).replace(/[\[\]]/g, "");
    } catch (err) {
      title = "업적";
    }
    tvEvent(player, rule.hype, rule.subs || 0, `업적: ${title}`, "advancement", { item: title });
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
    tvNote(player, `낚음 ${label}`, 1);
  });
};

PlayerEvents.loggedIn((e) => {
  let player = e.player;
  tvData(player);
  let mem = tvMem(player);
  mem.lastActive = tvNow();
  mem.lastBalance = null;
  tvUpdateSidebar(player.server);
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
  // 오른쪽 순위표에는 지금 방송 중인(접속한) 사람만
  player.server.runCommandSilent(`scoreboard players reset ${tvName(player)} tv_viewers`);
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
    tvRecapAi(player, recap);
  }
}

// AI 한 줄 평 (방송을 끌 때만, AI가 켜져 있으면)
function tvRecapAi(player, recap) {
  if (!global.tvAiRequest) return;
  let min = Math.max(1, Math.round(recap.durationSec / 60));
  let parts = [
    `방송 ${min}분`,
    `최고 시청자 ${recap.peak}명`,
    `구독자 ${recap.subsStart}→${recap.subsEnd}`,
    `후원 ${recap.donations}회 ${recap.donated}원`,
    `미션 성공 ${recap.missions}번`,
  ];
  if (recap.highlights.length) parts.push("주요 장면: " + recap.highlights.map((h) => h.reason).join(", "));
  global.tvAiRequest(player, "recap", parts.join(" / "), {}, (p, lines) => {
    if (!p || !lines.length || !lines[0].m) return;
    p.tell(Text.of("[오늘의 한 줄 평] ").color("#FF77FF").append(Text.of(lines[0].m.slice(0, 60)).white()));
  });
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
      let award = tvRoundCoins(Math.min(TV.rankRewardCaps[i], r.peak * TV.rankRewards[i]));
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

// ───────────── 메뉴 (상자 모양 창, KubeJS 기본 기능) ─────────────

function tvMenuItem(id, name, color, lore) {
  let item = Item.of(id).withName(Text.of(name).color(color).italic(false));
  if (lore && lore.length) item = item.withLore(lore.map((l) => Text.of(l).gray().italic(false)));
  return item;
}

// gui.button은 아이템 이름을 덮어써서 직접 칸을 채운다
function tvBtn(gui, x, y, item, cb) {
  gui.slot(x, y, (slot) => {
    slot.item = item;
    slot.resetClickHandlers(); // 다시 그릴 때 클릭 동작이 겹치지 않게
    if (cb) slot.leftClicked = cb;
  });
}

function tvCloseGui(player) {
  if (typeof player.closeContainer === "function") player.closeContainer();
  else player.server.runCommandSilent(`execute as ${tvName(player)} run tp @s @s`);
}

function tvOpenMenu(player) {
  player.openChestGUI(Text.of("방송 메뉴"), 3, (gui) => {
    gui.playerSlots = false;
    let draw = () => {
      let pd = tvData(player);
      let on = tvIsOn(player);
      let tier = tvTier(player);
      let pending = Number(pd.tvPending) || 0;
      let fee = Math.min(pending, Math.ceil((pending * tier.fee) / 100) * 100);
      gui.slot(4, 0, (slot) => {
        slot.resetClickHandlers();
        slot.item = tvMenuItem(on ? "minecraft:redstone_torch" : "minecraft:lever", on ? "● 방송 중" : "방송 꺼짐", on ? "#FF5555" : "#AAAAAA", [
          `시청자 ${tvFmt(tvViewers(player))}명`,
          `구독자 ${tvFmt(tvSubs(player))}명 · 등급 ${tier.name}`,
          `누적 후원 ${tvFmt(pd.tvDonatedTotal)}`,
        ]);
      });
      tvBtn(gui, 2, 1, tvMenuItem(on ? "minecraft:red_dye" : "minecraft:lime_dye", on ? "방송 끄기" : "방송 켜기", on ? "#F28B82" : "#7EE0A1", [on ? "누르면 방송을 꺼요" : "누르면 방송을 켜요"]), (e) => {
        tvSetOn(player, !tvIsOn(player));
        draw();
      });
      tvBtn(gui, 4, 1, tvMenuItem(pending > 0 ? "minecraft:gold_ingot" : "minecraft:iron_nugget", "정산하기", "#FFD54F", [
        `미정산 후원금 ${tvFmt(pending)}`,
        `수수료 ${Math.round(tier.fee * 100)}% (${tvFmt(fee)}) 떼고`,
        `${tvFmt(pending - fee)} 입금`,
      ]), (e) => {
        tvSettle(player);
        draw();
      });
      let chatOn = Number(pd.tvChatOn) == 1;
      tvBtn(gui, 6, 1, tvMenuItem("minecraft:oak_sign", chatOn ? "방송 채팅창 끄기" : "방송 채팅창 켜기", "#FFFFFF", [chatOn ? "화면 왼쪽 채팅창을 숨겨요" : "화면 왼쪽 채팅창을 보여요"]), (e) => {
        tvToggleChat(player, Number(tvData(player).tvChatOn) != 1);
        draw();
      });
      tvBtn(gui, 8, 2, tvMenuItem("minecraft:barrier", "닫기", "#AAAAAA", []), (e) => tvCloseGui(player));
      gui.sync();
    };
    draw();
  });
  return 1;
}

// ───────────── 초기화 (OP) ─────────────
// 구독자·화제성·미정산 후원금·누적 후원·첫 기록·트로피 기록·해골 광산 기록을 처음 상태로 (방송 켜짐/채팅창 설정은 유지)
function tvResetPlayer(player) {
  let pd = player.persistentData;
  let on = pd.tvOn, chatOn = pd.tvChatOn;
  pd.tvInit = 0;
  tvData(player);
  if (on != null) pd.tvOn = on;
  if (chatOn != null) pd.tvChatOn = chatOn;
  let mem = tvMem(player);
  mem.changes = [];
  mem.session = tvIsOn(player) ? null : mem.session;
  if (tvIsOn(player)) tvSessionStart(player);
  if (mem.mission) {
    mem.mission = null;
    player.server.runCommandSilent(`bossbar remove ${tvBossbarId(player)}`);
  }
  tvSetSidebarScore(player);
  tvRenderChat(player);
  player.tell(Text.of("[방송] 방송 데이터가 초기화됐어요 (구독자·후원금·기록).").yellow());
}

function tvResetAll(server, by) {
  server.persistentData.tvResetEpoch = String(Date.now());
  server.persistentData.tvRankJson = "";
  server.players.forEach((p) => tvResetPlayer(p));
  server.runCommandSilent(`tellraw @a ${tvJson({ text: `[방송] ${by}님이 모든 방송 데이터를 초기화했어요. 접속하지 않은 사람은 다음 접속 때 초기화돼요.`, color: "#FFD54F" })}`);
}

ServerEvents.commandRegistry((event) => {
  let { commands: Commands, arguments: Arguments } = event;
  let run = (fn) => (ctx) => {
    let player = ctx.source.player;
    if (!player) return 0;
    return fn(player) || 1;
  };
  let build = (root, words) =>
    Commands.literal(root)
      .executes(run(tvOpenMenu))
      .then(Commands.literal(words.on).executes(run((p) => tvSetOn(p, true))))
      .then(Commands.literal(words.off).executes(run((p) => tvSetOn(p, false))))
      .then(Commands.literal(words.stats).executes(run(tvStats)))
      .then(Commands.literal(words.settle).executes(run(tvSettle)))
      .then(Commands.literal(words.send).executes(run(tvRequestSend)))
      .then(Commands.literal("ai").requires((src) => src.hasPermission(2)).executes(run((p) => (global.tvAiStats ? global.tvAiStats(p) : 0))))
      .then(
        Commands.literal(words.reset)
          .requires((src) => src.hasPermission(2))
          .then(
            Commands.literal(words.all).executes((ctx) => {
              tvResetAll(ctx.source.server, ctx.source.player ? tvName(ctx.source.player) : "관리자");
              return 1;
            })
          )
          .then(
            Commands.argument("target", Arguments.PLAYER.create(event)).executes((ctx) => {
              let target = Arguments.PLAYER.getResult(ctx, "target");
              tvResetPlayer(target);
              if (ctx.source.player && ctx.source.player != target) ctx.source.player.tell(Text.of(`[방송] ${tvName(target)} 방송 데이터 초기화 완료`).yellow());
              return 1;
            })
          )
      )
      .then(
        Commands.literal(words.chat)
          .then(Commands.literal(words.on).executes(run((p) => tvToggleChat(p, true))))
          .then(Commands.literal(words.off).executes(run((p) => tvToggleChat(p, false))))
      );
  event.register(build("stream", { on: "on", off: "off", stats: "stats", settle: "settle", chat: "chat", reset: "reset", all: "all", send: "send" }));
  event.register(build("방송", { on: "켜기", off: "끄기", stats: "통계", settle: "정산", chat: "채팅", reset: "초기화", all: "전원", send: "보내기" }));
});

ServerEvents.loaded((e) => {
  tvUpdateSidebar(e.server);
});
