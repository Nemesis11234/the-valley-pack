// priority: 7
// The Valley 방송: 사진 (Exposure 카메라 모드)
// - 방송 중 사진을 찍으면 시청자가 반응 (보스·친구·셀카 등은 크게)
// - 사진 미션: 시청자가 "~ 사진 찍어 주세요" 요청 → 조건에 맞는 사진을 찍으면 성공 (카메라를 가지고 있을 때만 나옴)
// Exposure가 사진마다 바이옴·날씨·시간·동굴·물속·셀카·찍힌 몹/플레이어를 기록해 줘서 그걸로 판정.
// 주의: 이 Rhino는 블록({ }) 안의 const를 오류로 처리하고, 필드와 이름이 겹치는 함수(getPlayer 등)를 못 찾음 → tvG 사용.

const TV_PHOTO = {
  missionShare: 0.35, // 카메라가 있을 때 미션 중 사진 미션 비율
  missionSec: 600, // 사진 미션 제한 시간
  rewardMult: 2, // 일반 미션 보상의 몇 배
};

// 사진 미션 목록: key, 요청 문구, 판정
const TV_PHOTO_TARGETS = [
  { key: "boss", label: "보스나 미니보스 사진", test: (i) => i.boss },
  { key: "monster", label: "적대 몹 사진", test: (i) => i.monster },
  { key: "animal", label: "동물 사진", test: (i) => i.animal },
  { key: "player", label: "다른 플레이어랑 같이 나온 사진", test: (i) => i.players.length > 0 },
  { key: "selfie", label: "셀카", test: (i) => i.selfie },
  { key: "night", label: "밤 풍경 사진", test: (i) => i.night && !i.cave },
  { key: "sunset", label: "노을 사진", test: (i) => i.sunset && !i.cave },
  { key: "rain", label: "비(눈) 오는 날 사진", test: (i) => i.rain },
  { key: "cave", label: "동굴 안 사진", test: (i) => i.cave },
  { key: "underwater", label: "물속 사진", test: (i) => i.underwater },
  { key: "skull", label: "해골 광산 안 사진", test: (i) => i.skull },
];

global.TV_PHOTO_TEMPLATES = {
  any: ["찰칵", "사진 잘 나왔다", "인생샷 각", "포토그래퍼 {p}", "그 사진 나도 줘요", "프사 각", "구도 좋네", "필름 아껴요 ㅋㅋ"],
  boss: ["보스 앞에서 사진 ㅋㅋㅋ", "목숨 걸고 찍는 사진", "이게 진짜 기자 정신", "도망부터 가요 ㅋㅋ", "사진 찍을 때냐고 ㅋㅋㅋ"],
  player: ["둘이 사진 찍네 ㅋㅋ", "{o}님이랑 투샷", "커플샷? ㅋㅋ", "단체 사진 ㄱㄱ", "{o}님 표정 뭐임 ㅋㅋ"],
  selfie: ["셀카 ㅋㅋㅋ", "얼굴 공개?", "잘생겼다 (아님)", "셀카 각도 장인", "프사 바꿔요"],
  scenery: ["풍경 미쳤다", "이거 배경화면 각", "감성 사진 ㄷㄷ", "사진작가 하세요"],
};

function tvPhotoHasCamera(player) {
  try {
    let inv = player.inventory;
    for (let i = 0; i < inv.getContainerSize(); i++) {
      let st = inv.getItem(i);
      if (!st.isEmpty() && String(st.id).indexOf("exposure:camera") == 0) return true;
    }
  } catch (err) {
    return false;
  }
  return false;
}

// 사진 미션 만들기 (tvMissionStart가 부름). 못 만들면 null
function tvPhotoMission(player) {
  if (!tvPhotoHasCamera(player) || Math.random() >= TV_PHOTO.missionShare) return null;
  let t = tvRand(TV_PHOTO_TARGETS);
  return { type: "photo", photo: t.key, goal: 1, sec: TV_PHOTO.missionSec, text: `10분 안에 ${t.label} 찍어 주세요`, rewardMult: TV_PHOTO.rewardMult };
}

