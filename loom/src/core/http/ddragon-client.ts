import { queryOptions, useQuery } from '@tanstack/react-query'
import ky, { HTTPError } from 'ky'
import { array, boolean, custom, fallback, type GenericSchema, type InferOutput, object, pipe, record, safeParse, string, transform, unknown } from 'valibot'

import { ChampionId, RuneId } from '@/core/types/branded'

type ChampionIdType = ReturnType<typeof ChampionId>

// Data Dragon uses HTTP-level request deduplication and asset URL memoization here;
// These maps do not represent application state or domain cache layers.

export type DdragonLanguage = 'en' | 'es'

const finiteNumber = custom<number>((value) => {
  return typeof value === 'number' && Number.isFinite(value)
})
const nonEmptyString = custom<string>((value) => {
  return typeof value === 'string' && value.length > 0
})

const DdragonImageSchema = object({
  full: nonEmptyString,
  group: nonEmptyString,
  h: finiteNumber,
  sprite: nonEmptyString,
  w: finiteNumber,
  x: finiteNumber,
  y: finiteNumber,
})

const ChampionRawSummarySchema = object({
  id: nonEmptyString,
  image: DdragonImageSchema,
  key: nonEmptyString,
  name: nonEmptyString,
  partype: nonEmptyString,
  stats: record(string(), finiteNumber),
  tags: fallback(array(string()), []),
  title: nonEmptyString,
})

const ChampionSummarySchema = object({
  id: pipe(
    finiteNumber,
    transform((value) => {
      return ChampionId(value)
    }),
  ),
  image: DdragonImageSchema,
  key: nonEmptyString,
  name: nonEmptyString,
  partype: nonEmptyString,
  stats: record(string(), finiteNumber),
  tags: array(string()),
  title: nonEmptyString,
})

const ChampionSpellSchema = object({
  description: nonEmptyString,
  id: nonEmptyString,
  image: DdragonImageSchema,
  name: nonEmptyString,
  tooltip: nonEmptyString,
})

const ChampionPassiveSchema = object({
  description: fallback(string(), ''),
  image: DdragonImageSchema,
  name: fallback(string(), ''),
})

const ChampionSkinSchema = object({
  chromas: boolean(),
  id: nonEmptyString,
  name: nonEmptyString,
  num: finiteNumber,
})

const RuneSchema = object({
  icon: nonEmptyString,
  id: pipe(
    finiteNumber,
    transform((value) => {
      return RuneId(value)
    }),
  ),
  key: nonEmptyString,
  longDesc: nonEmptyString,
  name: nonEmptyString,
  shortDesc: nonEmptyString,
})

const RuneTreeSchema = object({
  icon: nonEmptyString,
  id: pipe(
    finiteNumber,
    transform((value) => {
      return RuneId(value)
    }),
  ),
  key: nonEmptyString,
  name: nonEmptyString,
  slots: array(object({ runes: array(RuneSchema) })),
})

const ChampionDetailsRawSchema = object({
  blurb: nonEmptyString,
  lore: nonEmptyString,
  passive: ChampionPassiveSchema,
  skins: fallback(array(unknown()), []),
  spells: fallback(array(unknown()), []),
})

const ChampionPayloadSchema = object({
  data: record(string(), unknown()),
})

export type ChampionSummary = InferOutput<typeof ChampionSummarySchema>
export type ChampionSpell = InferOutput<typeof ChampionSpellSchema>
export type ChampionSkin = InferOutput<typeof ChampionSkinSchema>
export type RuneTree = InferOutput<typeof RuneTreeSchema>

export type ChampionDetails = ChampionSummary & {
  lore: string
  blurb: string
  passive: {
    name: string
    description: string
    image: InferOutput<typeof DdragonImageSchema>
  }
  spells: ChampionSpell[]
  skins: ChampionSkin[]
}

function parseOrNull<const TSchema extends GenericSchema>(schema: TSchema, content: unknown): InferOutput<TSchema> | null {
  const parsed = safeParse(schema, content)

  return parsed.success ? parsed.output : null
}

