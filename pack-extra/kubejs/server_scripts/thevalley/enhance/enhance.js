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

const $TvEnhArmorItem = Java.loadClass("net.minecraft.world.item.ArmorItem");
const $TvEnhSwordItem = Java.loadClass("net.minecraft.world.item.SwordItem");
const $TvEnhTridentItem = Java.loadClass("net.minecraft.world.item.TridentItem");

function tvEnhFmt(n) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function tvEnhKind(stack) {
  if (!stack || stack.isEmpty()) return null;
  let item = stack.getItem();
  if (item instanceof $TvEnhArmorItem) return "armor";
  if (item instanceof $TvEnhSwordItem || item instanceof $TvEnhTridentItem) return "weapon";
  return null;
}

function tvEnhLevel(stack) {
  let tag = stack.nbt; // getTag()는 이 서버에서 안 보임
  return tag && tag.contains("tvEnhance") ? tag.getInt("tvEnhance") : 0;
}

function tvEnhSetLevel(stack, level) {
  let tag = stack.getOrCreateTag();
  if (level <= 0) tag.remove("tvEnhance");
  else tag.putInt("tvEnhance", level);
}

function tvEnhStone(target) {
  return TV_ENH_STONES.filter((s) => target <= s.max)[0];
}

function tvEnhCountItem(player, id) {
  let inv = player.inventory;
  let n = 0;
  for (let i = 0; i < inv.getContainerSize(); i++) {
    let st = inv.getItem(i);
    if (!st.isEmpty() && String(st.id) == id) n += st.getCount();
  }
  return n;
}

function tvEnhTakeItem(player, id) {
  let inv = player.inventory;
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

// ───────────── 강화 창 (상자 모양 창, KubeJS 기본 기능) ─────────────

function tvEnhKey(player, stack) {
  return `${stack.id}|${player.selectedSlot}`;
}

function tvEnhItem(id, name, color, lore) {
  let item = Item.of(id).withName(Text.of(name).color(color).italic(false));
  if (lore && lore.length) item = item.withLore(lore.map((l) => Text.of(l).gray().italic(false)));
  return item;
}

function tvEnhSlot(gui, x, y, item, cb) {
  gui.slot(x, y, (slot) => {
    slot.item = item;
    slot.resetClickHandlers();
    if (cb) slot.leftClicked = cb;
  });
}

const TV_ENH_RESULT_TEXT = {
  success: ["minecraft:emerald", "성공!", "#7EE0A1"],
  break: ["minecraft:skeleton_skull", "파괴...", "#FF5555"],
  down: ["minecraft:redstone", "실패 · 1단계 하락", "#F28B82"],
  keep: ["minecraft:gray_dye", "실패 · 단계 유지", "#AAAAAA"],
  nostone: ["minecraft:gray_dye", "강화석이 모자라요", "#AAAAAA"],
  nomoney: ["minecraft:gray_dye", "잔고가 모자라요", "#AAAAAA"],
};

function tvEnhOpen(player, stack, level) {
  let openKey = tvEnhKey(player, stack);
  let lastResult = null;
  player.openChestGUI(Text.of("강화"), 3, (gui) => {
    gui.playerSlots = false;
    let draw = () => {
      let st = player.mainHandItem;
      let valid = tvEnhKind(st) && tvEnhKey(player, st) == openKey;
      let lv = valid ? tvEnhLevel(st) : 0;
      // 가운데: 강화할 아이템 (보기용)
      tvEnhSlot(gui, 4, 1, valid ? st.copy() : Item.of("minecraft:air"), null);
      // 마지막 결과
      if (lastResult) {
        let rt = TV_ENH_RESULT_TEXT[lastResult];
        tvEnhSlot(gui, 2, 1, tvEnhItem(rt[0], rt[1], rt[2], ["마지막 강화 결과"]), null);
      }
      if (!valid) {
        tvEnhSlot(gui, 4, 0, tvEnhItem("minecraft:barrier", "강화할 아이템이 없어요", "#FF5555", lastResult == "break" ? ["아이템이 파괴됐어요"] : ["무기나 방어구를 들고 다시 열어 주세요"]), null);
        tvEnhSlot(gui, 6, 1, Item.of("minecraft:air"), null);
        gui.sync();
        return;
      }
      if (lv >= 15) {
        tvEnhSlot(gui, 4, 0, tvEnhItem("minecraft:nether_star", "최대 단계 +15", "#FFD54F", ["더 이상 강화할 수 없어요"]), null);
        tvEnhSlot(gui, 6, 1, Item.of("minecraft:air"), null);
        gui.sync();
        return;
      }
      let target = lv + 1;
      let stone = tvEnhStone(target);
      let cost = TV_ENH.costPerLevelSq * target * target;
      let have = tvEnhCountItem(player, stone.id);
      let account = tvEnhAccount(player);
      let balance = account ? Number(account.getBalance()) || 0 : 0;
      let failText =
        target <= TV_ENH.keepUntil
          ? "실패해도 단계 유지"
          : TV_ENH.breakOnFail[target] > 0
          ? `실패하면 1단계 하락, 그중 ${Math.round(TV_ENH.breakOnFail[target] * 100)}%는 파괴`
          : "실패하면 1단계 하락";
      tvEnhSlot(gui, 4, 0, tvEnhItem("minecraft:enchanted_book", `+${lv} → +${target}`, "#FFAA00", [
        `성공 확률 ${Math.round(TV_ENH.success[target] * 100)}%`,
        failText,
        `필요: ${stone.name} 1개 (보유 ${have}개)`,
        `비용: ${tvEnhFmt(cost)}원 (잔고 ${tvEnhFmt(balance)}원)`,
      ]), null);
      let ok = have > 0 && balance >= cost;
      tvEnhSlot(
        gui, 6, 1,
        ok
          ? tvEnhItem("minecraft:anvil", "강화하기", "#FFAA00", [`성공 ${Math.round(TV_ENH.success[target] * 100)}% · 클릭!`])
          : tvEnhItem("minecraft:gray_dye", have <= 0 ? `${stone.name}이 모자라요` : "잔고가 모자라요", "#777777", []),
        ok
          ? (e) => {
              let cur = player.mainHandItem;
              if (!tvEnhKind(cur) || tvEnhKey(player, cur) != openKey) {
                lastResult = null;
                draw();
                return;
              }
              lastResult = tvEnhTry(player, cur, tvEnhLevel(cur));
              draw();
            }
          : null
      );
      gui.sync();
    };
    tvEnhSlot(gui, 8, 2, tvEnhItem("minecraft:barrier", "닫기", "#AAAAAA", []), (e) => {
      if (typeof player.closeContainer === "function") player.closeContainer();
    });
    draw();
  });
}

function tvEnhTry(player, stack, level) {
  let target = level + 1;
  let stone = tvEnhStone(target);
  let cost = TV_ENH.costPerLevelSq * target * target;
  if (tvEnhCountItem(player, stone.id) <= 0) {
    tvEnhSay(player, { text: `[강화] ${stone.name}이 없어요.`, color: "#FF5555" });
    return "nostone";
  }
  let account = tvEnhAccount(player);
  let balance = account ? Number(account.getBalance()) || 0 : 0;
  if (!account || balance < cost) {
    tvEnhSay(player, { text: `[강화] 계좌 잔고가 모자라요 (필요 ${tvEnhFmt(cost)}원)`, color: "#FF5555" });
    return "nomoney";
  }
  tvEnhTakeItem(player, stone.id);
  account.setBalance(balance - cost);

  let name = String(stack.hoverName.string);
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
    return "success";
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
    return "break";
  }

  let down = target > TV_ENH.keepUntil ? level - 1 : level;
  tvEnhSetLevel(stack, down);
  tvEnhSound(player, "minecraft:block.anvil.land", 0.8);
  tvEnhSay(player, [
    { text: "[강화] ", color: "#FFAA00" },
    { text: down < level ? `실패... +${level} → +${down}로 떨어졌어요.` : `실패... +${level} 유지`, color: "#F28B82" },
  ]);
  if (global.tvOnEnhance) global.tvOnEnhance(player, down < level ? "down" : "keep", level, name);
  return down < level ? "down" : "keep";
}

