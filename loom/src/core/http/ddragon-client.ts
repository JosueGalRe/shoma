import { queryOptions, useQuery } from '@tanstack/react-query'
import * as v from 'valibot'
import ky, { HTTPError } from 'ky'

import { ChampionId, RuneId, type ChampionId as ChampionIdType } from '@/core/types/branded'

// Data Dragon uses HTTP-level request deduplication and asset URL memoization here;
// these maps do not represent application state or domain cache layers.

export type DdragonLanguage = 'en' | 'es'

const finiteNumber = v.custom<number>((value) => typeof value === 'number' && Number.isFinite(value))
const nonEmptyString = v.custom<string>((value) => typeof value === 'string' && value.length > 0)

const DdragonImageSchema = v.object({
  full: nonEmptyString,
  sprite: nonEmptyString,
  group: nonEmptyString,
  x: finiteNumber,
  y: finiteNumber,
  w: finiteNumber,
  h: finiteNumber,
})

const ChampionRawSummarySchema = v.object({
  id: nonEmptyString,
  key: nonEmptyString,
  name: nonEmptyString,
  title: nonEmptyString,
  tags: v.fallback(v.array(v.string()), []),
  partype: nonEmptyString,
  image: DdragonImageSchema,
  stats: v.record(v.string(), finiteNumber),
})

const ChampionSummarySchema = v.object({
  id: v.pipe(finiteNumber, v.transform((value) => ChampionId(value))),
  key: nonEmptyString,
  name: nonEmptyString,
  title: nonEmptyString,
  tags: v.array(v.string()),
  partype: nonEmptyString,
  image: DdragonImageSchema,
  stats: v.record(v.string(), finiteNumber),
})

const ChampionSpellSchema = v.object({
  id: nonEmptyString,
  name: nonEmptyString,
  description: nonEmptyString,
  tooltip: nonEmptyString,
  image: DdragonImageSchema,
})

const ChampionPassiveSchema = v.object({
  name: v.fallback(v.string(), ''),
  description: v.fallback(v.string(), ''),
  image: DdragonImageSchema,
})

const ChampionSkinSchema = v.object({
  id: nonEmptyString,
  num: finiteNumber,
  name: nonEmptyString,
  chromas: v.boolean(),
})

const RuneSchema = v.object({
  id: v.pipe(finiteNumber, v.transform((value) => RuneId(value))),
  key: nonEmptyString,
  icon: nonEmptyString,
  name: nonEmptyString,
  shortDesc: nonEmptyString,
  longDesc: nonEmptyString,
})

const RuneTreeSchema = v.object({
  id: v.pipe(finiteNumber, v.transform((value) => RuneId(value))),
  key: nonEmptyString,
  icon: nonEmptyString,
  name: nonEmptyString,
  slots: v.array(v.object({ runes: v.array(RuneSchema) })),
})

const ChampionDetailsRawSchema = v.object({
  blurb: nonEmptyString,
  lore: nonEmptyString,
  passive: ChampionPassiveSchema,
  skins: v.fallback(v.array(v.unknown()), []),
  spells: v.fallback(v.array(v.unknown()), []),
})

const ChampionPayloadSchema = v.object({
  data: v.record(v.string(), v.unknown()),
})

export type ChampionSummary = v.InferOutput<typeof ChampionSummarySchema>
export type ChampionSpell = v.InferOutput<typeof ChampionSpellSchema>
export type ChampionSkin = v.InferOutput<typeof ChampionSkinSchema>
export type RuneTree = v.InferOutput<typeof RuneTreeSchema>

export type ChampionDetails = ChampionSummary & {
  lore: string
  blurb: string
  passive: {
    name: string
    description: string
    image: v.InferOutput<typeof DdragonImageSchema>
  }
  spells: ChampionSpell[]
  skins: ChampionSkin[]
}

function parseOrNull<const TSchema extends v.GenericSchema>(schema: TSchema, content: unknown): v.InferOutput<TSchema> | null {
  const parsed = v.safeParse(schema, content)
  return parsed.success ? parsed.output : null
}

