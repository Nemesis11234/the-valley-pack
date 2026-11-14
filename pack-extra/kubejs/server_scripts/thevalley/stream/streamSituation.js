// priority: 9
// The Valley 방송: 화면 상황에 맞춘 시청자 잡담 (템플릿)
// 평소 잡담의 대부분을 "지금 화면에 보이는 것"에 대한 반응으로 만든다.
// 주의: 이 Rhino는 블록({ }) 안의 const를 오류로 처리하고 Math.PI·Math.LN10 같은 상수가 없음. let만, 상수는 직접 숫자로.
// {p} 스트리머, {mob} 몹, {o} 근처 다른 플레이어, {item} 손에 든 것, {n} 숫자, {hp} 체력

// 진짜 방송 채팅처럼: 보이는 걸 읽어 주지 말고(❌ "평원이네", "양털 들고 뭐 함?"),
// 반응·드립·훈수·걱정·감탄으로. 짧게. {p}는 스트리머 이름 (방장이라고도 부름)
global.TV_SITUATION = {
  night: ["밤에 밖에 나가는 거 맞음?", "이 시간에 산책 ㅋㅋ 간 크네", "방장 침대 어디다 뒀어요", "밤엔 집에 있으라고요 ㅋㅋ", "아 불안해", "몹 스폰 시간인데", "이러다 크리퍼 만나지", "횃불 하나 없이 다니네 ㄷㄷ"],
  dawn: ["밤샘 성공 ㅋㅋ", "해 떴다 살았다", "드디어 아침", "밤 버텼네"],
  morning: ["오늘은 뭐 하나", "아침 루틴 ㄱㄱ", "물부터 주셈", "오늘 할 거 많다며"],
  evening: ["해 지는데 아직 밖이네 ㅋㅋ", "노을 미쳤다", "곧 밤인데 괜찮음?", "슬슬 집 가야 할 듯"],
  rain: ["비 오는 날은 낚시지 ㄹㅇ", "비 오면 물 안 줘도 되나?", "빗소리 ASMR", "감성 미쳤다", "비 맞으면서 일하는 방장 ㅠ"],
  snow: ["눈 온다 ㄷㄷ", "감성 미쳤다", "눈 오는 날 광산 ㄱ?", "추워 보여 ㅋㅋ"],
  thunder: ["번개 ㄷㄷ", "날씨 미쳤네", "이 날씨에 밖이라고?", "충전된 크리퍼 나오면 끝임", "피뢰침 있음?"],
  underground: ["광질 가자", "다이아 나와라 제발", "용암 조심요", "길 잃는 각", "횃불 박으면서 가요", "아 무섭다", "철이라도 나와라"],
  skull: ["해골광산 ㄷㄷ", "몇 층까지 가나 보자", "여기서 죽으면 손해 개큼", "폭탄 있음?", "오늘 신기록 각", "체력 관리 잘하셈"],
  high: ["떨어지면 끝 ㅋㅋ", "고소공포증 옴", "뷰 맛집 ㄹㅇ", "아 손에 땀 남"],
  water: ["수영 ㅋㅋ", "숨 조심요", "물속 무섭다", "보트 타요 보트"],
  low_hp: ["피 없어요!!", "피 {hp}칸 ㄷㄷㄷ", "도망쳐요 빨리", "먹어 먹어 뭐라도", "이러다 죽어", "아 심장 떨려", "힐 힐 힐", "이건 진짜 위험한데"],
  hungry: ["배고프다는데요 ㅋㅋ", "밥부터 먹어요", "허기 바 실화냐", "먹으면서 해요"],
  mob: ["{mob}!!", "{mob} 온다", "{mob} 잡아요", "앞에 {mob}", "{mob} ㅋㅋ 덤벼", "{mob} 처리 ㄱ"],
  mobs_many: ["몹 왜 이렇게 많음", "포위당했는데요?", "도망 ㄱㄱ", "이거 죽는 각", "몹 파티 ㅋㅋㅋ", "아 이건 무리"],
  creeper: ["크리퍼!!!", "크리퍼 크리퍼", "쉬이이익", "펑 하기 전에 튀어요", "아 크리퍼 ㅋㅋㅋ", "도망쳐!!"],
  animal: ["{mob} 귀여워", "{mob} 데려가요", "{mob} 이름 지어줘요", "{mob} 때리지 마요 ㅠ", "{mob} 키우자"],
  player: ["{o}님이다 ㅋㅋ", "{o}님 ㅎㅇ", "둘이 뭐 해요 ㅋㅋ", "{o}님 방송도 보는 중", "합방각?"],
  sleeping: ["잘 자요", "꿀잠 ㅋㅋ", "벌써 자?", "스킵 ㄱㄱ"],
  chopping: ["나무 다 밀겠네 ㅋㅋ", "벌목 장인", "나무 다시 심으셈", "숲 파괴범", "도끼질 리듬 좋다"],
  harvest: ["풍년이다", "출하하면 얼마임?", "수확 쾌감 ㄹㅇ", "농사 잘 됐네", "부자 되겠다"],
  digging: ["삽질 ㅋㅋ", "땅 파서 뭐 해요", "흙 부자"],
  planting: ["줄 맞춰 심어요", "이번엔 뭐 심음?", "물 주는 거 잊지 마셈", "농사 ㄱㄱ", "계절 맞는 거 맞죠?"],
  hold_rod: ["대물 가즈아", "낚시 타임", "이번엔 뭐 나올까", "타이밍 잘 봐요"],
  mining: ["광질 ASMR", "다이아 나와라", "곡괭이 리듬 좋다", "인벤 꽉 찰 듯", "광부 ㅋㅋ"],
  building: ["뭐 짓는 거임?", "건축가 등판", "집 이쁘게 해주셈", "설계도 있는 거죠?", "벌써 감 좋은데"],
  fighting: ["전투 폼 미쳤다", "학살 중 ㅋㅋ", "싸움 잘하네", "칼질 ㄷㄷ"],
  fishing: ["또 낚았다", "낚시 잘 되네", "낚시왕 ㅋㅋ", "도감 채우자"],
  still: ["방장 뭐 고민해요?", "렉 걸림?", "화면 멈춘 줄", "생각 중이신가 ㅋㅋ"],
  riding: ["{mob} 타고 다니네 ㅋㅋ", "이동 편하다", "부럽다"],
  winter: ["겨울엔 광산이지", "겨울이라 농사 쉼?", "온실 있어요?"],
  spring: ["봄 작물 뭐 심음?", "봄엔 농사지"],
  autumn: ["가을엔 호박이지", "수확 시즌 ㄱㄱ"],
  summer: ["여름 작물 ㄱㄱ"],
  biome_desert: ["사막 ㄷㄷ 물 챙겼음?", "선인장 조심"],
  biome_swamp: ["늪 음침하다", "마녀 나오는 데"],
  biome_cherry: ["벚꽃 미쳤다", "여기 집 짓자 제발"],
  biome_mountain: ["등산 ㅋㅋ", "경치 미쳤다"],
};

