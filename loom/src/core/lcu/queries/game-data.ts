import { LcuPaths } from '@shoma/protocol-contract'
import { boolean, type InferOutput, string } from 'valibot'

import { parseOrNull, unknownRecord } from '../parsers/base'
import { parseChampionIdArray, parseChampSelectSession, parsePickableSkinIds, parseWardSkins } from '../parsers/champ-select'
import { parseChampionMastery, parseQueueChampions, type QueueChampion } from '../parsers/champions'
import { parseClashTournaments } from '../parsers/clash'
import { parseGameQueues } from '../parsers/game-queues'
import { parseGameMaps } from '../parsers/maps'
import {
  parsePerkPages,
  parsePerks,
  parsePerkStyles,
  parseRecommendedPages,
  type Perk,
  type PerkStyle,
  type RecommendedPage,
} from '../parsers/perks'
import { parseBannerSkins, parsePlayerRegalia, type PlayerRegalia } from '../parsers/regalia'
import { type ChampSelectSettings, parseChampSelectSettings, parseFavoriteChampionIds } from '../parsers/settings'
import { type ChampionSkin, parseChampionSkins } from '../parsers/skins'

import { lcuQueryKey } from './descriptor-utils'

import type { ChampSelectSession } from '../../../features/champ-select/champ-select-actions'
import type { LcuQueryDescriptor } from './descriptor-types'

export const champSelectSessionDescriptor = {
  parse: parseChampSelectSession,
  path: LcuPaths.champSelect.session,
  queryKey: lcuQueryKey(LcuPaths.champSelect.session),
} satisfies LcuQueryDescriptor<ChampSelectSession>

export const subsetChampionListDescriptor = {
  notFoundValue: [],
  parse: parseChampionIdArray,
  path: LcuPaths.champSelect.subsetChampionList,
  queryKey: lcuQueryKey(LcuPaths.champSelect.subsetChampionList),
} satisfies LcuQueryDescriptor<ReturnType<typeof parseChampionIdArray>>

export const pickableChampionIdsDescriptor = {
  notFoundValue: [],
  parse: parseChampionIdArray,
  path: LcuPaths.champSelect.pickableChampionIds,
  queryKey: lcuQueryKey(LcuPaths.champSelect.pickableChampionIds),
} satisfies LcuQueryDescriptor<ReturnType<typeof parseChampionIdArray>>

export const bannableChampionIdsDescriptor = {
  notFoundValue: [],
  parse: parseChampionIdArray,
  path: LcuPaths.champSelect.bannableChampionIds,
  queryKey: lcuQueryKey(LcuPaths.champSelect.bannableChampionIds),
} satisfies LcuQueryDescriptor<ReturnType<typeof parseChampionIdArray>>

export const pickableSkinIdsDescriptor = {
  notFoundValue: [],
  parse: parsePickableSkinIds,
  path: LcuPaths.champSelect.pickableSkinIds,
  queryKey: lcuQueryKey(LcuPaths.champSelect.pickableSkinIds),
} satisfies LcuQueryDescriptor<ReturnType<typeof parsePickableSkinIds>>

export function wardSkinsDescriptor(summonerId: number) {
  const path = LcuPaths.collections.wardSkins(summonerId)

  return {
    notFoundValue: [],
    parse: parseWardSkins,
    path,
    queryKey: lcuQueryKey(path),
    staleTime: Infinity,
  } satisfies LcuQueryDescriptor<ReturnType<typeof parseWardSkins>>
}

export const bannerSkinsDescriptor = {
  parse: parseBannerSkins,
  path: LcuPaths.assetServing.regalia,
  queryKey: lcuQueryKey(LcuPaths.assetServing.regalia),
  staleTime: Infinity,
} satisfies LcuQueryDescriptor<Record<string, string>>

export function playerRegaliaDescriptor(puuid: string) {
  const path = LcuPaths.challenges.playerSummary(puuid)

  return {
    parse: parsePlayerRegalia,
    path,
    queryKey: lcuQueryKey(path),
    // Players change them between games, not while in a lobby
    staleTime: 5 * 60_000,
  } satisfies LcuQueryDescriptor<PlayerRegalia>
}

// Swift Play's champion picker: what the player can take into the lobby's queue
export function queueChampionsDescriptor(summonerId: number, queueId: number) {
  const path = LcuPaths.champions.queueChampionsMinimal(summonerId, queueId)

  return {
    notFoundValue: [],
    parse: parseQueueChampions,
    path,
    queryKey: lcuQueryKey(path),
    staleTime: 5 * 60_000,
  } satisfies LcuQueryDescriptor<QueueChampion[]>
}

export function championSkinsDescriptor(summonerId: number, championId: number) {
  const path = LcuPaths.champions.championSkins(summonerId, championId)

  return {
    notFoundValue: [],
    parse: parseChampionSkins,
    path,
    queryKey: lcuQueryKey(path),
    staleTime: 5 * 60_000,
  } satisfies LcuQueryDescriptor<ChampionSkin[]>
}

export const championMasteryDescriptor = {
  parse: parseChampionMastery,
  path: LcuPaths.championMastery.localPlayer,
  queryKey: lcuQueryKey(LcuPaths.championMastery.localPlayer),
  staleTime: 5 * 60_000,
} satisfies LcuQueryDescriptor<Map<number, number>>

export const favoriteChampionsDescriptor = {
  parse: parseFavoriteChampionIds,
  path: LcuPaths.settings.champSelectPreferences,
  queryKey: lcuQueryKey(LcuPaths.settings.champSelectPreferences),
} satisfies LcuQueryDescriptor<Set<number>>

export const champSelectSettingsDescriptor = {
  parse: parseChampSelectSettings,
  path: LcuPaths.settings.champSelect,
  queryKey: lcuQueryKey(LcuPaths.settings.champSelect),
} satisfies LcuQueryDescriptor<ChampSelectSettings>

// The client's rune recommender for a champion in a position on a map
export function recommendedPagesDescriptor(championId: number, position: string, mapId: number) {
  const path = LcuPaths.perks.recommendedPages(championId, position, mapId)

  return {
    notFoundValue: [],
    parse: parseRecommendedPages,
    path,
    queryKey: lcuQueryKey(path),
    staleTime: 5 * 60_000,
  } satisfies LcuQueryDescriptor<RecommendedPage[]>
}

export const gameQueuesDescriptor = {
  parse: parseGameQueues,
  path: LcuPaths.gameQueues.queues,
  queryKey: lcuQueryKey(LcuPaths.gameQueues.queues),
  staleTime: Infinity,
} satisfies LcuQueryDescriptor<ReturnType<typeof parseGameQueues>>

export const gameMapsDescriptor = {
  parse: parseGameMaps,
  path: LcuPaths.maps.maps,
  queryKey: lcuQueryKey(LcuPaths.maps.maps),
  staleTime: Infinity,
} satisfies LcuQueryDescriptor<ReturnType<typeof parseGameMaps>>

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

export const perkStylesDescriptor = {
  parse: parsePerkStyles,
  path: LcuPaths.perks.styles,
  queryKey: lcuQueryKey(LcuPaths.perks.styles),
  staleTime: Infinity,
} satisfies LcuQueryDescriptor<PerkStyle[]>

export const perksDescriptor = {
  parse: parsePerks,
  path: LcuPaths.perks.perks,
  queryKey: lcuQueryKey(LcuPaths.perks.perks),
  staleTime: Infinity,
} satisfies LcuQueryDescriptor<Map<number, Perk>>

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
