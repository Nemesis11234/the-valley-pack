// priority: 7
// The Valley 방송: 스트리머가 채팅으로 시청자에게 부탁하면
//  - 공짜 부탁(ㅋㅋ 쳐줘, 1 쳐봐, 인사해, 투표)은 잘 들어줌 → 채팅 물결
//  - 조용히 해 → 잠깐 조용하다 다시 떠듦
//  - 미션·사연 줘 → 가끔 진짜로 줌 (쿨타임)
//  - 후원·선물 구걸 → 가끔 먹힘. 30분 안에 자주 조르면 안 먹히고 시청자가 빠짐 (역효과)
// 주의: 이 Rhino는 블록({ }) 안의 const를 오류로 처리함. let만.

const TV_ASK = {
  begWindowMin: 30, // 구걸 횟수를 세는 시간
  begSuccess: [0.35, 0.15, 0], // 30분 안에 1번째·2번째·3번째 이상 구걸이 먹힐 확률
  begBacklashFrom: 3, // 이 횟수부터 역효과 (시청자 감소)
  giftSuccess: [0.25, 0.1, 0],
  missionAskCooldownSec: 300,
  subAskCooldownSec: 600,
  quietSec: 25,
};

global.TV_ASK_LINES = {
  greet: ["ㅎㅇ", "안녕하세요", "하이", "ㅎㅇㅎㅇ", "왔어요", "안뇽", "ㅎㅇ요", "하이하이"],
  quiet: ["넵", "...", "쉿", "ㅇㅋ", "조용"],
  quiet_after: ["조용히 하라며 ㅋㅋ", "못 참겠다", "근데 말이야", "아 심심해 ㅋㅋ"],
  mission_ok: ["오 미션 ㄱㄱ", "그럼 이거 해봐", "미션 드림 ㅋㅋ"],
  mission_no: ["방금 했잖아 ㅋㅋ", "미션 중독이냐", "좀 쉬어요 ㅋㅋ"],
  beg_ok: ["불쌍해서 줌 ㅋㅋ", "옜다", "구걸 성공 ㅋㅋ", "이번만이다", "ㅋㅋ 줬다"],
  beg_no: ["구걸 ㄴㄴ ㅋㅋ", "방장 거지됐네 ㅋㅋ", "알바나 해요", "통장 비었냐 ㅋㅋ", "후원은 마음이 움직여야 함", "싫은데요 ㅋㅋ"],
  beg_donate: ["불쌍해서 보냄 ㅋㅋ", "이번만이다", "밥은 먹고 해요", "구걸 성공 축하 ㅋㅋ", "옜다 받아라", "다음엔 안 줌"],
  beg_backlash: ["또 구걸함 ㅋㅋ", "구걸 방송 ㄴㄴ", "아 이건 좀;", "나감 ㅂㅂ", "방장 오늘 왜 이럼", "구걸만 하네", "다른 방송 보러 감"],
  gift_ok: ["옜다 이거라도", "선물 보냄 ㅋㅋ", "불쌍해서 하나 줌"],
  gift_no: ["직접 캐요 ㅋㅋ", "선물은 아무나 받나", "노동해라 ㅋㅋ"],
  sub_ok: ["구독 박음", "구독 눌렀어요", "ㅇㅋ 구독", "팔로우 함"],
  sub_no: ["이미 했는데요 ㅋㅋ", "구독 구걸 ㄴㄴ", "아까도 말했잖아 ㅋㅋ"],
  vote_result: ["{w}번 압승 ㅋㅋ", "{w}번이 이김", "투표 결과 {w}번", "{w}번 ㄱㄱ"],
};

function tvAskPush(player, lines, n, spread, delay) {
  let mem = tvMem(player);
  let used = {};
  for (let i = 0; i < n; i++) {
    let line = tvRand(lines);
    for (let k = 0; k < 4 && used[line] && lines.length > n; k++) line = tvRand(lines);
    used[line] = 1;
    let v = tvPickViewer(player);
    mem.queue.push({ at: tvNow() + (delay || 800) + Math.random() * (spread || 3000), name: v.name, color: v.color, msg: line });
  }
}