// 채팅 따라 치기: 누가 웃거나 놀라면 다른 사람도 따라 침 (진짜 채팅창처럼)
global.TV_ECHO = ["ㅋㅋㅋㅋ", "ㅋㅋㅋㅋㅋㅋ", "ㄹㅇㅋㅋ", "ㅇㅈ", "ㄷㄷ", "ㄹㅇ", "아 ㅋㅋ", "ㅋㅋㅋ 개웃기네", "이거지"];

// 영어 이름 → 한국어 (서버는 영어 이름을 줌)
const TV_SIT_MOB_KO = {
  zombie: "좀비", skeleton: "스켈레톤", creeper: "크리퍼", spider: "거미", "cave spider": "동굴거미", enderman: "엔더맨", slime: "슬라임",
  witch: "마녀", drowned: "드라운드", husk: "허스크", stray: "스트레이", phantom: "팬텀", pillager: "약탈자", "zombie villager": "좀비 주민",
  "magma cube": "마그마 큐브", blaze: "블레이즈", ghast: "가스트", bat: "박쥐", silverfish: "좀벌레", vindicator: "변명자", ravager: "파괴수",
  cow: "소", chicken: "닭", sheep: "양", pig: "돼지", horse: "말", donkey: "당나귀", rabbit: "토끼", cat: "고양이", wolf: "늑대", fox: "여우",
  goat: "염소", llama: "라마", parrot: "앵무새", turtle: "거북", frog: "개구리", bee: "벌", duck: "오리",
};

