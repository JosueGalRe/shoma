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
  statShardIds?: number[]
  order: number
}

function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
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

export function parseRuneStyles(content: unknown): RuneStyle[] {
  if (!Array.isArray(content)) {
    return []
  }

  return content
    .map((value) => {
      if (typeof value !== 'object' || value === null) {
        return null
      }

      const candidate = value as {
        id?: unknown
        name?: unknown
        slots?: unknown
      }

      if (typeof candidate.id !== 'number' || !Array.isArray(candidate.slots)) {
        return null
      }

      const slots = candidate.slots
        .map((slot) => {
          if (typeof slot !== 'object' || slot === null) {
            return null
          }

          const slotCandidate = slot as {
            runes?: unknown
          }
          if (!Array.isArray(slotCandidate.runes)) {
            return null
          }

          const runes = slotCandidate.runes
            .map((rune) => {
              if (typeof rune !== 'object' || rune === null) {
                return null
              }

              const runeCandidate = rune as {
                id?: unknown
                name?: unknown
              }
              if (typeof runeCandidate.id !== 'number') {
                return null
              }

              return {
                id: runeCandidate.id,
                name: typeof runeCandidate.name === 'string' ? runeCandidate.name : `Rune ${runeCandidate.id}`,
              }
            })
            .filter((runeValue) => runeValue !== null)

          return {
            runes,
          }
        })
        .filter((slotValue) => slotValue !== null)

      return {
        id: candidate.id,
        name: typeof candidate.name === 'string' ? candidate.name : `Style ${candidate.id}`,
        slots,
      }
    })
    .filter((value) => value !== null)
}

export function parseRunePages(content: unknown): ConnectedRunePage[] {
  const source = Array.isArray(content)
    ? content
    : typeof content === 'object' && content !== null && Array.isArray((content as { pages?: unknown }).pages)
      ? (content as { pages: unknown[] }).pages
      : null

  if (!source) {
    return []
  }

  return source
    .map((value) => {
      if (typeof value !== 'object' || value === null) {
        return null
      }

      const candidate = value as {
        id?: unknown
        name?: unknown
        isActive?: unknown
        isEditable?: unknown
        primaryStyleId?: unknown
        subStyleId?: unknown
        secondaryStyleId?: unknown
        selectedPerkIds?: unknown
        order?: unknown
      }

      const id = readNumber(candidate.id)
      if (id === null) {
        return null
      }

      return {
        id,
        name: typeof candidate.name === 'string' && candidate.name.length > 0 ? candidate.name : `Rune Page ${id}`,
        isActive: candidate.isActive === true,
        isEditable: candidate.isEditable === true,
        primaryStyleId: readNumber(candidate.primaryStyleId),
        secondaryStyleId:
          readNumber(candidate.subStyleId) ?? readNumber(candidate.secondaryStyleId),
        selectedPerkIds: Array.isArray(candidate.selectedPerkIds)
          ? normalizeSelectedPerkIds(candidate.selectedPerkIds)
          : [...EMPTY_PERK_ROW],
        order: readNumber(candidate.order) ?? 0,
      }
    })
    .filter((value) => value !== null)
    .sort((left, right) => left.order - right.order)
}

export function readActiveRunePage(runePages: ConnectedRunePage[]): ConnectedRunePage | null {
  return runePages.find((runePage) => runePage.isActive) ?? runePages[0] ?? null
}

export function readEditableActiveRunePage(activeRunePage: ConnectedRunePage | null): ConnectedRunePage | null {
  if (!activeRunePage?.isEditable) {
    return null
  }

  return activeRunePage
}

export function readRuneStyleById(runeStyles: RuneStyle[], styleId: number | null): RuneStyle | null {
  if (!styleId) {
    return null
  }

  return runeStyles.find((style) => style.id === styleId) ?? null
}

export function readSelectedSecondaryRuneIds(editableActiveRunePage: ConnectedRunePage | null): number[] {
  if (!editableActiveRunePage) {
    return []
  }

  return [editableActiveRunePage.selectedPerkIds[4], editableActiveRunePage.selectedPerkIds[5]].filter(
    (value): value is number => typeof value === 'number' && value > 0,
  )
}
