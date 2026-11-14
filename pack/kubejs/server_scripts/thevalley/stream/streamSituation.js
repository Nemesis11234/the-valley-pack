// priority: 9
// The Valley 방송: 화면 상황에 맞춘 시청자 잡담 (템플릿)
// 평소 잡담의 대부분을 "지금 화면에 보이는 것"에 대한 반응으로 만든다.
// 주의: 이 Rhino는 블록({ }) 안의 const를 오류로 처리하고 Math.PI·Math.LN10 같은 상수가 없음. let만, 상수는 직접 숫자로.
// {p} 스트리머, {mob} 몹, {o} 근처 다른 플레이어, {item} 손에 든 것, {n} 숫자, {hp} 체력

global.TV_SITUATION = {
  night: ["밤인데 밖에 있네", "밤엔 몹 나와요 조심", "어두워서 잘 안 보임", "횃불 좀 들고 다녀요", "밤샘각?", "슬슬 자러 가야 하는 거 아님?", "밤 되니까 분위기 무섭다", "이 시간에 돌아다니는 거 맞음?", "침대 어딨음"],
  dawn: ["벌써 아침이네", "해 뜬다", "새벽 감성 ㄱㅊ", "날 밝았다 이제 일하자"],
  morning: ["아침부터 부지런하네", "오늘 할 일 정리 ㄱㄱ", "아침엔 농장 먼저 아님?", "날씨 좋을 때 많이 해놔요"],
  evening: ["해 진다 슬슬 들어가요", "노을 이쁘다", "곧 밤이다", "저녁 되기 전에 정리 ㄱㄱ"],
  rain: ["비 온다", "비 오는 날은 낚시지", "비 오면 물 안 줘도 됨 개꿀", "빗소리 좋다", "우산 없음?", "비 맞으면서 일하네 ㅋㅋ"],
  thunder: ["천둥 친다 ㄷㄷ", "번개 맞을 듯", "날씨 미쳤네", "이 날씨에 밖에 있는 거 실화?", "크리퍼 번개 맞으면 큰일남"],
  underground: ["지하 들어왔네", "동굴 탐험 ㄱㄱ", "광석 찾자", "용암 조심", "길 잃지 마요", "횃불 꼭 박아요", "다이아 나와라", "여기 어디임"],
  skull: ["해골광산이다 ㄷㄷ", "몇 층까지 감?", "폭탄 챙겼어요?", "체력 관리 잘해요", "여기서 죽으면 손해 큼", "깊이 내려가자", "보물 상자 나와라"],
  high: ["높다 ㄷㄷ", "떨어지면 끝", "뷰 맛집", "고소공포증 옴", "여기서 보니까 맵 넓다"],
  water: ["수영 중 ㅋㅋ", "물에 빠짐?", "숨 조심", "물고기 많아 보이는데", "보트 타요 보트"],
  low_hp: ["피 없어요!!", "체력 {hp}칸 ㄷㄷ", "도망쳐요", "뭐 좀 먹어요 빨리", "죽는 각 아님?", "아 불안하다", "힐 힐"],
  hungry: ["배고파 보임", "밥 먹어요 밥", "허기 바 깜빡이는 중", "뭐라도 먹어요", "배고프면 체력 안 참"],
  mob: ["{mob} 있다", "옆에 {mob} 조심", "{mob} 잡아요", "{mob} 뒤에 있음!!", "{mob} 보임?", "{mob} 피해요"],
  mobs_many: ["몹 너무 많은데?", "포위당함 ㄷㄷ", "도망 ㄱㄱ", "이거 위험한데", "{n}마리는 무리임", "몹 파티 ㅋㅋ"],
  creeper: ["크리퍼!!!", "크리퍼 뒤에 있어요", "펑 하기 전에 도망", "크리퍼 조심 진짜", "쉬이이익"],
  animal: ["{mob} 귀엽다", "{mob} 키워요?", "{mob} 데려가요", "{mob} 이름 지어줘요", "{mob} 때리지 마요 ㅠ"],
  player: ["{o}님 옆에 있네", "{o}님이랑 같이 하는 중?", "합동 작업 ㄱㄱ", "{o}님 뭐 하는 중임?", "{o}님 안녕하세요 ㅋㅋ"],
  hold_pickaxe: ["곡괭이 들었다 광질 ㄱㄱ", "광산 가는 거임?", "곡괭이 내구도 괜찮음?"],
  hold_axe: ["나무 베러 감?", "도끼 들었네", "나무 다시 심어요"],
  hold_sword: ["칼 들었다 싸우러 감?", "전투 모드", "칼 좋아 보이는데"],
  hold_hoe: ["밭 가는 중?", "농사 ㄱㄱ", "괭이 장인"],
  hold_rod: ["낚시 ㄱㄱ", "물고기 뭐 나올까", "낚시 타이밍 중요함", "대물 가즈아"],
  hold_water: ["물 주는 중", "작물 물 다 줬어요?", "물뿌리개 ㄱ"],
  hold_seed: ["씨 심어요?", "뭐 심는 거임", "이번 계절에 맞는 씨임?"],
  hold_empty: ["맨손이네", "손에 아무것도 없음 ㅋㅋ", "뭐 할지 고민 중?"],
  hold_item: ["{item} 들고 뭐 함?", "{item} 어디다 쓰는 거임", "오 {item}"],
  mining: ["캐는 속도 빠르다", "{n}개째 캐는 중 ㅋㅋ", "광질 장인", "인벤 꽉 차겠다", "곡괭이 소리 좋다"],
  building: ["건축 중이네", "뭐 짓는 거임?", "블록 {n}개째 ㅋㅋ", "집 이쁘게 해줘요", "설계도 있음?"],
  fighting: ["싸움 잘하네", "{n}마리 잡음 ㅋㅋ", "학살 중", "전투 재밌다"],
  fishing: ["낚시 잘 되네", "또 낚았다", "물고기 몇 마리째임", "도감 채우는 중?"],
  still: ["멍때리는 중?", "뭐 고민해요?", "화면 멈춘 줄", "생각 중이신가"],
  crouch: ["왜 웅크림 ㅋㅋ", "숨는 중?", "살금살금"],
  riding: ["{mob} 타고 다니네", "이동 편하다", "탈 것 부럽"],
  spring: ["봄이라 씨 심기 좋다", "봄 작물 뭐 심음?", "꽃 핀다"],
  summer: ["여름이다", "여름 작물 수확 ㄱ", "더워 보임 ㅋㅋ"],
  autumn: ["가을이네", "가을엔 호박이지", "수확 시즌"],
  winter: ["겨울이라 농사 못 함?", "눈 온다", "겨울엔 광산이지", "온실 있어요?"],
  biome_desert: ["사막이다", "선인장 조심", "물 챙겨요"],
  biome_snow: ["눈밭이다", "춥겠다", "설경 이쁘다"],
  biome_ocean: ["바다다", "바다 낚시 ㄱ", "물 많다"],
  biome_forest: ["숲이네", "나무 많다", "숲에서 길 잃기 쉬움"],
  biome_jungle: ["정글이다", "앵무새 찾자", "덩굴 많네"],
  biome_swamp: ["늪이다 마녀 조심", "슬라임 나오는 곳", "여기 음침하다"],
  biome_cherry: ["벚꽃 이쁘다", "여기 집 짓자", "분위기 좋다"],
  biome_plains: ["평원이네", "땅 넓다 농장 하기 좋겠다", "여기 집터 좋다"],
  biome_mountain: ["산이다", "등산 중 ㅋㅋ", "경치 좋다"],
};