function tvSitKo(name) {
  let k = String(name).toLowerCase();
  return TV_SIT_MOB_KO[k] || null;
}

function tvSitSafe(fn, fallback) {
  try {
    let v = fn();
    return v == null ? fallback : v;
  } catch (err) {
    return fallback;
  }
}

// 화면에 보이는지: 바라보는 방향 앞쪽(좌우 약 60도 안)이고, 벽에 가려지지 않았을 때만
// (등 뒤나 벽 너머 몹을 시청자가 미리 알고 말하지 않게)
function tvSeen(player, e) {
  try {
    let dx = Number(e.x) - Number(player.x);
    let dz = Number(e.z) - Number(player.z);
    let dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > 2) {
      let yaw = (Number(player.yRot) * 3.141592653589793) / 180;
      let dot = (dx * -Math.sin(yaw) + dz * Math.cos(yaw)) / dist;
      if (dot < 0.5) return false;
    }
    if (typeof player.hasLineOfSight === "function" && !player.hasLineOfSight(e)) return false;
    return true;
  } catch (err) {
    return false;
  }
}

// 지금 화면 상황 → [{k: 상황 이름, w: 가중치, v: 채울 값}]
function tvSituations(player) {
  let out = [];
  let add = (k, w, v) => {
    if (global.TV_SITUATION[k]) out.push({ k: k, w: w, v: v || {} });
  };
  let level = player.level;
  let dim = String(level.dimension);
  let y = Math.floor(Number(player.y) || 64);
  let sky = tvSitSafe(() => !!player.block.canSeeSky, true);
  let outside = sky && dim == "minecraft:overworld";

  // 장소
  if (dim == "society:skull_cavern") add("skull", 5);
  else if (!sky && y < 50) add("underground", 4);
  if (y > 130) add("high", 2);
  if (tvSitSafe(() => player.isInWater(), false)) add("water", 4);

  if (tvSitSafe(() => player.isSleeping(), false)) {
    add("sleeping", 10);
    return out;
  }

  // 시간·날씨
  let t = tvSitSafe(() => Number(player.server.overworld().getDayTime()) % 24000, 6000);
  if (outside) {
    if (t >= 13000 && t < 23000) add("night", 3);
    else if (t >= 23000 || t < 1000) add("dawn", 2);
    else if (t < 4000) add("morning", 1);
    let biomeId = tvSitSafe(() => String(player.block.biomeId), "");
    let dry = /desert|badlands|savanna/.test(biomeId);
    let snowy = /snow|frozen|ice|grove|peak/.test(biomeId) || tvSitSafe(() => String(global.getSeasonFromLevel(player.server.overworld())), "") == "winter";
    let raining = !dry && tvSitSafe(() => level.isRaining(), false);
    if (raining) {
      if (snowy) add("snow", 3);
      else if (tvSitSafe(() => level.isThundering(), false)) add("thunder", 4);
      else add("rain", 3);
    }
    if (!raining && t >= 11500 && t < 13000) add("evening", 2); // 노을은 맑을 때만
  }

  // 계절 (바깥일 때 가끔)
  if (outside) {
    let season = tvSitSafe(() => String(global.getSeasonFromLevel(player.server.overworld())), "");
    if (season) add(season, 0.3);
  }

  // 바이옴
  if (outside) {
    let b = tvSitSafe(() => String(player.block.biomeId), "");
    let bk = null;
    if (/desert|badlands/.test(b)) bk = "biome_desert";
    else if (/snow|frozen|ice|grove/.test(b)) bk = "biome_snow";
    else if (/ocean|beach/.test(b)) bk = "biome_ocean";
    else if (/cherry/.test(b)) bk = "biome_cherry";
    else if (/jungle/.test(b)) bk = "biome_jungle";
    else if (/swamp|mangrove/.test(b)) bk = "biome_swamp";
    else if (/peak|mountain|hill|slope/.test(b)) bk = "biome_mountain";
    else if (/forest|taiga|wood/.test(b)) bk = "biome_forest";
    else if (/plains|meadow|savanna/.test(b)) bk = "biome_plains";
    if (bk) add(bk, 0.4);
  }

  // 몸 상태
  let hp = Number(player.health) || 20;
  if (hp <= 6) add("low_hp", 8, { hp: Math.max(1, Math.ceil(hp / 2)) });
  let food = tvSitSafe(() => Number(tvG(tvG(player, "foodData", "getFoodData"), "foodLevel", "getFoodLevel")), 20);
  if (food <= 6) add("hungry", 4);
  if (tvSitSafe(() => player.isCrouching(), false)) add("crouch", 1);
  let vehicle = tvSitSafe(() => tvG(player, "vehicle", "getVehicle"), null);
  if (vehicle) add("riding", 3, { mob: tvSitSafe(() => tvEntityName(vehicle), null) || "탈 것" });

  // 주변 (16칸)
  let near = tvSitSafe(() => {
    let r = { mobs: {}, mobCount: 0, animals: {}, players: [], creeper: false };
    level.getEntitiesWithin(player.boundingBox.inflate(16)).forEach((e) => {
      if (e == player || !e.isLiving()) return;
      if (!tvSeen(player, e)) return;
      if (e.isPlayer()) {
        r.players.push(String(e.username));
        return;
      }
      let en = String(e.displayName.string);
      let ko = tvSitKo(en) || tvEntityName(e);
      if (!/[가-힣]/.test(ko)) ko = null; // 한국어 이름을 모르면 그냥 "몹"
      let tkey = String(e.type);
      if (/armor_stand|villager|wandering_trader|golem|npc|mannequin|statue/.test(tkey)) return; // 갑옷 거치대·주민·NPC는 반응 안 함
      if (e.isMonster()) {
        r.mobCount++;
        if (/creeper/i.test(en)) r.creeper = true;
        let n = ko || "몹";
        r.mobs[n] = (r.mobs[n] || 0) + 1;
      } else if (ko) {
        r.animals[ko] = (r.animals[ko] || 0) + 1;
      }
    });
    return r;
  }, null);
  if (near) {
    if (near.creeper) add("creeper", 7);
    let mobNames = Object.keys(near.mobs);
    if (near.mobCount >= 4) add("mobs_many", 6, { n: near.mobCount });
    else if (mobNames.length) add("mob", 5, { mob: tvRand(mobNames) });
    let animalNames = Object.keys(near.animals);
    if (animalNames.length) add("animal", 1.5, { mob: tvRand(animalNames) });
    if (near.players.length) add("player", 2, { o: tvRand(near.players) });
  }

  // 손에 든 것
  let held = tvSitSafe(() => {
    let st = player.mainHandItem;
    if (st.isEmpty()) return { id: "", name: "" };
    return { id: String(st.id), name: tvStackName(st) };
  }, null);
  if (held && /fishing_rod/.test(held.id)) add("hold_rod", 1); // 손에 든 걸 읽어 주는 채팅은 안 함 (낚싯대만)

  // 최근 1분 반 동안 한 일
  let acts = tvSitSafe(() => {
    let r = tvMem(player).recentActs || {};
    tvRecentPrune(r, tvNow());
    return r;
  }, {});
  let sum = { mine: 0, chop: 0, harvest: 0, dig: 0, place: 0, plant: 0, kill: 0, fish: 0 };
  Object.keys(acts).forEach((k) => {
    let n = Number(acts[k].n) || 0;
    if (k.indexOf("캔 블록") == 0) sum.mine += n;
    else if (k.indexOf("벤 나무") == 0) sum.chop += n;
    else if (k.indexOf("수확") == 0) sum.harvest += n;
    else if (k.indexOf("판 흙") == 0) sum.dig += n;
    else if (k.indexOf("놓은 블록") == 0) sum.place += n;
    else if (k.indexOf("심은 작물") == 0) sum.plant += n;
    else if (k.indexOf("처치") == 0) sum.kill += n;
    else if (k.indexOf("낚음") == 0) sum.fish += n;
  });
  if (sum.mine >= 8) add("mining", 3, { n: sum.mine });
  if (sum.chop >= 6) add("chopping", 3, { n: sum.chop });
  if (sum.harvest >= 6) add("harvest", 3, { n: sum.harvest });
  if (sum.dig >= 10) add("digging", 2);
  if (sum.place >= 8) add("building", 3, { n: sum.place });
  if (sum.plant >= 6) add("planting", 3);
  if (sum.kill >= 4) add("fighting", 3, { n: sum.kill });
  if (sum.fish >= 1) add("fishing", 3);

  // 가만히 있음 (1분 이상, 잠수 전)
  let idle = tvSitSafe(() => tvAfkSec(player), 0);
  if (idle > 60 && sum.fish == 0 && !(held && /fishing_rod/.test(held.id))) add("still", 3);

  return out;
}

