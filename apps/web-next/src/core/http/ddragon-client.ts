import { queryOptions, useQuery } from '@tanstack/react-query'
import ky, { HTTPError } from 'ky'

import { ChampionId, RuneId, type ChampionId as ChampionIdType, type RuneId as RuneIdType } from '@/core/types/branded'

// Data Dragon uses HTTP-level request deduplication and asset URL memoization here;
// these maps do not represent application state or domain cache layers.

export type DdragonLanguage = 'en' | 'es'

export type ChampionListEntry = {
  id: string
  key: string
  name: string
  title: string
  tags: string[]
  partype: string
  image: DdragonImage
  stats: Record<string, number>
}

export type ChampionSummary = {
  id: ChampionIdType
  key: string
  name: string
  title: string
  tags: string[]
  partype: string
  image: DdragonImage
  stats: Record<string, number>
}

export type ChampionSpell = {
  id: string
  name: string
  description: string
  tooltip: string
  image: DdragonImage
}

export type ChampionPassive = {
  name: string
  description: string
  image: DdragonImage
}

export type ChampionSkin = {
  id: string
  num: number
  name: string
  chromas: boolean
}

export type ChampionDetails = ChampionSummary & {
  lore: string
  blurb: string
  passive: ChampionPassive
  spells: ChampionSpell[]
  skins: ChampionSkin[]
}

export type RuneIcon = {
  full: string
  sprite: string
  group: string
  x: number
  y: number
  w: number
  h: number
}

export type Rune = {
  id: RuneIdType
  key: string
  icon: string
  name: string
  shortDesc: string
  longDesc: string
}

export type RuneTree = {
  id: RuneIdType
  key: string
  icon: string
  name: string
  slots: Array<{ runes: Rune[] }>
}

export type DdragonImage = {
  full: string
  sprite: string
  group: string
  x: number
  y: number
  w: number
  h: number
}

const DDRAGON_BASE_URL = 'https://ddragon.leagueoflegends.com'
const COMMUNITY_DRAGON_BASE_URL = 'https://raw.communitydragon.org'
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

function readObject(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  return value as Record<string, unknown>
}

function readString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function readBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function readImage(value: unknown): DdragonImage | null {
  const candidate = readObject(value)
  if (!candidate) {
    return null
  }

  const full = readString(candidate.full)
  const sprite = readString(candidate.sprite)
  const group = readString(candidate.group)
  const x = readNumber(candidate.x)
  const y = readNumber(candidate.y)
  const w = readNumber(candidate.w)
  const h = readNumber(candidate.h)

  if (!full || !sprite || !group || x === null || y === null || w === null || h === null) {
    return null
  }

  return { full, sprite, group, x, y, w, h }
}

function parseChampionSummary(entry: unknown): ChampionSummary | null {
  const candidate = readObject(entry)
  if (!candidate) {
    return null
  }

  const id = readString(candidate.id)
  const key = readString(candidate.key)
  const name = readString(candidate.name)
  const title = readString(candidate.title)
  const partype = readString(candidate.partype)
  const image = readImage(candidate.image)
  const stats = readObject(candidate.stats)

  if (!id || !key || !name || !title || !partype || !image || !stats) {
    return null
  }

  const numericId = Number(key)
  if (!Number.isFinite(numericId)) {
    return null
  }

  const parsedStats: Record<string, number> = {}
  for (const [statName, statValue] of Object.entries(stats)) {
    const stat = readNumber(statValue)
    if (stat !== null) {
      parsedStats[statName] = stat
    }
  }

  return {
    id: ChampionId(numericId),
    key: id,
    name,
    title,
    tags: readStringArray(candidate.tags),
    partype,
    image,
    stats: parsedStats,
  }
}

