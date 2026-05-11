import { queryOptions } from '@tanstack/react-query'
import ky from 'ky'

export type ChampionNamesById = Record<number, string>
export type ChampionMetadata = { id: number; key: string; name: string; tags: string[] }
export type ChampionMetadataById = Record<number, ChampionMetadata>
export type DdragonLanguage = 'en' | 'es'

const ddragonClient = ky.create({
  prefix: 'https://ddragon.leagueoflegends.com',
  timeout: 10_000,
  retry: {
    limit: 1,
    methods: ['get'],
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
  },
})

function readObject(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  return value as Record<string, unknown>
}

function parseChampionMetadataById(content: unknown): ChampionMetadataById {
  const candidate = readObject(content)
  if (!candidate) {
    return {}
  }

  const dataCandidate = readObject(candidate.data)
  if (!dataCandidate) {
    return {}
  }

  const result: ChampionMetadataById = {}
  for (const champion of Object.values(dataCandidate)) {
    const championCandidate = readObject(champion)
    if (!championCandidate) {
      continue
    }

    if (typeof championCandidate.key !== 'string' || typeof championCandidate.name !== 'string') {
      continue
    }

    const championId = Number(championCandidate.key)
    if (!Number.isFinite(championId)) {
      continue
    }

    const tags = Array.isArray(championCandidate.tags)
      ? championCandidate.tags.filter((t): t is string => typeof t === 'string')
      : []

    if (typeof championCandidate.id !== 'string' || !championCandidate.id) {
      continue
    }

    result[championId] = {
      id: championId,
      key: championCandidate.id,
      name: championCandidate.name,
      tags,
    }
  }

  return result
}

export async function getLatestDdragonVersion(): Promise<string> {
  const versions = await ddragonClient.get('api/versions.json').json<unknown>()
  if (!Array.isArray(versions) || typeof versions[0] !== 'string') {
    throw new Error('ddragon versions payload was invalid')
  }

  return versions[0]
}

function resolveDdragonLocale(language: DdragonLanguage): string {
  if (language === 'es') {
    return 'es_MX'
  }

  return 'en_US'
}

export async function getChampionMetadata(version: string, language: DdragonLanguage): Promise<ChampionMetadataById> {
  const locale = resolveDdragonLocale(language)
  const payload = await ddragonClient.get(`cdn/${version}/data/${locale}/champion.json`).json<unknown>()
  return parseChampionMetadataById(payload)
}

export async function getChampionNamesById(version: string, language: DdragonLanguage): Promise<ChampionNamesById> {
  const metadata = await getChampionMetadata(version, language)
  const result: ChampionNamesById = {}
  for (const [id, meta] of Object.entries(metadata)) {
    result[Number(id)] = meta.name
  }
  return result
}

export function ddragonVersionQueryOptions() {
  return queryOptions({
    queryKey: ['ddragon-version'] as const,
    queryFn: getLatestDdragonVersion,
    staleTime: 60 * 60 * 1000,
  })
}

export function championNamesQueryOptions(version: string, language: DdragonLanguage) {
  return queryOptions({
    queryKey: ['ddragon-champion-names', version, language] as const,
    queryFn: async () => {
      const metadata = await getChampionMetadata(version, language)
      const result: ChampionNamesById = {}
      for (const [id, meta] of Object.entries(metadata)) {
        result[Number(id)] = meta.name
      }
      return result
    },
    staleTime: 60 * 60 * 1000,
  })
}
