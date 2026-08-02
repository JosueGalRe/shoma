import { LcuPaths } from '@shoma/protocol-contract'
import { fallback, type InferOutput, nonEmpty, object, optional, pipe, string, transform } from 'valibot'

import { SpellId } from '../../types/branded'
import { finiteNumber, parseObjectOrNull, parseOrNull, unknownArray, unknownRecord } from '../parsers/base'
import { parseRerollPoints } from '../parsers/champ-select'

import { lcuQueryKey } from './descriptor-utils'

import type { LcuQueryDescriptor } from './descriptor-types'
import type { RegionLocale } from './summoner-types'

const NonEmptyStringSchema = pipe(string(), nonEmpty())

const SummonerSpellSchema = object({
  description: fallback(optional(string()), undefined),
  gameModes: pipe(
    fallback(optional(unknownArray), undefined),
    transform((values) => {
      return values?.flatMap((mode) => {
        return typeof mode === 'string' && mode.length > 0 ? [mode] : []
      })
    }),
  ),
  iconPath: fallback(optional(string()), undefined),
  id: pipe(
    finiteNumber,
    transform((value) => {
      return SpellId(value)
    }),
  ),
  name: NonEmptyStringSchema,
})

export type SummonerSpell = InferOutput<typeof SummonerSpellSchema>

function parseSummonerSpell(value: unknown): SummonerSpell | null {
  return parseObjectOrNull(SummonerSpellSchema, value)
}

export const summonerSpellsDescriptor = {
  parse: (content: unknown) => {
    return (
      parseOrNull(unknownArray, content)?.flatMap((spell) => {
        return parseSummonerSpell(spell) ?? []
      }) ?? null
    )
  },
  path: LcuPaths.assetServing.summonerSpells,
  queryKey: lcuQueryKey(LcuPaths.assetServing.summonerSpells),
  staleTime: Infinity,
} satisfies LcuQueryDescriptor<SummonerSpell[]>

export const currentSummonerDescriptor = {
  parse: (content: unknown) => {
    return parseObjectOrNull(unknownRecord, content)
  },
  path: LcuPaths.summoner.currentSummoner,
  queryKey: lcuQueryKey(LcuPaths.summoner.currentSummoner),
} satisfies LcuQueryDescriptor<InferOutput<typeof unknownRecord>>

export const rerollPointsDescriptor = {
  parse: parseRerollPoints,
  path: LcuPaths.summoner.currentSummonerRerollPoints,
  queryKey: lcuQueryKey(LcuPaths.summoner.currentSummonerRerollPoints),
} satisfies LcuQueryDescriptor<ReturnType<typeof parseRerollPoints>>

const RegionLocaleSchema = object({
  locale: fallback(string(), 'en_US'),
  region: fallback(string(), ''),
  webLanguage: fallback(string(), 'en'),
  webRegion: fallback(string(), ''),
})

function parseRegionLocale(content: unknown): RegionLocale {
  const parsed = parseObjectOrNull(RegionLocaleSchema, content)

  return parsed ?? { locale: 'en_US', region: '', webLanguage: 'en', webRegion: '' }
}

export const regionLocaleDescriptor = {
  parse: parseRegionLocale,
  path: '/riotclient/region-locale',
  queryKey: lcuQueryKey('/riotclient/region-locale'),
  staleTime: 60_000,
} satisfies LcuQueryDescriptor<RegionLocale>
