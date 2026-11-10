// Forge 1.20.1 / KubeJS
const XP_DROP_PERCENT = 0.05
const MAX_XP_PER_ORB = 100

global.deathXpCache = global.deathXpCache || {}

// XP required to advance from the specified level.
function xpToNextLevel(level) {
    if (level < 16) {
        return 2 * level + 7
    }

    if (level < 31) {
        return 5 * level - 38
    }

    return 9 * level - 158
}

// Converts the player's current visible level and progress into current XP.
//
// This intentionally does not use player.totalExperience because that value
// can be stale or cumulative after experience commands are used.
function calculateCurrentXp(player) {
    const level = Math.max(0, Number(player.experienceLevel) || 0)
    const progress = Math.max(
        0,
        Math.min(1, Number(player.experienceProgress) || 0)
    )

    let xp = 0

    for (let currentLevel = 0; currentLevel < level; currentLevel++) {
        xp += xpToNextLevel(currentLevel)
    }

    xp += Math.floor(progress * xpToNextLevel(level))

    return xp
}

EntityEvents.death(event => {
    const player = event.entity

    if (!player.isPlayer()) return

    const playerId = String(player.uuid)
    const currentXp = calculateCurrentXp(player)
    const xpToDrop = Math.floor(currentXp * XP_DROP_PERCENT)

    global.deathXpCache[playerId] = {
        xp: xpToDrop,
        x: Number(player.x),
        y: Number(player.y) + 0.5,
        z: Number(player.z),
        dimension: String(player.level.dimension),
        pending: true
    }

    console.info(
        `[XP DROP] ${player.username} died with ${currentXp} current XP; ` +
        `dropping ${xpToDrop} XP`
    )
})

PlayerEvents.tick(event => {
    const player = event.player
    const playerId = String(player.uuid)
    const data = global.deathXpCache[playerId]

    if (!data || !data.pending) return

    // Prevent this from running on every tick.
    data.pending = false

    console.info(
        `[XP DROP] Respawn processing for ${player.username}: ` +
        `level=${player.experienceLevel}, ` +
        `progress=${player.experienceProgress}, ` +
        `drop=${data.xp}`
    )

    // Clear all XP retained by KeepInventory.
    event.server.runCommandSilent(
        `experience set ${player.username} 0 points`
    )

    event.server.runCommandSilent(
        `experience set ${player.username} 0 levels`
    )

    let remainingXp = data.xp

    while (remainingXp > 0) {
        const orbValue = Math.min(remainingXp, MAX_XP_PER_ORB)

        event.server.runCommandSilent(
            `execute in ${data.dimension} run summon minecraft:experience_orb ` +
            `${data.x} ${data.y} ${data.z} {Value:${orbValue}}`
        )

        remainingXp -= orbValue
    }

    console.info(
        `[XP DROP] Cleared XP from ${player.username} and spawned ` +
        `${data.xp} XP at the death location`
    )

    delete global.deathXpCache[playerId]
})