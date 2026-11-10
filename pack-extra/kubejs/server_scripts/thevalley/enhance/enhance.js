// The Valley 강화 시스템
// 대장장이 작업대: 무기·방어구를 들고 웅크린 채 우클릭 → 정보 표시 → 3초 안에 한 번 더 → 강화
// 무기(검·삼지창)와 방어구만. 도구(곡괭이·도끼 등)는 안 됨.

console.info("[TheValley] enhance.js loaded");

const TV_ENH = {
  // 다음 단계로 갈 때 성공률 (인덱스 = 목표 단계)
  success: [0, 0.95, 0.9, 0.85, 0.8, 0.7, 0.65, 0.6, 0.55, 0.45, 0.3, 0.25, 0.2, 0.15, 0.1, 0.05],
  // 실패했을 때 파괴 확률 (목표 단계 +10부터)
  breakOnFail: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.1, 0.13, 0.16, 0.19, 0.22, 0.25],
  // 목표 단계 이 값 이하면 실패해도 유지, 넘으면 1단계 하락
  keepUntil: 4,
  // 강화 비용 = costPerLevelSq × 목표단계² (계좌에서)
  costPerLevelSq: 200,
  confirmSec: 3,
  // 강화석 드롭
  drops: {
    skullMobChance: 0.08, // 해골 광산에서 적대 몹 처치 시 하급 1개
    miniBoss: { low: [2, 4], mid: [0, 1], midChance: 0.6 }, // 최대 체력 100 이상
    boss: { mid: [2, 3], high: [1, 2] }, // 최대 체력 500 이상
  },
};

const TV_ENH_STONES = [
  { max: 5, id: "thevalley:enhance_stone_low", name: "하급 강화석" },
  { max: 10, id: "thevalley:enhance_stone_mid", name: "중급 강화석" },
  { max: 15, id: "thevalley:enhance_stone_high", name: "상급 강화석" },
];
const TV_ENH_CONFIRM = {}; // uuid -> {at, key}

const $TvEnhArmorItem = Java.loadClass("net.minecraft.world.item.ArmorItem");
const $TvEnhSwordItem = Java.loadClass("net.minecraft.world.item.SwordItem");
const $TvEnhTridentItem = Java.loadClass("net.minecraft.world.item.TridentItem");

function tvEnhFmt(n) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function tvEnhKind(stack) {
  if (!stack || stack.isEmpty()) return null;
  const item = stack.getItem();
  if (item instanceof $TvEnhArmorItem) return "armor";
  if (item instanceof $TvEnhSwordItem || item instanceof $TvEnhTridentItem) return "weapon";
  return null;
}

function tvEnhLevel(stack) {
  const tag = stack.getTag();
  return tag && tag.contains("tvEnhance") ? tag.getInt("tvEnhance") : 0;
}

function tvEnhSetLevel(stack, level) {
  const tag = stack.getOrCreateTag();
  if (level <= 0) tag.remove("tvEnhance");
  else tag.putInt("tvEnhance", level);
}

function tvEnhStone(target) {
  return TV_ENH_STONES.filter((s) => target <= s.max)[0];
}

function tvEnhCountItem(player, id) {
  const inv = player.inventory;
  let n = 0;
  for (let i = 0; i < inv.getContainerSize(); i++) {
    let st = inv.getItem(i);
    if (!st.isEmpty() && String(st.id) == id) n += st.getCount();
  }
  return n;
}

function tvEnhTakeItem(player, id) {
  const inv = player.inventory;
  for (let i = 0; i < inv.getContainerSize(); i++) {
    let st = inv.getItem(i);
    if (!st.isEmpty() && String(st.id) == id) {
      st.shrink(1);
      return true;
    }
  }
  return false;
}

function tvEnhAccount(player) {
  try {
    return global.getPersonalOrCurioAccount(player.level, player);
  } catch (err) {
    return null;
  }
}

function tvEnhSay(player, json) {
  player.server.runCommandSilent(`tellraw ${player.username} ${JSON.stringify(json)}`);
}

function tvEnhSound(player, sound, pitch) {
  player.server.runCommandSilent(`execute as ${player.username} at @s run playsound ${sound} player @s ~ ~ ~ 1 ${pitch}`);
}

function tvEnhInfo(player, stack, level) {
  const target = level + 1;
  const stone = tvEnhStone(target);
  const cost = TV_ENH.costPerLevelSq * target * target;
  const have = tvEnhCountItem(player, stone.id);
  const failText =
    target <= TV_ENH.keepUntil
      ? "실패 시 유지"
      : TV_ENH.breakOnFail[target] > 0
      ? `실패 시 하락, 그중 ${Math.round(TV_ENH.breakOnFail[target] * 100)}%는 파괴`
      : "실패 시 1단계 하락";
  tvEnhSay(player, [
    { text: "[강화] ", color: "#FFAA00" },
    { text: `+${level} → +${target}  `, color: "#FFFFFF", bold: true },
    { text: `성공 ${Math.round(TV_ENH.success[target] * 100)}% · ${failText}\n`, color: "#FFFFFF" },
    { text: `       필요: ${stone.name} 1개 (보유 ${have}) · ${tvEnhFmt(cost)}원\n`, color: have > 0 ? "#AAAAAA" : "#FF5555" },
    { text: `       ${TV_ENH.confirmSec}초 안에 한 번 더 웅크리고 우클릭하면 강화해요.`, color: "#FFD54F" },
  ]);
}

