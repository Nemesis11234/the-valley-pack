// The Valley 강화 시스템
// 대장장이 작업대: 무기·방어구를 들고 웅크린 채 우클릭 → 강화 창 → [강화하기]
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

// ───────────── 강화 창 (SVDialog) ─────────────
// 창 글자는 점수판 값으로 채워지므로 열기 직전에 점수를 맞춘다.
const TV_ENH_OBJECTIVES = ["tv_e_lvl", "tv_e_target", "tv_e_rate", "tv_e_break", "tv_e_have", "tv_e_cost", "tv_e_bal", "tv_e_ok"];

function tvEnhDialogId(target) {
  if (target <= TV_ENH.keepUntil) return "thevalley_enhance_low_keep";
  if (target <= 5) return "thevalley_enhance_low_down";
  if (TV_ENH.breakOnFail[target] <= 0) return target <= 10 ? "thevalley_enhance_mid_down" : "thevalley_enhance_high_break";
  return target <= 10 ? "thevalley_enhance_mid_break" : "thevalley_enhance_high_break";
}

function tvEnhOpen(player, stack, level) {
  const s = player.server;
  const name = player.username;
  TV_ENH_OBJECTIVES.forEach((o) => s.runCommandSilent(`scoreboard objectives add ${o} dummy`));
  const target = level + 1;
  const stone = tvEnhStone(target);
  const cost = TV_ENH.costPerLevelSq * target * target;
  const have = tvEnhCountItem(player, stone.id);
  const account = tvEnhAccount(player);
  const balance = account ? Number(account.getBalance()) || 0 : 0;
  const ok = have <= 0 ? 2 : balance < cost ? 3 : 1;
  const vals = {
    tv_e_lvl: level,
    tv_e_target: target,
    tv_e_rate: Math.round(TV_ENH.success[target] * 100),
    tv_e_break: Math.round(TV_ENH.breakOnFail[target] * 100),
    tv_e_have: have,
    tv_e_cost: cost,
    tv_e_bal: Math.min(2000000000, Math.floor(balance)),
    tv_e_ok: ok,
  };
  Object.keys(vals).forEach((k) => s.runCommandSilent(`scoreboard players set ${name} ${k} ${vals[k]}`));
  TV_ENH_CONFIRM[String(player.uuid)] = { at: Date.now(), key: tvEnhKey(player, stack, level) };
  s.runCommandSilent(`dialog ${name} show ${name} ${tvEnhDialogId(target)}`);
}

function tvEnhKey(player, stack, level) {
  return `${stack.id}|${level}|${player.inventory.selected}`;
}

function tvEnhResultTitle(player, text, color) {
  player.server.runCommandSilent(
    global.getEmbersTextAPICommand(
      player.username,
      `{anchor:"TOP_CENTER",background:1,align:"TOP_CENTER",color:"${color}",offsetY:50}`,
      50,
      Text.of(text).toJson()
    )
  );
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
    tvEnhResultTitle(player, `강화 성공! +${target}`, "#7EE0A1");
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
    tvEnhResultTitle(player, `파괴... +${level} ${name}`, "#FF5555");
    player.server.runCommandSilent(
      `tellraw @a ${JSON.stringify([{ text: "[강화] ", color: "#FFAA00" }, { text: `${player.username}님의 +${level} ${name}이 파괴됐어요...`, color: "#F28B82" }])}`
    );
    if (global.tvOnEnhance) global.tvOnEnhance(player, "break", level, name);
    return;
  }

  const down = target > TV_ENH.keepUntil ? level - 1 : level;
  tvEnhSetLevel(stack, down);
  tvEnhSound(player, "minecraft:block.anvil.land", 0.8);
  tvEnhResultTitle(player, down < level ? `실패 +${level} → +${down}` : `실패 +${level} 유지`, "#F28B82");
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
  tvEnhOpen(player, stack, level);
});

// 강화 창의 [강화하기] 버튼이 부르는 명령. 창을 연 뒤 손에 든 아이템이 바뀌었으면 취소.
function tvEnhConfirm(player) {
  const id = String(player.uuid);
  const pending = TV_ENH_CONFIRM[id];
  delete TV_ENH_CONFIRM[id];
  const stack = player.mainHandItem;
  if (!tvEnhKind(stack)) return 0;
  const level = tvEnhLevel(stack);
  if (!pending || pending.key != tvEnhKey(player, stack, level) || Date.now() - pending.at > 120000) {
    tvEnhSay(player, { text: "[강화] 손에 든 아이템이 바뀌어서 취소했어요. 다시 열어 주세요.", color: "#FF5555" });
    return 0;
  }
  if (level >= 15) return 0;
  tvEnhTry(player, stack, level);
  // 결과를 잠깐 보여준 뒤, 아직 강화할 수 있으면 창을 다시 연다
  player.server.scheduleInTicks(30, () => {
    if (player.isRemoved()) return;
    const st = player.mainHandItem;
    if (tvEnhKind(st) && tvEnhLevel(st) < 15) tvEnhOpen(player, st, tvEnhLevel(st));
  });
  return 1;
}

ServerEvents.commandRegistry((event) => {
  const { commands: Commands } = event;
  event.register(
    Commands.literal("tvenhance").then(
      Commands.literal("confirm").executes((ctx) => {
        const player = ctx.source.player;
        return player ? tvEnhConfirm(player) : 0;
      })
    )
  );
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