// 영어 이름 → 한국어 (서버는 영어 이름을 줌)
const TV_SIT_MOB_KO = {
  zombie: "좀비", skeleton: "스켈레톤", creeper: "크리퍼", spider: "거미", "cave spider": "동굴거미", enderman: "엔더맨", slime: "슬라임",
  witch: "마녀", drowned: "드라운드", husk: "허스크", stray: "스트레이", phantom: "팬텀", pillager: "약탈자", "zombie villager": "좀비 주민",
  "magma cube": "마그마 큐브", blaze: "블레이즈", ghast: "가스트", bat: "박쥐", silverfish: "좀벌레", vindicator: "변명자", ravager: "파괴수",
  cow: "소", chicken: "닭", sheep: "양", pig: "돼지", horse: "말", donkey: "당나귀", rabbit: "토끼", cat: "고양이", wolf: "늑대", fox: "여우",
  goat: "염소", llama: "라마", parrot: "앵무새", turtle: "거북", frog: "개구리", bee: "벌", duck: "오리", villager: "주민", boat: "보트", minecart: "광산수레",
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

  // 시간·날씨
  let t = tvSitSafe(() => Number(player.server.overworld().getDayTime()) % 24000, 6000);
  if (outside) {
    if (t >= 13000 && t < 23000) add("night", 3);
    else if (t >= 23000 || t < 1000) add("dawn", 2);
    else if (t < 4000) add("morning", 1);
    else if (t >= 11500) add("evening", 2);
    if (tvSitSafe(() => level.isThundering(), false)) add("thunder", 4);
    else if (tvSitSafe(() => level.isRaining(), false)) add("rain", 3);
  }

  // 계절 (바깥일 때 가끔)
  if (outside) {
    let season = tvSitSafe(() => String(global.getSeasonFromLevel(player.server.overworld())), "");
    if (season) add(season, 0.7);
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
    if (bk) add(bk, 0.8);
  }

  // 몸 상태
  let hp = Number(player.health) || 20;
  if (hp <= 6) add("low_hp", 8, { hp: Math.max(1, Math.ceil(hp / 2)) });
  let food = tvSitSafe(() => Number(tvG(tvG(player, "foodData", "getFoodData"), "foodLevel", "getFoodLevel")), 20);
  if (food <= 6) add("hungry", 4);
  if (tvSitSafe(() => player.isCrouching(), false)) add("crouch", 1);
  let vehicle = tvSitSafe(() => tvG(player, "vehicle", "getVehicle"), null);
  if (vehicle) add("riding", 3, { mob: tvSitSafe(() => tvSitKo(vehicle.displayName.string), null) || "탈 것" });

  // 주변 (16칸)
  let near = tvSitSafe(() => {
    let r = { mobs: {}, mobCount: 0, animals: {}, players: [], creeper: false };
    level.getEntitiesWithin(player.boundingBox.inflate(16)).forEach((e) => {
      if (e == player || !e.isLiving()) return;
      if (e.isPlayer()) {
        r.players.push(String(e.username));
        return;
      }
      let en = String(e.displayName.string);
      let ko = tvSitKo(en);
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
    return { id: String(st.id), name: String(st.hoverName.string).replace(/[\[\]]/g, "") };
  }, null);
  if (held) {
    let id = held.id;
    if (!id) add("hold_empty", 0.6);
    else if (/pickaxe/.test(id)) add("hold_pickaxe", 1.5);
    else if (/_axe/.test(id)) add("hold_axe", 1.5);
    else if (/sword/.test(id)) add("hold_sword", 1.5);
    else if (/_hoe/.test(id)) add("hold_hoe", 1.5);
    else if (/fishing_rod|_rod/.test(id)) add("hold_rod", 2);
    else if (/watering_can/.test(id)) add("hold_water", 2);
    else if (/seed/.test(id)) add("hold_seed", 1.5);
    else if (held.name && held.name.length <= 14) add("hold_item", 1, { item: held.name });
  }

  // 최근 1분 반 동안 한 일
  let acts = tvSitSafe(() => {
    let r = tvMem(player).recentActs || {};
    tvRecentPrune(r, tvNow());
    return r;
  }, {});
  let sum = { mine: 0, place: 0, kill: 0, fish: 0 };
  Object.keys(acts).forEach((k) => {
    let n = Number(acts[k].n) || 0;
    if (k.indexOf("캔 블록") == 0) sum.mine += n;
    else if (k.indexOf("놓은 블록") == 0) sum.place += n;
    else if (k.indexOf("처치") == 0) sum.kill += n;
    else if (k.indexOf("낚음") == 0) sum.fish += n;
  });
  if (sum.mine >= 8) add("mining", 3, { n: sum.mine });
  if (sum.place >= 8) add("building", 3, { n: sum.place });
  if (sum.kill >= 3) add("fighting", 3, { n: sum.kill });
  if (sum.fish >= 1) add("fishing", 3);

  // 가만히 있음 (1분 이상, 잠수 전)
  let idle = tvSitSafe(() => tvAfkSec(player), 0);
  if (idle > 60) add("still", 3);

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
    mem.queue.push({ at: tvNow() + Math.random() * (spreadSec || 4) * 1000, name: viewer.name, color: viewer.color, msg: msg });
  }
  return pushed > 0; // 새로 할 말이 없으면 false → 일반 잡담으로
}
