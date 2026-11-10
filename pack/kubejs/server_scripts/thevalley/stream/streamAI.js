// priority: 5
// The Valley 방송 시스템 2단계: AI 시청자 채팅
// KubeJS는 인터넷에 직접 접속할 수 없어서, 서버 폴더의 작은 프로그램(thevalley-ai.jar)이 대신 Claude API를 부른다.
//   KubeJS → thevalley_ai/out.json (요청)  →  thevalley-ai.jar  →  Claude API
//   KubeJS ← thevalley_ai/in.json (답)     ←  thevalley-ai.jar
// thevalley-ai.jar가 꺼져 있거나 API 키가 없거나 한도를 넘으면 자동으로 템플릿 채팅만 쓴다.
// 주의: 이 Rhino는 블록({ }) 안의 const를 오류로 처리함. 블록 안에서는 let만 쓸 것.

const TV_AI = {
  dir: "thevalley_ai",
  enabled: true,
  minGapSec: 12, // 한 사람에게 AI 요청 최소 간격
  eventMinHype: 15, // 이 이상 화제성인 장면만 AI로 (작은 일은 템플릿)
  idleEverySec: 180, // 조용할 때 AI 잡담 간격
  chatReply: true, // 스트리머가 채팅 치면 AI가 반응
  maxPerHour: 60, // 한 사람당 시간당 최대 AI 호출 (한 명이 한도를 다 쓰지 못하게)
  aliveSec: 30, // thevalley-ai.jar 신호가 이 시간 안에 있어야 사용
};

const TV_AI_STATE = { seq: 0, outbox: [], dirty: false, lastApplied: 0, status: null, statusReadAt: 0 };

function tvAiPath(name) {
  return `${TV_AI.dir}/${name}`;
}

function tvAiReadJson(name) {
  try {
    return JsonIO.read(tvAiPath(name));
  } catch (err) {
    return null;
  }
}

function tvAiAlive() {
  if (!TV_AI.enabled) return false;
  let st = TV_AI_STATE.status;
  if (!st) return false;
  return Date.now() - Number(st.heartbeat || 0) < TV_AI.aliveSec * 1000 && st.ok == true;
}

// kind: event | chat | idle
global.tvAiRequest = (player, kind, text) => {
  if (!tvAiAlive()) return false;
  let mem = tvMem(player);
  let now = Date.now();
  if (kind != "chat" && mem.aiLastAt && now - mem.aiLastAt < TV_AI.minGapSec * 1000) return false;
  if (kind == "chat" && mem.aiLastAt && now - mem.aiLastAt < 4000) return false;
  mem.aiTimes = (mem.aiTimes || []).filter((t) => now - t < 3600000);
  if (mem.aiTimes.length >= TV_AI.maxPerHour) return false;
  mem.aiTimes.push(now);
  mem.aiLastAt = now;
  TV_AI_STATE.seq++;
  let recent = mem.chat.slice(-8).map((l) => `${l.name}: ${l.msg}`);
  TV_AI_STATE.outbox.push({
    seq: TV_AI_STATE.seq,
    at: now,
    uuid: String(player.uuid),
    streamer: tvName(player),
    kind: kind,
    text: String(text),
    viewers: tvViewers(player),
    subs: tvSubs(player),
    dimension: String(player.level.dimension),
    recent: recent,
    names: global.TV_VIEWERS.map((v) => v.name),
  });
  if (TV_AI_STATE.outbox.length > 30) TV_AI_STATE.outbox = TV_AI_STATE.outbox.slice(-30);
  TV_AI_STATE.dirty = true;
  return true;
};

function tvAiFlush() {
  if (!TV_AI_STATE.dirty) return;
  TV_AI_STATE.dirty = false;
  try {
    JsonIO.write(tvAiPath("out.json"), { session: global.tvAiSession, requests: TV_AI_STATE.outbox });
  } catch (err) {
    console.error("[TheValley] AI out.json 쓰기 실패: " + err);
  }
}

function tvAiApply(server) {
  let data = tvAiReadJson("in.json");
  if (!data || String(data.session) != String(global.tvAiSession) || !data.responses) return;
  data.responses.forEach((r) => {
    let seq = Number(r.seq);
    if (seq <= TV_AI_STATE.lastApplied) return;
    TV_AI_STATE.lastApplied = Math.max(TV_AI_STATE.lastApplied, seq);
    let player = null;
    server.players.forEach((p) => {
      if (String(p.uuid) == String(r.uuid)) player = p;
    });
    if (!player || !tvIsOn(player)) return;
    let mem = tvMem(player);
    let colors = {};
    global.TV_VIEWERS.forEach((v) => (colors[v.name] = v.color));
    let delay = 0;
    (r.lines || []).forEach((l) => {
      let name = String(l.n || "").slice(0, 12) || tvRand(global.TV_VIEWERS).name;
      let msg = String(l.m || "").replace(/[§\n\r]/g, "").slice(0, 40);
      if (!msg) return;
      delay += 600 + Math.random() * 2200;
      mem.queue.push({ at: tvNow() + delay, name: name, color: colors[name] || "#CCCCCC", msg: msg });
    });
    // 요청이 처리됐으니 보낸 목록에서 제거
    TV_AI_STATE.outbox = TV_AI_STATE.outbox.filter((q) => q.seq > seq);
    TV_AI_STATE.dirty = true;
  });
}

// 서버가 켜질 때마다 새 세션 번호 (이전 답이 섞이지 않게)
global.tvAiSession = String(Date.now());

ServerEvents.tick((e) => {
  let server = e.server;
  if (server.tickCount % 20 != 0) return;
  try {
    if (Date.now() - TV_AI_STATE.statusReadAt > 5000) {
      TV_AI_STATE.status = tvAiReadJson("status.json");
      TV_AI_STATE.statusReadAt = Date.now();
    }
    tvAiFlush();
    tvAiApply(server);
  } catch (err) {
    console.error("[TheValley] AI tick error: " + err);
  }
});

// 재현(OP)만: /방송 ai → 사용량
global.tvAiStats = (player) => {
  let st = TV_AI_STATE.status;
  if (!st) {
    player.tell(Text.of("[AI] thevalley-ai.jar 신호가 없어요 (꺼져 있음). 템플릿 채팅만 쓰는 중.").gray());
    return 1;
  }
  let alive = tvAiAlive();
  let day = st.today || {};
  let month = st.month || {};
  [
    `§b[AI 채팅]§r ${alive ? "§a작동 중" : "§7꺼짐/중지"}${st.lastError ? " §c(" + st.lastError + ")" : ""}`,
    `§f오늘 §e${day.calls || 0}§f회 · 입력 ${tvFmt(day.inTok || 0)} / 출력 ${tvFmt(day.outTok || 0)} 토큰 · §e$${Number(day.usd || 0).toFixed(3)}§f / 한도 $${st.dailyLimitUsd}`,
    `§f이번 달 §e$${Number(month.usd || 0).toFixed(2)}§f / 한도 $${st.monthlyLimitUsd} (${month.calls || 0}회)`,
    "§7정확한 청구 금액은 Claude Console의 Usage·Cost 화면 기준이에요.",
  ].forEach((l) => player.tell(l));
  return 1;
};
