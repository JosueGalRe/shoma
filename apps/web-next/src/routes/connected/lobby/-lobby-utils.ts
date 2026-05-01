import type {
  AudioContextConstructor,
  LobbyQueueOption,
  SuggestedPlayer,
} from './-lobby-types'

function readObject(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  return value as Record<string, unknown>
}

export function readSummonerData(content: unknown): { displayName: string | null; profileIconId: number | null } {
  const candidate = readObject(content)
  if (!candidate) {
    return {
      displayName: null,
      profileIconId: null,
    }
  }

  const displayName = typeof candidate.displayName === 'string' ? candidate.displayName : null
  const profileIconId = typeof candidate.profileIconId === 'number' ? candidate.profileIconId : null

  return {
    displayName,
    profileIconId,
  }
}

export function readAudioContextConstructor(): AudioContextConstructor | null {
  if (typeof globalThis === 'undefined') {
    return null
  }

  const candidate = globalThis as typeof globalThis & {
    AudioContext?: AudioContextConstructor
    webkitAudioContext?: AudioContextConstructor
  }

  return candidate.AudioContext ?? candidate.webkitAudioContext ?? null
}

export function buildSummonerIconUrl(ddragonVersion: string | null, profileIconId: number | null): string | null {
  if (!ddragonVersion || profileIconId === null) {
    return null
  }

  return `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/profileicon/${profileIconId}.png`
}

export function buildChampionSplashUrl(championName: string | null): string | null {
  if (!championName) {
    return null
  }

  return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championName}_0.jpg`
}

export function buildChampionIconUrl(ddragonVersion: string | null, championName: string | null): string | null {
  if (!ddragonVersion || !championName) {
    return null
  }

  return `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion/${championName}.png`
}

export function buildSpellIconUrl(ddragonVersion: string | null, spellKey: string | number | null): string | null {
  if (!ddragonVersion || spellKey === null) {
    return null
  }

  return `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/spell/Summoner${spellKey}.png`
}

export function buildRuneIconUrl(runeId: number | null): string | null {
  if (runeId === null) {
    return null
  }

  return `https://ddragon.leagueoflegends.com/cdn/img/perk/${runeId}.png`
}

export function buildSkinSplashUrl(championName: string | null, skinNum: number | null): string | null {
  if (!championName || skinNum === null) {
    return null
  }

  return `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${championName}_${skinNum}.jpg`
}

export function buildMapIconUrl(ddragonVersion: string | null, mapId: number | null): string | null {
  if (!ddragonVersion || mapId === null) {
    return null
  }

  return `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/map/map${mapId}.png`
}

export function formatChampionLabel(
  championId: number | null,
  championNamesById: Record<number, string>,
  unknownLabel: string,
): string {
  if (championId === null) {
    return unknownLabel
  }

  const name = championNamesById[championId]
  if (!name) {
    return String(championId)
  }

  return `${name} (#${championId})`
}

function readNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return []
  }

  const result: number[] = []
  for (const item of value) {
    if (typeof item === 'number') {
      result.push(item)
      continue
    }

    if (typeof item === 'string') {
      const parsed = Number(item)
      if (Number.isFinite(parsed)) {
        result.push(parsed)
      }
    }
  }

  return result
}

export function deriveLobbyQueueOptions(
  queueCatalog: unknown,
  enabledQueueIdsValue: unknown,
  defaultQueueIdsValue: unknown,
): LobbyQueueOption[] {
  const enabledQueueIds = new Set(readNumberArray(enabledQueueIdsValue))
  const defaultQueueIds = readNumberArray(defaultQueueIdsValue)

  if (!Array.isArray(queueCatalog)) {
    return []
  }

  const options: LobbyQueueOption[] = []
  for (const entry of queueCatalog) {
    const candidate = readObject(entry)
    if (!candidate) {
      continue
    }

    if (candidate.category !== 'PvP' || candidate.queueAvailability !== 'Available') {
      continue
    }

    if (typeof candidate.id !== 'number' || !enabledQueueIds.has(candidate.id)) {
      continue
    }

    const description = typeof candidate.description === 'string' ? candidate.description : `Queue ${candidate.id}`

    options.push({
      id: candidate.id,
      description,
      mapId: typeof candidate.mapId === 'number' ? candidate.mapId : null,
    })
  }

  options.sort((left, right) => {
    const leftDefaultIndex = defaultQueueIds.indexOf(left.id)
    const rightDefaultIndex = defaultQueueIds.indexOf(right.id)

    if (leftDefaultIndex !== -1 && rightDefaultIndex !== -1) {
      return leftDefaultIndex - rightDefaultIndex
    }

    if (leftDefaultIndex !== -1) {
      return -1
    }

    if (rightDefaultIndex !== -1) {
      return 1
    }

    return left.description.localeCompare(right.description)
  })

  return options
}

export function readQueueDodgePenaltySeconds(errorsValue: unknown): number {
  if (!Array.isArray(errorsValue)) {
    return -1
  }

  let maxPenalty = -1
  for (const errorEntry of errorsValue) {
    const candidate = readObject(errorEntry)
    if (!candidate || typeof candidate.penaltyTimeRemaining !== 'number') {
      continue
    }

    maxPenalty = Math.max(maxPenalty, candidate.penaltyTimeRemaining)
  }

  return maxPenalty
}

export function formatRolePair(firstRole: string, secondRole: string, roleFillLabel: string, roleUnsetLabel: string): string {
  if (firstRole === 'FILL') {
    return roleFillLabel
  }

  if (firstRole === 'UNSELECTED' && secondRole === 'UNSELECTED') {
    return roleUnsetLabel
  }

  return `${firstRole} / ${secondRole}`
}

export function readSuggestedPlayers(content: unknown): SuggestedPlayer[] {
  if (!Array.isArray(content)) {
    return []
  }

  const suggestions: SuggestedPlayer[] = []
  for (const value of content) {
    if (typeof value !== 'object' || value === null) {
      continue
    }

    const candidate = value as {
      summonerId?: unknown
      summonerName?: unknown
    }

    if (typeof candidate.summonerId !== 'number' || typeof candidate.summonerName !== 'string') {
      continue
    }

    suggestions.push({
      summonerId: candidate.summonerId,
      summonerName: candidate.summonerName,
    })
  }

  return suggestions
}
