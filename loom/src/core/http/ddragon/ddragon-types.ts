import type { ChampionId } from '@/core/types/branded'

export type DdragonLanguage = string

export interface CachedVersionEntry {
  cachedAt: number
  version: string
}

export type ChampionIdType = ReturnType<typeof ChampionId>