function tvEnhTry(player, stack, level) {
  const target = level + 1;
  const stone = tvEnhStone(target);
  const cost = TV_ENH.costPerLevelSq * target * target;
  if (tvEnhCountItem(player, stone.id) <= 0) {
    tvEnhSay(player, { text: `[강화] ${stone.name}이 없어요.`, color: "#FF5555" });
    return;
  }
  const account = tvEnhAccount(player);
  const balance = account ? Number(account.getBalance()) || 0 : 0;
  if (!account || balance < cost) {
    tvEnhSay(player, { text: `[강화] 계좌 잔고가 모자라요 (필요 ${tvEnhFmt(cost)}원)`, color: "#FF5555" });
    return;
  }
  tvEnhTakeItem(player, stone.id);
  account.setBalance(balance - cost);

  const name = String(stack.hoverName.string);
  if (Math.random() < TV_ENH.success[target]) {
    tvEnhSetLevel(stack, target);
    tvEnhSound(player, "minecraft:block.anvil.use", 1.4);
    tvEnhSound(player, "minecraft:entity.player.levelup", 1.2);
    tvEnhSay(player, [{ text: "[강화] ", color: "#FFAA00" }, { text: `성공! +${target} ${name}`, color: "#7EE0A1", bold: true }]);
    if (target >= 10) {
      player.server.runCommandSilent(
        `tellraw @a ${JSON.stringify([{ text: "[강화] ", color: "#FFAA00" }, { text: `${player.username}님이 +${target} ${name} 강화에 성공했어요!`, color: "#FFD54F" }])}`
      );
    }
    if (global.tvOnEnhance) global.tvOnEnhance(player, "success", target, name);
    return;
  }

  if (Math.random() < TV_ENH.breakOnFail[target]) {
    stack.shrink(1);
    tvEnhSound(player, "minecraft:entity.item.break", 0.7);
    tvEnhSound(player, "minecraft:block.anvil.destroy", 0.8);
    tvEnhSay(player, [{ text: "[강화] ", color: "#FFAA00" }, { text: `실패... +${level} ${name}이 파괴됐어요.`, color: "#FF5555", bold: true }]);
    player.server.runCommandSilent(
      `tellraw @a ${JSON.stringify([{ text: "[강화] ", color: "#FFAA00" }, { text: `${player.username}님의 +${level} ${name}이 파괴됐어요...`, color: "#F28B82" }])}`
    );
    if (global.tvOnEnhance) global.tvOnEnhance(player, "break", level, name);
    return;
  }

  const down = target > TV_ENH.keepUntil ? level - 1 : level;
  tvEnhSetLevel(stack, down);
  tvEnhSound(player, "minecraft:block.anvil.land", 0.8);
  tvEnhSay(player, [
    { text: "[강화] ", color: "#FFAA00" },
    { text: down < level ? `실패... +${level} → +${down}로 떨어졌어요.` : `실패... +${level} 유지`, color: "#F28B82" },
  ]);
  if (global.tvOnEnhance) global.tvOnEnhance(player, down < level ? "down" : "keep", level, name);
}

BlockEvents.rightClicked("minecraft:smithing_table", (e) => {
  const player = e.player;
  if (!player || player.isFake() || e.hand == "OFF_HAND") return;
  if (!player.isCrouching()) return;
  const stack = player.mainHandItem;
  const kind = tvEnhKind(stack);
  if (!kind) {
    if (!stack.isEmpty()) {
      player.server.runCommandSilent(
        `title ${player.username} actionbar ${JSON.stringify({ text: "강화는 무기(검·삼지창)와 방어구만 할 수 있어요", color: "#AAAAAA" })}`
      );
    }
    return;
  }
  e.cancel();
  const level = tvEnhLevel(stack);
  if (level >= 15) {
    tvEnhSay(player, { text: "[강화] 이미 최대 단계(+15)예요.", color: "#FFD54F" });
    return;
  }
  const id = String(player.uuid);
  const key = `${stack.id}|${level}|${player.inventory.selected}`;
  const pending = TV_ENH_CONFIRM[id];
  const now = Date.now();
  if (pending && pending.key == key && now - pending.at <= TV_ENH.confirmSec * 1000) {
    delete TV_ENH_CONFIRM[id];
    tvEnhTry(player, stack, level);
  } else {
    TV_ENH_CONFIRM[id] = { at: now, key: key };
    tvEnhInfo(player, stack, level);
  }
});

// ───────────── 강화석 드롭 ─────────────

function tvEnhRand(range) {
  return range[0] + Math.floor(Math.random() * (range[1] - range[0] + 1));
}

EntityEvents.death((e) => {
  const entity = e.entity;
  if (!entity.isLiving() || entity.isPlayer()) return;
  const player = e.source ? e.source.player : null;
  if (!player || !player.isPlayer() || player.isFake()) return;
  const hp = Number(entity.maxHealth) || 0;
  const drops = [];
  if (hp >= 500) {
    drops.push(["thevalley:enhance_stone_mid", tvEnhRand(TV_ENH.drops.boss.mid)]);
    drops.push(["thevalley:enhance_stone_high", tvEnhRand(TV_ENH.drops.boss.high)]);
  } else if (hp >= 100) {
    drops.push(["thevalley:enhance_stone_low", tvEnhRand(TV_ENH.drops.miniBoss.low)]);
    if (Math.random() < TV_ENH.drops.miniBoss.midChance) drops.push(["thevalley:enhance_stone_mid", Math.max(1, tvEnhRand(TV_ENH.drops.miniBoss.mid))]);
  } else if (String(entity.level.dimension) == "society:skull_cavern") {
    let hostile = false;
    try {
      hostile = String(entity.getType().getCategory().getName()) == "monster";
    } catch (err) {
      hostile = false;
    }
    if (hostile && Math.random() < TV_ENH.drops.skullMobChance) drops.push(["thevalley:enhance_stone_low", 1]);
  }
  drops.forEach((d) => {
    if (d[1] > 0) entity.block.popItem(Item.of(d[0], d[1]));
  });
});