// 화면 상황 반응 n줄을 spread초에 걸쳐. 상황이 하나도 없으면 false
function tvSituationChat(player, count, spreadSec) {
  if (!tvIsOn(player)) return false;
  let sits = tvSituations(player);
  if (!sits.length) return false;
  let mem = tvMem(player);
  let recent = {};
  mem.chat.slice(-15).forEach((l) => (recent[String(l.msg)] = 1));
  mem.queue.forEach((q) => (recent[String(q.msg)] = 1));
  // 5분 안에 쓴 문장은 다시 안 씀 (화면이 계속 같을 때 같은 말 반복 방지)
  mem.sitUsed = mem.sitUsed || {};
  Object.keys(mem.sitUsed).forEach((k) => {
    if (tvNow() - mem.sitUsed[k] > 300000) delete mem.sitUsed[k];
    else recent[k] = 1;
  });
  // 방금(1분 안) 쓴 상황은 덜 나오게
  mem.sitLast = mem.sitLast || {};
  let nowMs = tvNow();
  sits.forEach((s) => {
    if (mem.sitLast[s.k] && nowMs - mem.sitLast[s.k] < 60000) s.w *= 0.25;
  });
  let total = 0;
  sits.forEach((s) => (total += s.w));
  let pushed = 0;
  for (let i = 0; i < count; i++) {
    let r = Math.random() * total;
    let pick = sits[sits.length - 1];
    for (let j = 0; j < sits.length; j++) {
      r -= sits[j].w;
      if (r <= 0) {
        pick = sits[j];
        break;
      }
    }
    mem.sitLast[pick.k] = nowMs;
    let lines = global.TV_SITUATION[pick.k];
    let fv = { p: tvName(player) };
    Object.keys(pick.v).forEach((k) => (fv[k] = pick.v[k]));
    let msg = tvFill(tvRand(lines), fv);
    let tries = 0;
    while (recent[msg] && tries++ < 6) msg = tvFill(tvRand(lines), fv);
    if (recent[msg]) continue;
    pushed++;
    recent[msg] = 1;
    mem.sitUsed[msg] = tvNow();
    let viewer = tvPickViewer(player);
    let at = tvNow() + Math.random() * (spreadSec || 4) * 1000;
    mem.queue.push({ at: at, name: viewer.name, color: viewer.color, msg: msg });
    tvEcho(player, at, viewer.name, 0.2);
  }
  return pushed > 0; // 새로 할 말이 없으면 false → 일반 잡담으로
}

// 채팅 따라 치기: chance 확률로 다른 시청자 1~2명이 "ㅋㅋㅋ", "ㄹㅇ" 같은 걸 이어서 침
function tvEcho(player, at, fromName, chance) {
  if (Math.random() >= chance) return;
  let mem = tvMem(player);
  let n = Math.random() < 0.3 ? 2 : 1;
  for (let i = 0; i < n; i++) {
    let v = tvPickViewer(player);
    if (v.name == fromName) continue;
    mem.queue.push({ at: at + 700 + Math.random() * 1500 + i * 600, name: v.name, color: v.color, msg: tvRand(global.TV_ECHO) });
  }
}
