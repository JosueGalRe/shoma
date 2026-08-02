import ky, { HTTPError } from 'ky'
import { array, type GenericSchema, type InferOutput, safeParse, string } from 'valibot'

import { parseChampionList, parseChampionPayloadEntry, parseRuneTree } from './parsers'

import type { CachedVersionEntry, ChampionIdType, DdragonLanguage } from './ddragon-types'
import type { ChampionDetails, ChampionSkin, ChampionSummary, RuneTree } from './parsers'

const DDRAGON_BASE_URL = 'https://ddragon.leagueoflegends.com'
const COMMUNITY_DRAGON_BASE_URL = 'https://raw.communitydragon.org'
// This localStorage namespace is an HTTP cache for external Data Dragon metadata,
// Not UI/application state. Keep it out of Zustand persistence and settings-store.
const CACHE_PREFIX = 'shoma:ddragon:'
const HTTP_VERSION_CACHE_KEY = `${CACHE_PREFIX}latest-version`
const VERSION_CACHE_TTL_MS = 24 * 60 * 60 * 1000
const DEFAULT_LANGUAGE: DdragonLanguage = 'en'
const HTTP_TIMEOUT_MS = 10_000

// Data Dragon uses HTTP-level request deduplication and asset URL memoization here;
// These maps do not represent application state or domain cache layers.
const latestVersionHttpDedupCache = new Map<string, Promise<string>>()
const championListCache = new Map<string, Promise<ChampionSummary[]>>()
const championDetailsCache = new Map<string, Promise<ChampionDetails | null>>()
const runeCache = new Map<string, Promise<RuneTree[]>>()
const assetUrlDedupCache = new Map<string, string | null>()

const ddragonClient = ky.create({
  prefix: DDRAGON_BASE_URL,
  retry: {
    limit: 2,
    methods: ['get'],
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
  },
  timeout: HTTP_TIMEOUT_MS,
})

export function communityDragonSplashUrl(championKey: string, skinNum: number): string {
  return `${COMMUNITY_DRAGON_BASE_URL}/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-splashes/${championKey}/${skinNum}.jpg`
}

function isBrowser(): boolean {
  return typeof globalThis !== 'undefined' && typeof localStorage !== 'undefined'
}

function createHttpError(message: string, cause?: unknown): Error {
  return new Error(message, { cause })
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
      throw createHttpError(`${message} (${error.response.status})`, error)
    }

    throw error instanceof Error && error.message === message ? error : createHttpError(message, error)
  }
}

function isCachedVersionEntry(value: unknown): value is CachedVersionEntry {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  return typeof Reflect.get(value, 'version') === 'string' && typeof Reflect.get(value, 'cachedAt') === 'number'
}

function getCachedVersion(): string | null {
  if (!isBrowser()) {
    return null
  }

  const stored = localStorage.getItem(HTTP_VERSION_CACHE_KEY)
  let parsed: unknown = null

  if (stored) {
    try {
      parsed = JSON.parse(stored)
    } catch {
      parsed = null
    }
  }

  // Legacy plain-string pins and stale entries must refetch; pinned old versions 403 on newer assets.
  if (!isCachedVersionEntry(parsed) || Date.now() - parsed.cachedAt > VERSION_CACHE_TTL_MS) {
    if (stored) {
      localStorage.removeItem(HTTP_VERSION_CACHE_KEY)
    }

    return null
  }

  return parsed.version
}

function setCachedVersion(version: string): void {
  if (!isBrowser()) {
    return
  }

  localStorage.setItem(HTTP_VERSION_CACHE_KEY, JSON.stringify({ cachedAt: Date.now(), version }))
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
  if (typeof language !== 'string' || language.length === 0) {
    return 'en_US'
  }

  if (language === 'en') {
    return 'en_US'
  }

  if (language === 'es') {
    return 'es_MX'
  }

  return language
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

    return parseChampionPayloadEntry(payload, normalizedChampionKey)
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
    if (error instanceof HTTPError && (error.response.status === 404 || error.response.status === 403)) {
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

export { getChampion, getChampionDetail, getChampions, getChampionSkins, getLatestDdragonVersion, getProfileIconUrl, getRunes }
