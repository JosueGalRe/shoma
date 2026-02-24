export const ROLE_OPTIONS = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY', 'FILL', 'UNSELECTED'] as const

export const EMPTY_PERK_ROW = [0, 0, 0, 0, 0, 0, 0, 0, 0]

export const STAT_SHARD_ROWS: number[][] = [
  [5008, 5005, 5007],
  [5008, 5002, 5003],
  [5001, 5002, 5003],
]

export const STAT_SHARD_LABELS: Record<number, string> = {
  5008: 'AP/AD',
  5005: 'ATK SPD',
  5007: 'AH',
  5002: 'Armor',
  5003: 'MR',
  5001: 'HP',
}

export type RuneStyle = {
  id: number
  name: string
  slots: {
    runes: {
      id: number
      name: string
    }[]
  }[]
}

export type ConnectedRunePage = {
  id: number
  name: string
  isActive: boolean
  isEditable: boolean
  primaryStyleId: number | null
  secondaryStyleId: number | null
  selectedPerkIds: number[]
  order: number
}

export function findRuneSlotIndex(style: RuneStyle, runeId: number): number {
  return style.slots.findIndex((slot) => slot.runes.some((rune) => rune.id === runeId))
}

export function normalizeSelectedPerkIds(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [...EMPTY_PERK_ROW]
  }

  const parsed = value.filter((perk): perk is number => typeof perk === 'number')
  return EMPTY_PERK_ROW.map((fallback, index) => parsed[index] ?? fallback)
}