const DDRAGON_BASE_URL = 'https://ddragon.leagueoflegends.com'
const COMMUNITY_DRAGON_BASE_URL = 'https://raw.communitydragon.org'
// This localStorage namespace is an HTTP cache for external Data Dragon metadata,
// Not UI/application state. Keep it out of Zustand persistence and settings-store.
const CACHE_PREFIX = 'shoma:ddragon:'
const HTTP_VERSION_CACHE_KEY = `${CACHE_PREFIX}latest-version`
const DEFAULT_LANGUAGE: DdragonLanguage = 'en'
const HTTP_TIMEOUT_MS = 10_000

export function communityDragonSplashUrl(championKey: string, skinNum: number): string {
  return `${COMMUNITY_DRAGON_BASE_URL}/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-splashes/${championKey}/${skinNum}.jpg`
}

const ddragonClient = ky.create({
  prefix: DDRAGON_BASE_URL,
  retry: {
    limit: 2,
    methods: ['get'],
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
  },
  timeout: HTTP_TIMEOUT_MS,
})

const latestVersionHttpDedupCache = new Map<string, Promise<string>>()
const championListCache = new Map<string, Promise<ChampionSummary[]>>()
const championDetailsCache = new Map<string, Promise<ChampionDetails | null>>()
const runeCache = new Map<string, Promise<RuneTree[]>>()
const assetUrlDedupCache = new Map<string, string | null>()

function isBrowser(): boolean {
  return typeof globalThis !== 'undefined' && typeof localStorage !== 'undefined'
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
    image: candidate.image,
    key: candidate.id,
    name: candidate.name,
    partype: candidate.partype,
    stats: candidate.stats,
    tags: candidate.tags,
    title: candidate.title,
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
    blurb: raw.blurb,
    lore: raw.lore,
    passive: raw.passive,
    skins: raw.skins.flatMap((skin) => {
      const parsed = parseOrNull(ChampionSkinSchema, skin)

      return parsed ? [parsed] : []
    }),
    spells: raw.spells.flatMap((spell) => {
      const parsed = parseOrNull(ChampionSpellSchema, spell)

      return parsed ? [parsed] : []
    }),
  }
}

