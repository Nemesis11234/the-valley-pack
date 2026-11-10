// Adds approved family variants to native FTB kill tasks. Primary entity IDs
// are counted only by FTB; this file never handles those IDs.
(function () {
  var ServerQuestFile = Java.loadClass('dev.ftb.mods.ftbquests.quest.ServerQuestFile');
  var targets = {
  "minecraft:husk": 4492861532113540,
  "rottencreatures:undead_miner": 4492861532113540,
  "rottencreatures:swampy": 4492861532113540,
  "rottencreatures:burned": 4492861532113540,
  "rottencreatures:frostbitten": 4492861532113540,
  "rottencreatures:mummy": 4492861532113540,
  "irons_spellbooks:catacombs_zombie": 4492861532113540,
  "minecraft:cave_spider": 3170272020799427,
  "irons_spellbooks:ice_spider": 3170272020799427,
  "splendid_slimes:splendid_slime": 2844661617590986,
  "minecraft:stray": 2715686419586987,
  "trials:bogged": 2715686419586987,
  "minecraft:vindicator": 1150838331431005,
  "minecraft:evoker": 1150838331431005,
  "illageandspillage:igniter": 1150838331431005,
  "illageandspillage:engineer": 1150838331431005,
  "illageandspillage:preserver": 1150838331431005,
  "illageandspillage:twittollager": 1150838331431005,
  "irons_spellbooks:archevoker": 1150838331431005,
  "irons_spellbooks:magehunter_vindicator": 1150838331431005
};
  EntityEvents.death(function (event) {
    var entity = event.entity;
    var type = String(entity.type);
    var taskId = targets[type];
    if (taskId === undefined) return;
    var player = event.source.player;
    if (!player || String(player.type) !== 'minecraft:player') return;
    if (type === 'splendid_slimes:splendid_slime') {
      if (entity.getTamed() || entity.getOwnerUUID() !== null) return;
    } else {
      var nbt = entity.nbt;
      if (nbt.contains('Owner') || nbt.contains('OwnerUUID') || nbt.contains('Summoner') || nbt.contains('SummonerUUID')) return;
    }
    var file = ServerQuestFile.INSTANCE;
    if (!file) return;
    var task = file.getTask(taskId);
    var team = file.getOrCreateTeamData(player);
    if (!task || !team || team.isLocked() || !team.canStartTasks(task.getQuest()) || team.isCompleted(task)) return;
    team.addProgress(task, 1);
  });
})();
