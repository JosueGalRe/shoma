export interface RegaliaBannerInventoryEntry {
  isOwned?: boolean
  items: unknown[]
  purchaseDate?: string
}

const PLATFORM_ID_TO_REGION_CODE: Record<string, string> = {
  BR1: 'BR',
  EUN1: 'EUNE',
  EUW1: 'EUW',
  JP1: 'JP',
  KR: 'KR',
  LA1: 'LAN',
  LA2: 'LAS',
  NA1: 'NA',
  OC1: 'OCE',
  PBE1: 'PBE',
  PH2: 'PH',
  RU: 'RU',
  RU1: 'RU',
  SG2: 'SG',
  TH2: 'TH',
  TR1: 'TR',
  TW2: 'TW',
  VN2: 'VN',
}

const TENCENT_PLATFORM_IDS = new Set([
  'BGP1',
  'BGP2',
  'CQ100',
  'EDU1',
  'GZ100',
  'HN1',
  'HN2',
  'HN3',
  'HN4',
  'HN5',
  'HN6',
  'HN7',
  'HN8',
  'HN9',
  'HN10',
  'HN11',
  'HN12',
  'HN13',
  'HN14',
  'HN15',
  'HN16',
  'HN17',
  'HN18',
  'HN19',
  'NJ100',
  'PREPBE',
  'TJ100',
  'TJ101',
  'WT1',
  'WT2',
  'WT3',
  'WT4',
  'WT5',
  'WT6',
  'WT7',
])

export function isRegaliaBannerInventoryEntry(value: unknown): value is RegaliaBannerInventoryEntry {
  return Boolean(value && typeof value === 'object' && Array.isArray((value as { items?: unknown }).items))
}

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
  const code = platformId.trim().toUpperCase()

  if (code.startsWith('TENCENT_')) {
    return code
  }

  if (TENCENT_PLATFORM_IDS.has(code)) {
    return `TENCENT_${code}`
  }

  return PLATFORM_ID_TO_REGION_CODE[code] ?? code
}