const DDRAGON_BASE_URL = 'https://ddragon.leagueoflegends.com'
const COMMUNITY_DRAGON_BASE_URL = 'https://raw.communitydragon.org'
// This localStorage namespace is an HTTP cache for external Data Dragon metadata,
// not UI/application state. Keep it out of Zustand persistence and settings-store.
const CACHE_PREFIX = 'mimic:ddragon:'
const HTTP_VERSION_CACHE_KEY = `${CACHE_PREFIX}latest-version`
const DEFAULT_LANGUAGE: DdragonLanguage = 'en'
const HTTP_TIMEOUT_MS = 10_000

export function communityDragonSplashUrl(championKey: string, skinNum: number): string {
  return `${COMMUNITY_DRAGON_BASE_URL}/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-splashes/${championKey}/${skinNum}.jpg`
}

const ddragonClient = ky.create({
  prefix: DDRAGON_BASE_URL,
  timeout: HTTP_TIMEOUT_MS,
  retry: {
    limit: 2,
    methods: ['get'],
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
  },
})

const latestVersionHttpDedupCache = new Map<string, Promise<string>>()
const httpResponseDedupCache = new Map<string, unknown>()
const assetUrlDedupCache = new Map<string, string | null>()

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}

function createHttpError(message: string, cause?: unknown): Error {
  return new Error(message, { cause })
}

function parseChampionSummary(entry: unknown): ChampionSummary | null {
  const candidate = parseOrNull(ChampionRawSummarySchema, entry)
  if (!candidate) {
    return null
  }

  const numericId = Number(candidate.key)
  if (!Number.isFinite(numericId)) {
    return null
  }

  return {
    id: ChampionId(numericId),
    key: candidate.id,
    name: candidate.name,
    title: candidate.title,
    tags: candidate.tags,
    partype: candidate.partype,
    image: candidate.image,
    stats: candidate.stats,
  }
}

function parseChampionDetails(entry: unknown): ChampionDetails | null {
  const summary = parseChampionSummary(entry)
  const raw = parseOrNull(ChampionDetailsRawSchema, entry)
  if (!summary || !raw) {
    return null
  }

  return {
    ...summary,
    lore: raw.lore,
    blurb: raw.blurb,
    passive: raw.passive,
    spells: raw.spells.flatMap((spell) => {
      const parsed = parseOrNull(ChampionSpellSchema, spell)
      return parsed ? [parsed] : []
    }),
    skins: raw.skins.flatMap((skin) => {
      const parsed = parseOrNull(ChampionSkinSchema, skin)
      return parsed ? [parsed] : []
    }),
  }
}

function parseRuneTree(entry: unknown): RuneTree | null {
  const raw = parseOrNull(v.object({
    id: finiteNumber,
    key: nonEmptyString,
    icon: nonEmptyString,
    name: nonEmptyString,
    slots: v.fallback(v.array(v.unknown()), []),
  }), entry)
  if (!raw) {
    return null
  }

  return {
    id: RuneId(raw.id),
    key: raw.key,
    icon: raw.icon,
    name: raw.name,
    slots: raw.slots.flatMap((slot) => {
      const parsedSlot = parseOrNull(v.object({ runes: v.fallback(v.array(v.unknown()), []) }), slot)
      if (!parsedSlot) {
        return []
      }

      return [{
        runes: parsedSlot.runes.flatMap((rune) => {
          const parsed = parseOrNull(RuneSchema, rune)
          return parsed ? [parsed] : []
        }),
      }]
    }),
  }
}

function parseChampionList(content: unknown): ChampionSummary[] {
  const candidate = parseOrNull(ChampionPayloadSchema, content)
  if (!candidate) {
    return []
  }

  const champions = Object.values(candidate.data).flatMap((value) => {
    const summary = parseChampionSummary(value)
    return summary ? [summary] : []
  })

  champions.sort((left, right) => left.name.localeCompare(right.name))
  return champions
}

async function readJson<const TSchema extends v.GenericSchema>(request: Promise<unknown>, schema: TSchema, message: string): Promise<v.InferOutput<TSchema>> {
  try {
    const parsed = v.safeParse(schema, await request)
    if (!parsed.success) {
      throw createHttpError(message)
    }

    return parsed.output
  } catch (error) {
    if (error instanceof HTTPError) {
      throw createHttpError(message + ' (' + error.response.status + ')', error)
    }

    throw error instanceof Error && error.message === message ? error : createHttpError(message, error)
  }
}

