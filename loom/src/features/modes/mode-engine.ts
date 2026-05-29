import type { GameMode, ModeRules } from './mode-engine-types'

export type { GameMode, ModeRules } from './mode-engine-types'

const modeRules = {
  aram: {
    allowsSwaps: false,
    allowsTrades: true,
    botSupport: false,
    hasBans: false,
    hasBench: true,
    hasChampSelect: true,
    hasPreselect: false,
    hasSimultaneousBans: false,
    maxPartySize: 5,
    minPartySize: 1,
    requiresRoleSelection: false,
    spectatorSupport: false,
    usesRunes: true,
    usesSummonerSpells: true,
  },
  arena: {
    allowsSwaps: false,
    allowsTrades: false,
    botSupport: false,
    hasBans: true,
    hasBench: false,
    hasChampSelect: true,
    hasPreselect: false,
    hasSimultaneousBans: true,
    maxPartySize: 2,
    minPartySize: 1,
    requiresRoleSelection: false,
    spectatorSupport: false,
    usesRunes: false,
    usesSummonerSpells: false,
  },
  clash: {
    allowsSwaps: true,
    allowsTrades: true,
    botSupport: false,
    hasBans: true,
    hasBench: false,
    hasChampSelect: true,
    hasPreselect: false,
    hasSimultaneousBans: false,
    maxPartySize: 5,
    minPartySize: 5,
    requiresRoleSelection: true,
    spectatorSupport: false,
    usesRunes: true,
    usesSummonerSpells: true,
  },
  'coop-vs-ai': {
    allowsSwaps: true,
    allowsTrades: true,
    botSupport: true,
    hasBans: false,
    hasBench: false,
    hasChampSelect: true,
    hasPreselect: false,
    hasSimultaneousBans: false,
    maxPartySize: 5,
    minPartySize: 1,
    requiresRoleSelection: true,
    spectatorSupport: false,
    usesRunes: true,
    usesSummonerSpells: true,
  },
  custom: {
    allowsSwaps: true,
    allowsTrades: true,
    botSupport: true,
    hasBans: true,
    hasBench: false,
    hasChampSelect: true,
    hasPreselect: false,
    hasSimultaneousBans: false,
    maxPartySize: 10,
    minPartySize: 1,
    requiresRoleSelection: true,
    spectatorSupport: true,
    usesRunes: true,
    usesSummonerSpells: true,
  },
  'normal-draft': {
    allowsSwaps: true,
    allowsTrades: true,
    botSupport: false,
    hasBans: true,
    hasBench: false,
    hasChampSelect: true,
    hasPreselect: false,
    hasSimultaneousBans: false,
    maxPartySize: 5,
    minPartySize: 1,
    requiresRoleSelection: true,
    spectatorSupport: false,
    usesRunes: true,
    usesSummonerSpells: true,
  },
  'ranked-flex': {
    allowsSwaps: true,
    allowsTrades: true,
    botSupport: false,
    hasBans: true,
    hasBench: false,
    hasChampSelect: true,
    hasPreselect: false,
    hasSimultaneousBans: false,
    maxPartySize: 5,
    minPartySize: 1,
    requiresRoleSelection: true,
    spectatorSupport: false,
    usesRunes: true,
    usesSummonerSpells: true,
  },
  'ranked-solo-duo': {
    allowsSwaps: true,
    allowsTrades: true,
    botSupport: false,
    hasBans: true,
    hasBench: false,
    hasChampSelect: true,
    hasPreselect: false,
    hasSimultaneousBans: false,
    maxPartySize: 2,
    minPartySize: 1,
    requiresRoleSelection: true,
    spectatorSupport: false,
    usesRunes: true,
    usesSummonerSpells: true,
  },
  swiftplay: {
    allowsSwaps: false,
    allowsTrades: false,
    botSupport: false,
    hasBans: false,
    hasBench: false,
    hasChampSelect: false,
    hasPreselect: true,
    hasSimultaneousBans: false,
    maxPartySize: 5,
    minPartySize: 1,
    requiresRoleSelection: true,
    spectatorSupport: false,
    usesRunes: true,
    usesSummonerSpells: true,
  },
} satisfies Record<GameMode, ModeRules>

export const gameModes: GameMode[] = [
  'ranked-solo-duo',
  'ranked-flex',
  'normal-draft',
  'swiftplay',
  'aram',
  'arena',
  'clash',
  'coop-vs-ai',
  'custom',
]

const queueIdToMode = {
  1700: 'arena',
  1710: 'arena',
  2400: 'aram',
  400: 'normal-draft',
  420: 'ranked-solo-duo',
  440: 'ranked-flex',
  450: 'aram',
  480: 'swiftplay',
  490: 'normal-draft',
  700: 'clash',
  840: 'coop-vs-ai',
  860: 'coop-vs-ai',
  890: 'coop-vs-ai',
} satisfies Partial<Record<number, GameMode>>

function hasQueueMode(queueId: number): queueId is keyof typeof queueIdToMode {
  return Object.hasOwn(queueIdToMode, queueId)
}

export function getModeRules(mode: GameMode): ModeRules {
  return modeRules[mode]
}

export function getModeNameKey(mode: GameMode): `modes.${string}` {
  switch (mode) {
    case 'ranked-solo-duo': {
      return 'modes.rankedSoloDuo'
    }
    case 'ranked-flex': {
      return 'modes.rankedFlex'
    }
    case 'normal-draft': {
      return 'modes.normalDraft'
    }
    case 'swiftplay': {
      return 'modes.swiftplay'
    }
    case 'aram': {
      return 'modes.aram'
    }
    case 'arena': {
      return 'modes.arena'
    }
    case 'clash': {
      return 'modes.clash'
    }
    case 'coop-vs-ai': {
      return 'modes.coopVsAi'
    }
    case 'custom': {
      return 'modes.custom'
    }
    default: {
      return 'modes.custom'
    }
  }
}

export function getModeFromQueueId(queueId: number | null | undefined): GameMode | null {
  if (typeof queueId !== 'number' || !Number.isFinite(queueId)) {
    return null
  }

  if (!hasQueueMode(queueId)) {
    return null
  }

  return queueIdToMode[queueId] ?? null
}

export function getModeFromLcuGameMode(gameMode: string | null | undefined): GameMode | null {
  const normalizedMode = gameMode?.trim().toUpperCase()

  if (!normalizedMode) {
    return null
  }

  if (normalizedMode.includes('CHERRY')) {
    return 'arena'
  }

  if (normalizedMode.includes('ARAM')) {
    return 'aram'
  }

  if (normalizedMode.includes('CLASH')) {
    return 'clash'
  }

  if (normalizedMode.includes('SWIFTPLAY')) {
    return 'swiftplay'
  }

  if (normalizedMode.includes('CUSTOM')) {
    return 'custom'
  }

  if (normalizedMode.includes('RANKED_FLEX')) {
    return 'ranked-flex'
  }

  if (normalizedMode.includes('RANKED_SOLO')) {
    return 'ranked-solo-duo'
  }

  if (normalizedMode.includes('NORMAL_DRAFT') || normalizedMode.includes('CLASSIC')) {
    return 'normal-draft'
  }

  return null
}

export function resolveGameMode({
  benchEnabled,
  gameMode,
  mapId,
  queueId,
}: {
  benchEnabled?: boolean | null
  gameMode?: string | null
  mapId?: number | null
  queueId?: number | null
}): GameMode {
  const fallbackMode = benchEnabled || mapId === 12 ? 'aram' : 'normal-draft'

  return getModeFromQueueId(queueId) ?? getModeFromLcuGameMode(gameMode) ?? fallbackMode
}
