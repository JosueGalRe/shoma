import { LcuPaths } from '@shoma/protocol-contract'
import { boolean, type InferOutput, string } from 'valibot'

import { parseOrNull, unknownRecord } from '../parsers/base'
import { parseChampSelectSession } from '../parsers/champ-select'
import { parseClashTournaments } from '../parsers/clash'
import { parseGameQueues } from '../parsers/game-queues'
import { parsePerkPages } from '../parsers/perks'

import { lcuQueryKey } from './descriptor-utils'

import type { ChampSelectSession } from '../../../features/champ-select/champ-select-store'
import type { LcuQueryDescriptor } from './descriptor-types'

export const champSelectSessionDescriptor = {
  parse: parseChampSelectSession,
  path: LcuPaths.champSelect.session,
  queryKey: lcuQueryKey(LcuPaths.champSelect.session),
} satisfies LcuQueryDescriptor<ChampSelectSession>

export const gameQueuesDescriptor = {
  parse: parseGameQueues,
  path: LcuPaths.gameQueues.queues,
  queryKey: lcuQueryKey(LcuPaths.gameQueues.queues),
  staleTime: Infinity,
} satisfies LcuQueryDescriptor<ReturnType<typeof parseGameQueues>>

export const clashTournamentsDescriptor = {
  parse: parseClashTournaments,
  path: LcuPaths.clash.tournaments,
  queryKey: lcuQueryKey(LcuPaths.clash.tournaments),
  staleTime: 60_000,
} satisfies LcuQueryDescriptor<ReturnType<typeof parseClashTournaments>>

export const clashVisibleDescriptor = {
  parse: (content: unknown): boolean => {
    const parsed = parseOrNull(boolean(), content)

    return parsed ?? false
  },
  path: LcuPaths.clash.visible,
  queryKey: lcuQueryKey(LcuPaths.clash.visible),
  staleTime: 30_000,
} satisfies LcuQueryDescriptor<boolean>

export const perksPagesDescriptor = {
  parse: parsePerkPages,
  path: LcuPaths.perks.pages,
  queryKey: lcuQueryKey(LcuPaths.perks.pages),
} satisfies LcuQueryDescriptor<ReturnType<typeof parsePerkPages>>

export const perksCurrentPageDescriptor = {
  parse: (content: unknown) => {
    return parseOrNull(unknownRecord, content)
  },
  path: LcuPaths.perks.currentPage,
  queryKey: lcuQueryKey(LcuPaths.perks.currentPage),
} satisfies LcuQueryDescriptor<InferOutput<typeof unknownRecord>>

export function platformConfigDescriptor(namespace: string, key: string) {
  const path = LcuPaths.platformConfig.namespaceKey(namespace, key)

  return {
    parse: (content: unknown) => {
      return parseOrNull(string(), content)
    },
    path,
    queryKey: lcuQueryKey(path),
    staleTime: Infinity,
  } satisfies LcuQueryDescriptor<string>
}
