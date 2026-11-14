import {
  bannerSkinsDescriptor,
  championMasteryDescriptor,
  championSkinsDescriptor,
  champSelectSessionDescriptor,
  champSelectSettingsDescriptor,
  clashTournamentsDescriptor,
  currentSummonerDescriptor,
  favoriteChampionsDescriptor,
  gameflowPhaseDescriptor,
  gameMapsDescriptor,
  gameQueuesDescriptor,
  type LcuQueryDescriptor,
  lobbySessionDescriptor,
  perksDescriptor,
  perksPagesDescriptor,
  perkStylesDescriptor,
  platformConfigDescriptor,
  playerRegaliaDescriptor,
  queueChampionsDescriptor,
  queueDescriptor,
  queueSearchDescriptor,
  readyCheckDescriptor,
  recommendedPagesDescriptor,
  summonerSpellsDescriptor,
} from '@/core/lcu/queries'

import type { QueryClient } from '@tanstack/react-query'

type LcuMockAlias =
  | 'bannerSkins'
  | 'championMastery'
  | 'championSkins'
  | 'champSelectSession'
  | 'champSelectSettings'
  | 'clashTournaments'
  | 'currentSummoner'
  | 'defaultGameQueues'
  | 'favoriteChampions'
  | 'gameflowPhase'
  | 'gameMaps'
  | 'gameQueues'
  | 'lobbySession'
  | 'perks'
  | 'perkStyles'
  | 'perksPages'
  | 'playerRegalia'
  | 'queueChampions'
  | 'queueSearch'
  | 'queueStatus'
  | 'readyCheck'
  | 'recommendedPages'
  | 'summonerSpells'

type LcuMockDescriptor = LcuQueryDescriptor<unknown>
// A per-resource descriptor takes the resource's key (a puuid, say), passed as the mock's third argument
type LcuMockEntry = LcuMockDescriptor | ((key: string) => LcuMockDescriptor)

interface LcuMockUpdateDetail {
  alias: LcuMockAlias
  content: unknown
  path: string
  status: number
}

const mockDescriptors = {
  bannerSkins: bannerSkinsDescriptor,
  champSelectSession: champSelectSessionDescriptor,
  champSelectSettings: champSelectSettingsDescriptor,
  championMastery: championMasteryDescriptor,
  // Keyed "summonerId/championId"
  championSkins: (key: string) => {
    const [summonerId = 0, championId = 0] = key.split('/').map(Number)

    return championSkinsDescriptor(summonerId, championId)
  },
  clashTournaments: clashTournamentsDescriptor,
  currentSummoner: currentSummonerDescriptor,
  defaultGameQueues: platformConfigDescriptor('LcuSocial', 'DefaultGameQueues'),
  favoriteChampions: favoriteChampionsDescriptor,
  gameMaps: gameMapsDescriptor,
  gameQueues: gameQueuesDescriptor,
  gameflowPhase: gameflowPhaseDescriptor,
  lobbySession: lobbySessionDescriptor,
  perkStyles: perkStylesDescriptor,
  perks: perksDescriptor,
  perksPages: perksPagesDescriptor,
  playerRegalia: playerRegaliaDescriptor,
  // Keyed "summonerId/queueId"
  queueChampions: (key: string) => {
    const [summonerId = 0, queueId = 0] = key.split('/').map(Number)

    return queueChampionsDescriptor(summonerId, queueId)
  },
  queueSearch: queueSearchDescriptor,
  queueStatus: queueDescriptor,
  readyCheck: readyCheckDescriptor,
  // Keyed "championId/position", on Summoner's Rift
  recommendedPages: (key: string) => {
    const [championId = '0', position = ''] = key.split('/')

    return recommendedPagesDescriptor(Number(championId), position, 11)
  },
  summonerSpells: summonerSpellsDescriptor,
} satisfies Record<LcuMockAlias, LcuMockEntry>

declare global {
  // eslint-disable-next-line no-underscore-dangle -- Exposes a deliberate dev-console hook for mock LCU data.
  var __shomaMockLcu: ((alias: LcuMockAlias, data: unknown, key?: string) => void) | undefined
}

function readDescriptor(alias: string, key: string): [LcuMockAlias, LcuMockDescriptor] | null {
  if (isLcuMockAlias(alias)) {
    const entry: LcuMockEntry = mockDescriptors[alias]

    return [alias, typeof entry === 'function' ? entry(key) : entry]
  }

  return null
}

function isLcuMockAlias(alias: string): alias is LcuMockAlias {
  return alias in mockDescriptors
}

function parseMockValue(descriptor: LcuMockDescriptor, data: unknown): unknown {
  return descriptor.parse(data) ?? descriptor.notFoundValue ?? null
}

function emitMockUpdate(detail: LcuMockUpdateDetail): void {
  globalThis.dispatchEvent(new CustomEvent('shoma:lcu-mock-update', { detail }))
}

export function mountLcuMockDev(queryClient: QueryClient): void {
  // eslint-disable-next-line no-underscore-dangle -- Exposes a deliberate dev-console hook for mock LCU data.
  globalThis.__shomaMockLcu = (alias: LcuMockAlias, data: unknown, key = '') => {
    const descriptorEntry = readDescriptor(alias, key)

    if (!descriptorEntry) {
      throw new Error(`Unknown Sho'ma LCU mock alias: ${alias}`)
    }

    const [mockAlias, descriptor] = descriptorEntry
    const value = parseMockValue(descriptor, data)

    queryClient.setQueryData(descriptor.queryKey, value)
    emitMockUpdate({ alias: mockAlias, content: data, path: descriptor.path, status: 200 })
  }

  // DevTools usage:
  // Window.__shomaMockLcu('gameflowPhase', 'ReadyCheck')
  // Window.__shomaMockLcu('readyCheck', { state: 'InProgress', playerResponse: 'None' })
  // Window.__shomaMockLcu('gameQueues', [{ id: 420, category: 'PvP', description: 'Ranked Solo/Duo', ... }])
  // Window.__shomaMockLcu('playerRegalia', { bannerId: '10', topChallenges: [...] }, puuid)
}