function getCachedVersion(): string | null {
  if (!isBrowser()) {
    return null
  }

  const stored = localStorage.getItem(HTTP_VERSION_CACHE_KEY)
  return stored && stored.length > 0 ? stored : null
}

function setCachedVersion(version: string): void {
  if (!isBrowser()) {
    return
  }

  localStorage.setItem(HTTP_VERSION_CACHE_KEY, version)
}

async function getLatestDdragonVersion(): Promise<string> {
  const cached = getCachedVersion()
  if (cached) {
    return cached
  }

  const cachedPromise = latestVersionHttpDedupCache.get('latest')
  if (cachedPromise) {
    return cachedPromise
  }

  const request = readJson(ddragonClient.get('api/versions.json').json<unknown>(), v.array(v.string()), 'Failed to load Data Dragon versions').then((versions) => {
    if (versions.length === 0 || typeof versions[0] !== 'string') {
      throw createHttpError('Data Dragon versions payload was invalid')
    }

    setCachedVersion(versions[0])
    return versions[0]
  })

  latestVersionHttpDedupCache.set('latest', request)
  try {
    return await request
  } finally {
    latestVersionHttpDedupCache.delete('latest')
  }
}

function resolveLocale(language: DdragonLanguage): string {
  return language === 'es' ? 'es_MX' : 'en_US'
}

function championListCacheKey(version: string, language: DdragonLanguage): string {
  return `${CACHE_PREFIX}champion-list:${version}:${language}`
}

function championDetailsCacheKey(version: string, language: DdragonLanguage, championKey: string): string {
  return `${CACHE_PREFIX}champion:${version}:${language}:${championKey}`
}

function runeCacheKey(version: string, language: DdragonLanguage): string {
  return `${CACHE_PREFIX}runes:${version}:${language}`
}

async function cachedJson<T>(cacheKey: string, loader: () => Promise<T>): Promise<T> {
  const cached = httpResponseDedupCache.get(cacheKey)
  if (cached !== undefined) {
    return cached as T
  }

  const value = await loader()
  httpResponseDedupCache.set(cacheKey, value)
  return value
}

async function getChampions(version: string, language: DdragonLanguage = DEFAULT_LANGUAGE): Promise<ChampionSummary[]> {
  return cachedJson(championListCacheKey(version, language), async () => {
    const locale = resolveLocale(language)
    const payload = await ddragonClient.get(`cdn/${version}/data/${locale}/champion.json`).json<unknown>()
    return parseChampionList(payload)
  })
}

async function getChampion(version: string, championId: ChampionIdType, language: DdragonLanguage = DEFAULT_LANGUAGE): Promise<ChampionDetails | null> {
  const champions = await getChampions(version, language)
  const summary = champions.find((entry) => entry.id === championId)
  if (!summary) {
    return null
  }

  return getChampionDetail(version, summary.key, language)
}

async function getChampionDetail(version: string, championKey: string, language: DdragonLanguage = DEFAULT_LANGUAGE): Promise<ChampionDetails | null> {
  const normalizedChampionKey = championKey.trim()
  if (!normalizedChampionKey) {
    return null
  }

  return cachedJson(championDetailsCacheKey(version, language, normalizedChampionKey), async () => {
    const locale = resolveLocale(language)
    const payload = await ddragonClient.get(`cdn/${version}/data/${locale}/champion/${normalizedChampionKey}.json`).json<unknown>()
    const candidate = parseOrNull(ChampionPayloadSchema, payload)
    if (!candidate) {
      return null
    }

    const rawChampion = candidate.data[normalizedChampionKey]
    const parsed = parseChampionDetails(rawChampion)
    return parsed
  })
}