BlockEvents.rightClicked("minecraft:smithing_table", (e) => {
  let player = e.player;
  if (!player || player.isFake() || e.hand == "OFF_HAND") return;
  if (!player.isCrouching()) return;
  let stack = player.mainHandItem;
  let kind = tvEnhKind(stack);
  if (!kind) {
    if (!stack.isEmpty()) {
      player.server.runCommandSilent(
        `title ${player.username} actionbar ${JSON.stringify({ text: "강화는 무기(검·삼지창)와 방어구만 할 수 있어요", color: "#AAAAAA" })}`
      );
    }
    return;
  }
  e.cancel();
  let level = tvEnhLevel(stack);
  if (level >= 15) {
    tvEnhSay(player, { text: "[강화] 이미 최대 단계(+15)예요.", color: "#FFD54F" });
    return;
  }
  tvEnhOpen(player, stack, level);
});

// ───────────── 강화석 드롭 ─────────────

function tvEnhRand(range) {
  return range[0] + Math.floor(Math.random() * (range[1] - range[0] + 1));
}

EntityEvents.death((e) => {
  let entity = e.entity;
  if (!entity.isLiving() || entity.isPlayer()) return;
  let player = e.source ? e.source.player : null;
  if (!player || !player.isPlayer() || player.isFake()) return;
  let hp = Number(entity.maxHealth) || 0;
  let drops = [];
  if (hp >= 500) {
    drops.push(["thevalley:enhance_stone_mid", tvEnhRand(TV_ENH.drops.boss.mid)]);
    drops.push(["thevalley:enhance_stone_high", tvEnhRand(TV_ENH.drops.boss.high)]);
  } else if (hp >= 100) {
    drops.push(["thevalley:enhance_stone_low", tvEnhRand(TV_ENH.drops.miniBoss.low)]);
    if (Math.random() < TV_ENH.drops.miniBoss.midChance) drops.push(["thevalley:enhance_stone_mid", Math.max(1, tvEnhRand(TV_ENH.drops.miniBoss.mid))]);
  } else if (String(entity.level.dimension) == "society:skull_cavern") {
    let hostile = false;
    try {
      hostile = !!entity.isMonster();
    } catch (err) {
      hostile = false;
    }
    if (hostile && Math.random() < TV_ENH.drops.skullMobChance) drops.push(["thevalley:enhance_stone_low", 1]);
  }
  drops.forEach((d) => {
    if (d[1] > 0) entity.block.popItem(Item.of(d[0], d[1]));
  });
});