// 사진 정보 정리
function tvPhotoInfo(player, frame, entities) {
  let info = { selfie: false, night: false, sunset: false, rain: false, cave: false, underwater: false, skull: false, boss: false, monster: false, animal: false, players: [], biome: "" };
  let has = (k) => {
    try {
      return !!frame.contains(k);
    } catch (err) {
      return false;
    }
  };
  try {
    info.selfie = has("Selfie") && !!frame.getBoolean("Selfie");
    info.cave = has("InCave") && !!frame.getBoolean("InCave");
    info.underwater = has("Underwater") && !!frame.getBoolean("Underwater");
    let w = has("Weather") ? String(frame.getString("Weather")) : "";
    info.rain = w != "" && w != "Clear";
    let t = has("DayTime") ? Number(frame.getInt("DayTime")) % 24000 : 6000;
    info.night = t >= 13000 && t < 23000;
    info.sunset = t >= 11500 && t < 13500;
    info.skull = has("Dimension") && String(frame.getString("Dimension")) == "society:skull_cavern";
    info.biome = has("Biome") ? String(frame.getString("Biome")) : "";
  } catch (err) {
    // 기록 일부를 못 읽어도 나머지로 판정
  }
  try {
    entities.forEach((e) => {
      if (e == player) return;
      if (e.isPlayer()) {
        if (String(e.uuid) != String(player.uuid)) info.players.push(String(e.username));
        return;
      }
      if (!e.isLiving()) return;
      let monster = false;
      try {
        monster = !!e.isMonster();
      } catch (err) {
        monster = false;
      }
      if (Number(e.maxHealth) >= 100) info.boss = true;
      if (monster) info.monster = true;
      else info.animal = true;
    });
  } catch (err) {
    // 찍힌 대상을 못 읽으면 없는 걸로
  }
  return info;
}

function tvOnPhoto(player, info) {
  if (!tvIsOn(player)) return;
  tvMarkActive(player);
  // 사진 미션 판정
  let m = tvMem(player).mission;
  if (m && m.type == "photo") {
    let target = TV_PHOTO_TARGETS.filter((t) => t.key == m.photo)[0];
    if (target && target.test(info)) {
      tvMissionEnd(player, true);
      return;
    }
  }
  // 그냥 사진: 반응
  let vars = { o: info.players.length ? info.players[0] : "", p: tvName(player) };
  if (info.boss) {
    tvEvent(player, 12, 0, "보스 앞에서 사진", null, {});
    tvViewerChat(player, "photo_boss", vars, 2, 4);
  } else if (info.players.length) tvViewerChat(player, "photo_player", vars, 2, 4);
  else if (info.selfie) tvViewerChat(player, "photo_selfie", vars, 2, 4);
  else if ((info.night || info.sunset || info.rain) && !info.cave && !info.underwater && !info.skull) tvViewerChat(player, "photo_scenery", vars, 1, 4);
  else if (Math.random() < 0.5) tvViewerChat(player, "photo_any", vars, 1, 3);
  tvNote(player, "사진 찍음", 1);
}

// tvViewerChat이 쓰는 템플릿 목록에 등록
global.TV_TEMPLATES.photo_any = global.TV_PHOTO_TEMPLATES.any;
global.TV_TEMPLATES.photo_boss = global.TV_PHOTO_TEMPLATES.boss;
global.TV_TEMPLATES.photo_player = global.TV_PHOTO_TEMPLATES.player;
global.TV_TEMPLATES.photo_selfie = global.TV_PHOTO_TEMPLATES.selfie;
global.TV_TEMPLATES.photo_scenery = global.TV_PHOTO_TEMPLATES.scenery;

if (typeof ExposureEvents !== "undefined" && ExposureEvents.modifyFrameData) {
  ExposureEvents.modifyFrameData((e) => {
    try {
      let player = tvG(e, "player", "getPlayer");
      if (!player || player.isFake()) return;
      let frame = tvG(e, "frame", "getFrame");
      let entities = tvG(e, "entitiesInFrame", "getEntitiesInFrame") || [];
      tvOnPhoto(player, tvPhotoInfo(player, frame, entities));
    } catch (err) {
      console.error("[TheValley] photo error: " + err);
    }
  });
  console.info("[TheValley] streamPhoto.js: 카메라 연결됨");
} else {
  console.info("[TheValley] streamPhoto.js: Exposure 이벤트 없음 (사진 반응 꺼짐)");
}