async function getProfileIconUrl(version: string, iconId: number): Promise<string | null> {
  if (iconId < 0) {
    return null
  }

  const cacheKey = `${CACHE_PREFIX}profile-icon:${version}:${iconId}`
  const cached = assetUrlDedupCache.get(cacheKey)
  if (cached !== undefined) {
    return cached
  }

  const url = `${DDRAGON_BASE_URL}/cdn/${version}/img/profileicon/${iconId}.png`
  try {
    await ddragonClient.head(`cdn/${version}/img/profileicon/${iconId}.png`)
    assetUrlDedupCache.set(cacheKey, url)
    return url
  } catch (error) {
    if (error instanceof HTTPError && error.response.status === 404) {
  assetUrlDedupCache.set(cacheKey, null)
      return null
    }

    throw createHttpError('Failed to load profile icon', error)
  }
}

async function getRunes(version: string, language: DdragonLanguage = DEFAULT_LANGUAGE): Promise<RuneTree[]> {
  return cachedJson(runeCacheKey(version, language), async () => {
    const locale = resolveLocale(language)
    const payload = await ddragonClient.get(`cdn/${version}/data/${locale}/runesReforged.json`).json<unknown>()
    if (!Array.isArray(payload)) {
      return []
    }

    const runes: RuneTree[] = []
    for (const entry of payload) {
      const parsed = parseRuneTree(entry)
      if (parsed) {
        runes.push(parsed)
      }
    }

    return runes
  })
}

async function getChampionSkins(version: string, championId: ChampionIdType, language: DdragonLanguage = DEFAULT_LANGUAGE): Promise<ChampionSkin[]> {
  const champion = await getChampion(version, championId, language)
  return champion?.skins ?? []
}

function latestDdragonVersionQueryOptions() {
  return queryOptions({
    queryKey: ['ddragon', 'latest-version'] as const,
    queryFn: getLatestDdragonVersion,
    staleTime: 24 * 60 * 60 * 1000,
  })
}

export function profileIconQueryOptions(version: string, iconId: number) {
  return queryOptions({
    queryKey: ['ddragon', 'profile-icon', version, iconId] as const,
    queryFn: () => getProfileIconUrl(version, iconId),
    staleTime: 24 * 60 * 60 * 1000,
  })
}

export function useLatestDdragonVersion() {
  return useQuery(latestDdragonVersionQueryOptions())
}

export function useChampions(language: DdragonLanguage = DEFAULT_LANGUAGE) {
  const versionQuery = useLatestDdragonVersion()

  return useQuery({
    queryKey: ['ddragon', 'champions', versionQuery.data, language] as const,
    queryFn: () => getChampions(versionQuery.data ?? '', language),
    enabled: versionQuery.isSuccess,
    staleTime: 24 * 60 * 60 * 1000,
  })
}

export function useRunes(language: DdragonLanguage = DEFAULT_LANGUAGE) {
  const versionQuery = useLatestDdragonVersion()

  return useQuery({
    queryKey: ['ddragon', 'runes', versionQuery.data, language] as const,
    queryFn: () => getRunes(versionQuery.data ?? '', language),
    enabled: versionQuery.isSuccess,
    staleTime: 24 * 60 * 60 * 1000,
  })
}

export function useChampionDetail(championKey: string | undefined, language: DdragonLanguage = DEFAULT_LANGUAGE) {
  const versionQuery = useLatestDdragonVersion()

  return useQuery({
    queryKey: ['ddragon', 'champion-detail', versionQuery.data, championKey, language] as const,
    queryFn: () => getChampionDetail(versionQuery.data ?? '', championKey ?? '', language),
    enabled: versionQuery.isSuccess && typeof championKey === 'string' && championKey.length > 0,
    staleTime: 24 * 60 * 60 * 1000,
  })
}

export function useChampionSkins(championId: ChampionIdType | undefined, language: DdragonLanguage = DEFAULT_LANGUAGE) {
  const versionQuery = useLatestDdragonVersion()

  return useQuery({
    queryKey: ['ddragon', 'champion-skins', versionQuery.data, championId, language] as const,
    queryFn: () => getChampionSkins(versionQuery.data ?? '', championId ?? ChampionId(-1), language),
    enabled: versionQuery.isSuccess && typeof championId === 'number',
    staleTime: 24 * 60 * 60 * 1000,
  })
}

// @knip
export {
  getChampion,
  getChampionDetail,
  getChampions,
  getLatestDdragonVersion,
  getProfileIconUrl,
}
