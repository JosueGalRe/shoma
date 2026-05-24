import type { RegaliaBannerInventoryEntry } from './lcu-normalizers-types'
import { isRegaliaBannerInventoryEntry, normalizeRegionCode as normalizeRegionCodeUtil } from './lcu-normalizers-utils'

export { isRegaliaBannerInventoryEntry }

export function normalizeChampionPickIntent(value: unknown): number | undefined {
  if (value === 0 || value === null || value === undefined) {
    return undefined
  }

  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

export function normalizeRegaliaInventory(raw: unknown): RegaliaBannerInventoryEntry[] {
  if (Array.isArray(raw)) {
    return raw.filter(isRegaliaBannerInventoryEntry)
  }

  if (raw && typeof raw === 'object') {
    return Object.values(raw).filter(isRegaliaBannerInventoryEntry)
  }

  return []
}

export function normalizeRegionCode(platformId: string): string {
  return normalizeRegionCodeUtil(platformId)
}
