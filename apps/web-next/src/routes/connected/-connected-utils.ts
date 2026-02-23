import type { AudioContextConstructor } from './-connected-types'

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
