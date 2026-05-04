import { queryOptions } from '@tanstack/react-query'
import { LcuPaths } from '@mimic/protocol-contract'

import type { ChampSelectSession } from '../../features/champ-select/champ-select-store'
import type { LcuTransport } from '../rift/lcu-transport'
import {
  emptyLobbyQueueStatus,
  parseInvites,
  parseLobbyMembers,
  parseQueueSearchState,
  parseQueueStatus,
  parseReadyCheck,
  parseRerollPoints,
  readArray,
  readObject,
  readString,
  type QueueSearchState,
} from './parsers'

export type LcuQueryDescriptor<TDomain> = {
  path: string
  queryKey: readonly unknown[]
  parse: (content: unknown) => TDomain | null
  enabled?: (transport: LcuTransport | null) => boolean
  notFoundValue?: TDomain | null
}

export type SummonerSpell = {
  description?: string
  gameModes?: string[]
  iconPath?: string
  id: number
  name: string
}

function lcuQueryKey(path: string): readonly ['lcu', string] {
  return ['lcu', path] as const
}

function readErrorStatus(error: unknown): number | null {
  if (typeof error !== 'object' || error === null || !('status' in error)) {
    return null
  }

  const status = (error as { status?: unknown }).status
  return typeof status === 'number' ? status : null
}

export function createLcuQueryOptions<TDomain>(descriptor: LcuQueryDescriptor<TDomain>, transport: LcuTransport | null) {
  return queryOptions({
    queryKey: descriptor.queryKey,
    queryFn: async () => {
      if (!transport) throw new Error('No transport')

      try {
        const result = await transport.request(descriptor.path)
        if (result.status === 404) {
          return descriptor.notFoundValue ?? null
        }

        return descriptor.parse(result.content)
      } catch (error) {
        if (readErrorStatus(error) === 404) {
          return descriptor.notFoundValue ?? null
        }

        throw error
      }
    },
    enabled: descriptor.enabled ? descriptor.enabled(transport) : !!transport,
    staleTime: Infinity,
  })
}

export const lobbyDescriptor = {
  path: LcuPaths.lobby.lobby,
  queryKey: lcuQueryKey(LcuPaths.lobby.lobby),
  parse: (content: unknown) => parseLobbyMembers(content, {}, null),
} satisfies LcuQueryDescriptor<ReturnType<typeof parseLobbyMembers>>

export const queueDescriptor = {
  path: LcuPaths.matchmaking.search,
  queryKey: lcuQueryKey(LcuPaths.matchmaking.search),
  parse: (content: unknown) => parseQueueStatus(content, null),
  notFoundValue: emptyLobbyQueueStatus,
} satisfies LcuQueryDescriptor<ReturnType<typeof parseQueueStatus>>

export const invitesDescriptor = {
  path: LcuPaths.lobby.receivedInvitations,
  queryKey: lcuQueryKey(LcuPaths.lobby.receivedInvitations),
  parse: parseInvites,
} satisfies LcuQueryDescriptor<ReturnType<typeof parseInvites>>

export const currentSummonerDescriptor = {
  path: LcuPaths.summoner.currentSummoner,
  queryKey: lcuQueryKey(LcuPaths.summoner.currentSummoner),
  parse: (content: unknown) => readObject(content),
} satisfies LcuQueryDescriptor<ReturnType<typeof readObject>>

export const readyCheckDescriptor = {
  path: LcuPaths.matchmaking.readyCheck,
  queryKey: lcuQueryKey(LcuPaths.matchmaking.readyCheck),
  parse: parseReadyCheck,
} satisfies LcuQueryDescriptor<ReturnType<typeof parseReadyCheck>>

export const queueSearchDescriptor = {
  path: LcuPaths.matchmaking.search,
  queryKey: lcuQueryKey(LcuPaths.matchmaking.search),
  parse: parseQueueSearchState,
  notFoundValue: {},
} satisfies LcuQueryDescriptor<QueueSearchState>

export const gameflowPhaseDescriptor = {
  path: LcuPaths.gameflow.phase,
  queryKey: lcuQueryKey(LcuPaths.gameflow.phase),
  parse: readString,
} satisfies LcuQueryDescriptor<ReturnType<typeof readString>>

export const champSelectSessionDescriptor = {
  path: LcuPaths.champSelect.session,
  queryKey: lcuQueryKey(LcuPaths.champSelect.session),
  parse: (content: unknown) => content as ChampSelectSession,
} satisfies LcuQueryDescriptor<ChampSelectSession>

export const summonerSpellsDescriptor = {
  path: LcuPaths.assetServing.summonerSpells,
  queryKey: lcuQueryKey(LcuPaths.assetServing.summonerSpells),
  parse: (content: unknown) => readArray(content) as SummonerSpell[] | null,
} satisfies LcuQueryDescriptor<SummonerSpell[]>

export const rerollPointsDescriptor = {
  path: LcuPaths.summoner.currentSummonerRerollPoints,
  queryKey: lcuQueryKey(LcuPaths.summoner.currentSummonerRerollPoints),
  parse: parseRerollPoints,
} satisfies LcuQueryDescriptor<ReturnType<typeof parseRerollPoints>>
