import type { GameMode, ModeRules } from './mode-engine-types'

export type { GameMode, ModeRules } from './mode-engine-types'

const modeRules = {
  'ranked-solo-duo': {
    requiresRoleSelection: true,
    hasChampSelect: true,
    hasBans: true,
    hasSimultaneousBans: false,
    hasBench: false,
    usesRunes: true,
    usesSummonerSpells: true,
    allowsTrades: true,
    allowsSwaps: true,
    hasPreselect: false,
    maxPartySize: 2,
    minPartySize: 1,
    botSupport: false,
    spectatorSupport: false,
  },
  'ranked-flex': {
    requiresRoleSelection: true,
    hasChampSelect: true,
    hasBans: true,
    hasSimultaneousBans: false,
    hasBench: false,
    usesRunes: true,
    usesSummonerSpells: true,
    allowsTrades: true,
    allowsSwaps: true,
    hasPreselect: false,
    maxPartySize: 5,
    minPartySize: 1,
    botSupport: false,
    spectatorSupport: false,
  },
  'normal-draft': {
    requiresRoleSelection: true,
    hasChampSelect: true,
    hasBans: true,
    hasSimultaneousBans: false,
    hasBench: false,
    usesRunes: true,
    usesSummonerSpells: true,
    allowsTrades: true,
    allowsSwaps: true,
    hasPreselect: false,
    maxPartySize: 5,
    minPartySize: 1,
    botSupport: false,
    spectatorSupport: false,
  },
  swiftplay: {
    requiresRoleSelection: true,
    hasChampSelect: false,
    hasBans: false,
    hasSimultaneousBans: false,
    hasBench: false,
    usesRunes: true,
    usesSummonerSpells: true,
    allowsTrades: false,
    allowsSwaps: false,
    hasPreselect: true,
    maxPartySize: 5,
    minPartySize: 1,
    botSupport: false,
    spectatorSupport: false,
  },
  aram: {
    requiresRoleSelection: false,
    hasChampSelect: true,
    hasBans: false,
    hasSimultaneousBans: false,
    hasBench: true,
    usesRunes: true,
    usesSummonerSpells: true,
    allowsTrades: true,
    allowsSwaps: false,
    hasPreselect: false,
    maxPartySize: 5,
    minPartySize: 1,
    botSupport: false,
    spectatorSupport: false,
  },
  arena: {
    requiresRoleSelection: false,
    hasChampSelect: true,
    hasBans: true,
    hasSimultaneousBans: true,
    hasBench: false,
    usesRunes: false,
    usesSummonerSpells: false,
    allowsTrades: false,
    allowsSwaps: false,
    hasPreselect: false,
    maxPartySize: 2,
    minPartySize: 1,
    botSupport: false,
    spectatorSupport: false,
  },
  clash: {
    requiresRoleSelection: true,
    hasChampSelect: true,
    hasBans: true,
    hasSimultaneousBans: false,
    hasBench: false,
    usesRunes: true,
    usesSummonerSpells: true,
    allowsTrades: true,
    allowsSwaps: true,
    hasPreselect: false,
    maxPartySize: 5,
    minPartySize: 5,
    botSupport: false,
    spectatorSupport: false,
  },
  custom: {
    requiresRoleSelection: true,
    hasChampSelect: true,
    hasBans: true,
    hasSimultaneousBans: false,
    hasBench: false,
    usesRunes: true,
    usesSummonerSpells: true,
    allowsTrades: true,
    allowsSwaps: true,
    hasPreselect: false,
    maxPartySize: 10,
    minPartySize: 1,
    botSupport: true,
    spectatorSupport: true,
  },
} satisfies Record<GameMode, ModeRules>

export const gameModes: GameMode[] = ['ranked-solo-duo', 'ranked-flex', 'normal-draft', 'swiftplay', 'aram', 'arena', 'clash', 'custom']

const queueIdToMode = {
  400: 'normal-draft',
  420: 'ranked-solo-duo',
  440: 'ranked-flex',
  450: 'aram',
  480: 'swiftplay',
  490: 'normal-draft',
  700: 'clash',
  1700: 'arena',
  1710: 'arena',
} satisfies Partial<Record<number, GameMode>>

function hasQueueMode(queueId: number): queueId is keyof typeof queueIdToMode {
  return Object.prototype.hasOwnProperty.call(queueIdToMode, queueId)
}

export function getModeRules(mode: GameMode): ModeRules {
  return modeRules[mode]
}

export function getModeNameKey(mode: GameMode): `modes.${string}` {
  switch (mode) {
    case 'ranked-solo-duo':
      return 'modes.rankedSoloDuo'
    case 'ranked-flex':
      return 'modes.rankedFlex'
    case 'normal-draft':
      return 'modes.normalDraft'
    case 'swiftplay':
      return 'modes.swiftplay'
    case 'aram':
      return 'modes.aram'
    case 'arena':
      return 'modes.arena'
    case 'clash':
      return 'modes.clash'
    case 'custom':
      return 'modes.custom'
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

  if (normalizedMode.includes('CHERRY')) return 'arena'
  if (normalizedMode.includes('ARAM')) return 'aram'
  if (normalizedMode.includes('CLASH')) return 'clash'
  if (normalizedMode.includes('SWIFTPLAY')) return 'swiftplay'
  if (normalizedMode.includes('CUSTOM')) return 'custom'
  if (normalizedMode.includes('RANKED_FLEX')) return 'ranked-flex'
  if (normalizedMode.includes('RANKED_SOLO')) return 'ranked-solo-duo'
  if (normalizedMode.includes('NORMAL_DRAFT') || normalizedMode.includes('CLASSIC')) return 'normal-draft'

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