// 시청자 규모에 따른 물결 줄 수 (최대 8줄)
function tvAskWave(player, base) {
  return Math.min(8, base + tvCrowdTier(player) * 2 + Math.floor(Math.random() * 2));
}

// 스트리머 채팅이 부탁이면 처리하고 true
function tvStreamerAsk(player, msg) {
  let m = msg.replace(/\s+/g, " ");
  let mem = tvMem(player);
  let now = tvNow();
  let ai = (type, outcome) => global.tvAiRequest && global.tvAiRequest(player, "chat", msg, { request: type, outcome: outcome });

  // 숫자 투표: "1이면 광산 2면 낚시", "1 광산 2 낚시"
  if (/1\s*(이면|번|:)?.{0,12}2\s*(이면|번|:)?/.test(m) && /(이면|투표|골라|뭐 할|뭐할|선택)/.test(m)) {
    let opts = /3\s*(이면|번|:)/.test(m) ? 3 : 2;
    let n = tvAskWave(player, 4);
    let votes = {};
    for (let i = 0; i < n; i++) {
      let pick = 1 + Math.floor(Math.random() * opts);
      votes[pick] = (votes[pick] || 0) + 1;
      let v = tvPickViewer(player);
      mem.queue.push({ at: now + 700 + Math.random() * 3500, name: v.name, color: v.color, msg: Math.random() < 0.7 ? String(pick) : `${pick}번` });
    }
    let w = Object.keys(votes).sort((a, b) => votes[b] - votes[a])[0];
    let v = tvPickViewer(player);
    mem.queue.push({ at: now + 6000, name: v.name, color: v.color, msg: tvFill(tvRand(global.TV_ASK_LINES.vote_result), { w: w }) });
    return true;
  }
  // "1 쳐봐", "2 쳐줘"
  let num = m.match(/([0-9]{1,3})\s*(쳐|쳐줘|쳐봐|ㄱ|입력)/);
  if (num) {
    let n = tvAskWave(player, 4);
    let lines = [];
    for (let i = 0; i < n; i++) lines.push(Math.random() < 0.85 ? num[1] : tvRand(["?", "ㅋㅋ", num[1] + num[1]]));
    tvAskPush(player, lines, n, 3000, 600);
    return true;
  }
  // "ㅋㅋ 쳐줘", "웃어줘"
  if (/ㅋ{2,}.{0,3}(쳐|쳐줘|쳐봐)|웃어 ?(줘|봐)/.test(m)) {
    tvAskPush(player, global.TV_WAVE.filter((l) => l.indexOf("ㅋ") >= 0).concat(["ㅋㅋㅋㅋㅋㅋ", "ㅋㅋㅋ"]), tvAskWave(player, 4), 3000, 500);
    return true;
  }
  // "인사해", "다들 ㅎㅇ"
  if (/(인사|ㅎㅇ|하이|안녕).{0,6}(해|해줘|해봐|쳐)|다들 (ㅎㅇ|하이|안녕)/.test(m)) {
    tvAskPush(player, global.TV_ASK_LINES.greet, tvAskWave(player, 4), 3500, 600);
    return true;
  }
  // "조용히 해"
  if (/조용|그만 ?쳐|채팅 ?그만/.test(m)) {
    tvAskPush(player, global.TV_ASK_LINES.quiet, 2, 1500, 500);
    mem.quietUntil = now + TV_ASK.quietSec * 1000;
    let v = tvPickViewer(player);
    mem.queue.push({ at: mem.quietUntil + 1000, name: v.name, color: v.color, msg: tvRand(global.TV_ASK_LINES.quiet_after) });
    return true;
  }
  // "미션 줘", "사연 줘"
  if (/(미션|사연).{0,4}(줘|ㄱ|주세요|내줘|있어)/.test(m)) {
    if (!mem.mission && (!mem.lastMissionAsk || now - mem.lastMissionAsk > TV_ASK.missionAskCooldownSec * 1000) && Math.random() < 0.7) {
      mem.lastMissionAsk = now;
      tvAskPush(player, global.TV_ASK_LINES.mission_ok, 1, 1000, 500);
      if (m.indexOf("사연") >= 0) tvRequestStart(player);
      else tvMissionStart(player);
    } else {
      tvAskPush(player, global.TV_ASK_LINES.mission_no, 2, 2500, 700);
    }
    return true;
  }
  // 후원 구걸
  if (/(후원|도네|치즈|별풍).{0,6}(좀|줘|해줘|주세요|해주세요|plz|ㅠ)|(후원|도네) ?(ㄱ|부탁)|돈.{0,3}(줘|주세요)/.test(m) && !/감사|고마/.test(m)) {
    mem.begTimes = (mem.begTimes || []).filter((t) => now - t < TV_ASK.begWindowMin * 60000);
    mem.begTimes.push(now);
    let count = mem.begTimes.length;
    let chance = TV_ASK.begSuccess[Math.min(count, TV_ASK.begSuccess.length) - 1];
    if (count >= TV_ASK.begBacklashFrom) {
      // 역효과: 시청자가 빠짐
      tvChange(player, -6 * count, 0, `후원 구걸 ${count}번째 (역효과)`);
      if (!ai("후원 구걸", "역효과: 너무 자주 졸라서 시청자들이 짜증내고 일부 나감")) tvAskPush(player, global.TV_ASK_LINES.beg_backlash, 3, 3500, 700);
    } else if (Math.random() < chance) {
      tvAskPush(player, global.TV_ASK_LINES.beg_ok, 1, 800, 400);
      player.server.scheduleInTicks(40, () => tvDonate(player, { begged: true }));
      if (Math.random() < 0.4) player.server.scheduleInTicks(80, () => tvDonate(player, { begged: true }));
    } else {
      if (!ai("후원 구걸", "거절: 놀리면서 안 줌")) tvAskPush(player, global.TV_ASK_LINES.beg_no, 2, 3000, 700);
    }
    return true;
  }
  // 선물(아이템) 구걸
  if (/(선물|아이템|템).{0,3}(줘|주세요|좀 ?줘|좀 ?주세요|보내 ?줘)/.test(m)) {
    mem.begTimes = (mem.begTimes || []).filter((t) => now - t < TV_ASK.begWindowMin * 60000);
    mem.begTimes.push(now);
    let count = mem.begTimes.length;
    let chance = TV_ASK.giftSuccess[Math.min(count, TV_ASK.giftSuccess.length) - 1];
    if (count >= TV_ASK.begBacklashFrom) {
      tvChange(player, -5 * count, 0, `선물 구걸 ${count}번째 (역효과)`);
      tvAskPush(player, global.TV_ASK_LINES.beg_backlash, 3, 3500, 700);
    } else if (Math.random() < chance) {
      tvAskPush(player, global.TV_ASK_LINES.gift_ok, 1, 800, 400);
      mem.lastGift = 0;
      mem.forceGift = true;
    } else {
      tvAskPush(player, global.TV_ASK_LINES.gift_no, 2, 3000, 700);
    }
    return true;
  }
  // 구독 부탁
  if (/(구독|팔로우).{0,6}(눌러|해줘|박아|부탁|좀|해주세요)/.test(m)) {
    if (!mem.lastSubAsk || now - mem.lastSubAsk > TV_ASK.subAskCooldownSec * 1000) {
      mem.lastSubAsk = now;
      tvAskPush(player, global.TV_ASK_LINES.sub_ok, 2, 3000, 800);
      if (Math.random() < 0.4) tvChange(player, 0, 1, "구독 부탁");
    } else {
      tvAskPush(player, global.TV_ASK_LINES.sub_no, 2, 3000, 800);
    }
    return true;
  }
  return false;
}

// 조용히 하라고 했으면 잠깐 평소 잡담 멈춤 (stream.js가 확인)
function tvIsQuiet(player) {
  let mem = tvMem(player);
  return mem.quietUntil && tvNow() < mem.quietUntil;
}