function parseChampionDetails(entry: unknown): ChampionDetails | null {
  const candidate = readObject(entry)
  const summary = parseChampionSummary(entry)
  const passiveCandidate = candidate ? readObject(candidate.passive) : null
  const spellsCandidate = candidate ? candidate.spells : null
  const skinsCandidate = candidate ? candidate.skins : null

  if (!summary || !candidate || !passiveCandidate || !Array.isArray(spellsCandidate) || !Array.isArray(skinsCandidate)) {
    return null
  }

  const passiveImage = readImage(passiveCandidate.image)
  if (!passiveImage) {
    return null
  }

  const spells: ChampionSpell[] = []
  for (const spell of spellsCandidate) {
    const spellCandidate = readObject(spell)
    const image = spellCandidate ? readImage(spellCandidate.image) : null
    const id = spellCandidate ? readString(spellCandidate.id) : null
    const name = spellCandidate ? readString(spellCandidate.name) : null
    const description = spellCandidate ? readString(spellCandidate.description) : null
    const tooltip = spellCandidate ? readString(spellCandidate.tooltip) : null

    if (!spellCandidate || !image || !id || !name || !description || !tooltip) {
      continue
    }

    spells.push({ id, name, description, tooltip, image })
  }

  const skins: ChampionSkin[] = []
  for (const skin of skinsCandidate) {
    const skinCandidate = readObject(skin)
    if (!skinCandidate) {
      continue
    }

    const skinId = readString(skinCandidate.id)
    const num = readNumber(skinCandidate.num)
    const name = readString(skinCandidate.name)
    const chromas = readBoolean(skinCandidate.chromas)

    if (!skinId || num === null || !name || chromas === null) {
      continue
    }

    skins.push({ id: skinId, num, name, chromas })
  }

  const lore = readString(candidate.lore)
  const blurb = readString(candidate.blurb)
  if (!lore || !blurb) {
    return null
  }

  return {
    ...summary,
    lore,
    blurb,
    passive: {
      name: readString(passiveCandidate.name) || '',
      description: readString(passiveCandidate.description) || '',
      image: passiveImage,
    },
    spells,
    skins,
  }
}

function parseRuneTree(entry: unknown): RuneTree | null {
  const candidate = readObject(entry)
  if (!candidate) {
    return null
  }

  const id = readNumber(candidate.id)
  const key = readString(candidate.key)
  const icon = readString(candidate.icon)
  const name = readString(candidate.name)
  const slots = candidate.slots

  if (id === null || !key || !icon || !name || !Array.isArray(slots)) {
    return null
  }

  const parsedSlots: RuneTree['slots'] = []
  for (const slot of slots) {
    const slotCandidate = readObject(slot)
    if (!slotCandidate || !Array.isArray(slotCandidate.runes)) {
      continue
    }

    const runes: Rune[] = []
    for (const rune of slotCandidate.runes) {
      const runeCandidate = readObject(rune)
      if (!runeCandidate) {
        continue
      }

      const runeId = readNumber(runeCandidate.id)
      const runeKey = readString(runeCandidate.key)
      const runeIcon = readString(runeCandidate.icon)
      const runeName = readString(runeCandidate.name)
      const shortDesc = readString(runeCandidate.shortDesc)
      const longDesc = readString(runeCandidate.longDesc)

      if (runeId === null || !runeKey || !runeIcon || !runeName || !shortDesc || !longDesc) {
        continue
      }

      runes.push({ id: RuneId(runeId), key: runeKey, icon: runeIcon, name: runeName, shortDesc, longDesc })
    }

    parsedSlots.push({ runes })
  }

  return { id: RuneId(id), key, icon, name, slots: parsedSlots }
}

function parseChampionList(content: unknown): ChampionSummary[] {
  const candidate = readObject(content)
  const dataCandidate = candidate ? readObject(candidate.data) : null
  if (!dataCandidate) {
    return []
  }

  const champions: ChampionSummary[] = []
  for (const value of Object.values(dataCandidate)) {
    const summary = parseChampionSummary(value)
    if (summary) {
      champions.push(summary)
    }
  }

  champions.sort((left, right) => left.name.localeCompare(right.name))
  return champions
}