function parseRuneTree(entry: unknown): RuneTree | null {
  const raw = parseOrNull(
    object({
      icon: nonEmptyString,
      id: finiteNumber,
      key: nonEmptyString,
      name: nonEmptyString,
      slots: fallback(array(unknown()), []),
    }),
    entry,
  )

  if (!raw) {
    return null
  }

  return {
    icon: raw.icon,
    id: RuneId(raw.id),
    key: raw.key,
    name: raw.name,
    slots: raw.slots.flatMap((slot) => {
      const parsedSlot = parseOrNull(object({ runes: fallback(array(unknown()), []) }), slot)

      if (!parsedSlot) {
        return []
      }

      return [
        {
          runes: parsedSlot.runes.flatMap((rune) => {
            const parsed = parseOrNull(RuneSchema, rune)

            return parsed ? [parsed] : []
          }),
        },
      ]
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

  champions.sort((left, right) => {
    return left.name.localeCompare(right.name)
  })

  return champions
}

async function readJson<const TSchema extends GenericSchema>(
  request: Promise<unknown>,
  schema: TSchema,
  message: string,
): Promise<InferOutput<TSchema>> {
  try {
    const parsed = safeParse(schema, await request)

    if (!parsed.success) {
      throw createHttpError(message)
    }

    return parsed.output
  } catch (error) {
    if (error instanceof HTTPError) {
      throw createHttpError(`${message  } (${  error.response.status  })`, error)
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

  const request = readJson(
    ddragonClient.get('api/versions.json').json<unknown>(),
    array(string()),
    'Failed to load Data Dragon versions',
  ).then((versions) => {
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

async function cachedJson<T>(cache: Map<string, Promise<T>>, cacheKey: string, loader: () => Promise<T>): Promise<T> {
  const cached = cache.get(cacheKey)

  if (cached !== undefined) {
    return cached
  }

  const value = loader()

  cache.set(cacheKey, value)

  return value
}

async function getChampions(version: string, language: DdragonLanguage = DEFAULT_LANGUAGE): Promise<ChampionSummary[]> {
  return cachedJson(championListCache, championListCacheKey(version, language), async () => {
    const locale = resolveLocale(language)
    const payload = await ddragonClient.get(`cdn/${version}/data/${locale}/champion.json`).json<unknown>()

    return parseChampionList(payload)
  })
}

async function getChampion(
  version: string,
  championId: ChampionIdType,
  language: DdragonLanguage = DEFAULT_LANGUAGE,
): Promise<ChampionDetails | null> {
  const champions = await getChampions(version, language)
  const summary = champions.find((entry) => {
    return entry.id === championId
  })

  if (!summary) {
    return null
  }

  return getChampionDetail(version, summary.key, language)
}

async function getChampionDetail(
  version: string,
  championKey: string,
  language: DdragonLanguage = DEFAULT_LANGUAGE,
): Promise<ChampionDetails | null> {
  const normalizedChampionKey = championKey.trim()

  if (!normalizedChampionKey) {
    return null
  }

  return cachedJson(championDetailsCache, championDetailsCacheKey(version, language, normalizedChampionKey), async () => {
    const locale = resolveLocale(language)
    const payload = await ddragonClient
      .get(`cdn/${version}/data/${locale}/champion/${normalizedChampionKey}.json`)
      .json<unknown>()
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
  return cachedJson(runeCache, runeCacheKey(version, language), async () => {
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

async function getChampionSkins(
  version: string,
  championId: ChampionIdType,
  language: DdragonLanguage = DEFAULT_LANGUAGE,
): Promise<ChampionSkin[]> {
  const champion = await getChampion(version, championId, language)

  return champion?.skins ?? []
}

function latestDdragonVersionQueryOptions() {
  return queryOptions({
    queryFn: getLatestDdragonVersion,
    queryKey: ['ddragon', 'latest-version'] as const,
    staleTime: 24 * 60 * 60 * 1000,
  })
}

export function profileIconQueryOptions(version: string, iconId: number) {
  return queryOptions({
    queryFn: () => {
      return getProfileIconUrl(version, iconId)
    },
    queryKey: ['ddragon', 'profile-icon', version, iconId] as const,
    staleTime: 24 * 60 * 60 * 1000,
  })
}

export function useLatestDdragonVersion() {
  return useQuery(latestDdragonVersionQueryOptions())
}

export function useChampions(language: DdragonLanguage = DEFAULT_LANGUAGE) {
  const versionQuery = useLatestDdragonVersion()

  return useQuery({
    enabled: versionQuery.isSuccess,
    queryFn: () => {
      return getChampions(versionQuery.data ?? '', language)
    },
    queryKey: ['ddragon', 'champions', versionQuery.data, language] as const,
    staleTime: 24 * 60 * 60 * 1000,
  })
}

export function useRunes(language: DdragonLanguage = DEFAULT_LANGUAGE) {
  const versionQuery = useLatestDdragonVersion()

  return useQuery({
    enabled: versionQuery.isSuccess,
    queryFn: () => {
      return getRunes(versionQuery.data ?? '', language)
    },
    queryKey: ['ddragon', 'runes', versionQuery.data, language] as const,
    staleTime: 24 * 60 * 60 * 1000,
  })
}

export function useChampionDetail(championKey: string | undefined, language: DdragonLanguage = DEFAULT_LANGUAGE) {
  const versionQuery = useLatestDdragonVersion()

  return useQuery({
    enabled: versionQuery.isSuccess && typeof championKey === 'string' && championKey.length > 0,
    queryFn: () => {
      return getChampionDetail(versionQuery.data ?? '', championKey ?? '', language)
    },
    queryKey: ['ddragon', 'champion-detail', versionQuery.data, championKey, language] as const,
    staleTime: 24 * 60 * 60 * 1000,
  })
}

export function useChampionSkins(championId: ChampionIdType | undefined, language: DdragonLanguage = DEFAULT_LANGUAGE) {
  const versionQuery = useLatestDdragonVersion()

  return useQuery({
    enabled: versionQuery.isSuccess && typeof championId === 'number',
    queryFn: () => {
      return getChampionSkins(versionQuery.data ?? '', championId ?? ChampionId(-1), language)
    },
    queryKey: ['ddragon', 'champion-skins', versionQuery.data, championId, language] as const,
    staleTime: 24 * 60 * 60 * 1000,
  })
}

// @knip
export { getChampion, getChampionDetail, getChampions, getLatestDdragonVersion, getProfileIconUrl }