async function readJson<T>(request: Promise<unknown>, message: string): Promise<T> {
  try {
    return (await request) as T
  } catch (error) {
    if (error instanceof HTTPError) {
      throw createHttpError(`${message} (${error.response.status})`, error)
    }

    throw createHttpError(message, error)
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

export async function getLatestDdragonVersion(): Promise<string> {
  const cached = getCachedVersion()
  if (cached) {
    return cached
  }

  const cachedPromise = latestVersionHttpDedupCache.get('latest')
  if (cachedPromise) {
    return cachedPromise
  }

  const request = readJson<string[]>(ddragonClient.get('api/versions.json').json<unknown>(), 'Failed to load Data Dragon versions').then((versions) => {
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

function championDetailsCacheKey(version: string, language: DdragonLanguage, championId: ChampionIdType): string {
  return `${CACHE_PREFIX}champion:${version}:${language}:${championId}`
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

export async function getChampions(version: string, language: DdragonLanguage = DEFAULT_LANGUAGE): Promise<ChampionSummary[]> {
  return cachedJson(championListCacheKey(version, language), async () => {
    const locale = resolveLocale(language)
    const payload = await ddragonClient.get(`cdn/${version}/data/${locale}/champion.json`).json<unknown>()
    return parseChampionList(payload)
  })
}

export async function getChampion(version: string, championId: ChampionIdType, language: DdragonLanguage = DEFAULT_LANGUAGE): Promise<ChampionDetails | null> {
  return cachedJson(championDetailsCacheKey(version, language, championId), async () => {
    const locale = resolveLocale(language)
    const champions = await getChampions(version, language)
    const summary = champions.find((entry) => entry.id === championId)
    if (!summary) {
      return null
    }

    const payload = await ddragonClient.get(`cdn/${version}/data/${locale}/champion/${summary.key}.json`).json<unknown>()
    const candidate = readObject(payload)
    const dataCandidate = candidate ? readObject(candidate.data) : null
    if (!dataCandidate) {
      return null
    }

    const rawChampion = dataCandidate[summary.key]
    const parsed = parseChampionDetails(rawChampion)
    return parsed
  })
}

export async function getChampionByNumericId(version: string, championId: ChampionIdType, language: DdragonLanguage = DEFAULT_LANGUAGE): Promise<ChampionDetails | null> {
  const champion = await getChampion(version, championId, language)
  if (champion) {
    return champion
  }

  const champions = await getChampions(version, language)
  const summary = champions.find((entry) => entry.id === championId)
  if (!summary) {
    return null
  }

  return {
    ...summary,
    lore: '',
    blurb: '',
    passive: { name: '', description: '', image: { full: '', sprite: '', group: '', x: 0, y: 0, w: 0, h: 0 } },
    spells: [],
    skins: [],
  }
}

export async function getProfileIconUrl(version: string, iconId: number): Promise<string | null> {
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

export async function getRunes(version: string, language: DdragonLanguage = DEFAULT_LANGUAGE): Promise<RuneTree[]> {
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

export async function getChampionSpells(version: string, championId: ChampionIdType, language: DdragonLanguage = DEFAULT_LANGUAGE): Promise<ChampionSpell[]> {
  const champion = await getChampion(version, championId, language)
  return champion?.spells ?? []
}

export async function getChampionSkins(version: string, championId: ChampionIdType, language: DdragonLanguage = DEFAULT_LANGUAGE): Promise<ChampionSkin[]> {
  const champion = await getChampion(version, championId, language)
  return champion?.skins ?? []
}

export function latestDdragonVersionQueryOptions() {
  return queryOptions({
    queryKey: ['ddragon', 'latest-version'] as const,
    queryFn: getLatestDdragonVersion,
    staleTime: 24 * 60 * 60 * 1000,
  })
}

export function championsQueryOptions(version: string, language: DdragonLanguage = DEFAULT_LANGUAGE) {
  return queryOptions({
    queryKey: ['ddragon', 'champions', version, language] as const,
    queryFn: () => getChampions(version, language),
    staleTime: 24 * 60 * 60 * 1000,
  })
}

export function championQueryOptions(version: string, championId: ChampionIdType, language: DdragonLanguage = DEFAULT_LANGUAGE) {
  return queryOptions({
    queryKey: ['ddragon', 'champion', version, championId, language] as const,
    queryFn: () => getChampion(version, championId, language),
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

export function runesQueryOptions(version: string, language: DdragonLanguage = DEFAULT_LANGUAGE) {
  return queryOptions({
    queryKey: ['ddragon', 'runes', version, language] as const,
    queryFn: () => getRunes(version, language),
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

export function useChampion(championId: ChampionIdType | undefined, language: DdragonLanguage = DEFAULT_LANGUAGE) {
  const versionQuery = useLatestDdragonVersion()

  return useQuery({
    queryKey: ['ddragon', 'champion', versionQuery.data, championId, language] as const,
    queryFn: () => getChampion(versionQuery.data ?? '', championId ?? ChampionId(-1), language),
    enabled: versionQuery.isSuccess && typeof championId === 'number',
    staleTime: 24 * 60 * 60 * 1000,
  })
}

export function useProfileIcon(iconId: number | undefined) {
  const versionQuery = useLatestDdragonVersion()

  return useQuery({
    queryKey: ['ddragon', 'profile-icon', versionQuery.data, iconId] as const,
    queryFn: () => getProfileIconUrl(versionQuery.data ?? '', iconId ?? -1),
    enabled: versionQuery.isSuccess && typeof iconId === 'number',
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

export function useChampionSpells(championId: ChampionIdType | undefined, language: DdragonLanguage = DEFAULT_LANGUAGE) {
  const versionQuery = useLatestDdragonVersion()

  return useQuery({
    queryKey: ['ddragon', 'champion-spells', versionQuery.data, championId, language] as const,
    queryFn: () => getChampionSpells(versionQuery.data ?? '', championId ?? ChampionId(-1), language),
    enabled: versionQuery.isSuccess && typeof championId === 'number',
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
