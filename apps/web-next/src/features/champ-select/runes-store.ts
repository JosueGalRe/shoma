import { LcuHttpMethod, LcuPaths } from '@mimic/protocol-contract'
import { create } from 'zustand'

import { createLCUClient } from '@core/rift/lcu-transport'
import { useChampSelectStore } from './champ-select-store'

export type RunePerk = {
  iconPath?: string
  id: number
  name?: string
}

export type RuneSlot = {
  perks: RunePerk[]
  type?: string
}

export type RuneStyle = {
  iconPath?: string
  id: number
  name: string
  slots: RuneSlot[]
}

export type RunePage = {
  autoModifiedSelections?: unknown[]
  championIds?: number[]
  current?: boolean
  id: number
  isActive?: boolean
  isDeletable?: boolean
  isEditable?: boolean
  isTemporary?: boolean
  name: string
  order?: number
  primaryStyleId: number
  selectedPerkIds: number[]
  subStyleId: number
}

export type RuneValidationResult = {
  error: string | null
  isValid: boolean
}

export type RunePageRequest = (page: RunePage) => Promise<void>
export type RunePresetRequest = (pageId: number) => Promise<void>

export type RunesStoreState = {
  currentPage: RunePage | null
  error: Error | null
  isEditing: boolean
  presets: RunePage[]
  runeStyles: RuneStyle[]
  selectedPreset: number
  validation: RuneValidationResult
}

export type RunesStoreActions = {
  autoSelectForChampion: (championId?: number | null, requestPreset?: RunePresetRequest) => Promise<boolean>
  editRunePage: (page: RunePage) => boolean
  reset: () => void
  saveRunePage: (requestPage?: RunePageRequest) => Promise<boolean>
  selectPreset: (index: number, requestPreset?: RunePresetRequest) => Promise<boolean>
  setRuneData: (data: { currentPage?: RunePage | null; pages?: RunePage[] | null; styles?: RuneStyle[] | null }) => void
  setRuneError: (error: unknown) => void
  validateRunes: (page?: RunePage | null) => RuneValidationResult
}

export type RunesStore = RunesStoreState & RunesStoreActions

const maxPresetCount = 3
const minRuneSelections = 6
const lcuClient = createLCUClient({ connectOnCreate: false })

export const initialRunesState: RunesStoreState = {
  currentPage: null,
  error: null,
  isEditing: false,
  presets: [],
  runeStyles: [],
  selectedPreset: -1,
  validation: { error: null, isValid: true },
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error
  }

  if (typeof error === 'string') {
    return new Error(error)
  }

  return new Error('Rune operation failed.')
}

function sortPresets(pages: RunePage[]): RunePage[] {
  return [...pages].sort((left, right) => (left.order ?? left.id) - (right.order ?? right.id)).slice(0, maxPresetCount)
}

function findSelectedPreset(presets: RunePage[], currentPage: RunePage | null): number {
  if (!currentPage) {
    return presets.findIndex((preset) => preset.current || preset.isActive)
  }

  const currentIndex = presets.findIndex((preset) => preset.id === currentPage.id)
  if (currentIndex >= 0) {
    return currentIndex
  }

  return presets.findIndex((preset) => preset.current || preset.isActive)
}

function findPerkSlot(style: RuneStyle | undefined, perkId: number): number {
  return style?.slots.findIndex((slot) => slot.perks.some((perk) => perk.id === perkId)) ?? -1
}

function validatePage(page: RunePage | null | undefined, styles: RuneStyle[]): RuneValidationResult {
  if (!page) {
    return { error: 'No rune page selected.', isValid: false }
  }

  if (page.primaryStyleId === page.subStyleId) {
    return { error: 'Primary and secondary rune trees must be different.', isValid: false }
  }

  if (new Set(page.selectedPerkIds).size !== page.selectedPerkIds.length) {
    return { error: 'Rune selections cannot contain duplicates.', isValid: false }
  }

  if (page.selectedPerkIds.length < minRuneSelections) {
    return { error: 'A complete rune page needs at least six selected runes.', isValid: false }
  }

  const primaryStyle = styles.find((style) => style.id === page.primaryStyleId)
  const subStyle = styles.find((style) => style.id === page.subStyleId)
  if (!primaryStyle || !subStyle) {
    return { error: 'Selected rune trees are unavailable.', isValid: false }
  }

  const primarySlots = new Set<number>()
  const subSlots = new Set<number>()

  for (const perkId of page.selectedPerkIds) {
    const primarySlot = findPerkSlot(primaryStyle, perkId)
    if (primarySlot >= 0) {
      if (primarySlots.has(primarySlot)) {
        return { error: 'Only one primary rune can be selected per slot.', isValid: false }
      }
      primarySlots.add(primarySlot)
      continue
    }

    const subSlot = findPerkSlot(subStyle, perkId)
    if (subSlot >= 0) {
      if (subSlots.has(subSlot)) {
        return { error: 'Secondary runes must come from different slots.', isValid: false }
      }
      subSlots.add(subSlot)
      continue
    }

    return { error: `Rune ${perkId} is not available in the selected trees.`, isValid: false }
  }

  if (primarySlots.size < Math.min(4, primaryStyle.slots.length)) {
    return { error: 'Primary tree must include one rune from each primary slot.', isValid: false }
  }

  if (subSlots.size < 2) {
    return { error: 'Secondary tree must include two runes.', isValid: false }
  }

  return { error: null, isValid: true }
}

async function defaultSelectPreset(pageId: number): Promise<void> {
  const result = await lcuClient.request(LcuPaths.perks.currentPage, LcuHttpMethod.PUT, String(pageId))
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`LCU request failed (${result.status}): ${LcuPaths.perks.currentPage}`)
  }
}

async function defaultSaveRunePage(page: RunePage): Promise<void> {
  const result = await lcuClient.request(LcuPaths.perks.page(page.id), LcuHttpMethod.PUT, page)
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`LCU request failed (${result.status}): ${LcuPaths.perks.page(page.id)}`)
  }
}

export function createRunesStore() {
  return create<RunesStore>()((set, get) => ({
    ...initialRunesState,
    async autoSelectForChampion(championId, requestPreset = defaultSelectPreset) {
      if (!championId) {
        return false
      }

      const presetIndex = get().presets.findIndex((preset) => preset.championIds?.includes(championId))
      if (presetIndex < 0 || presetIndex === get().selectedPreset) {
        return false
      }

      return get().selectPreset(presetIndex, requestPreset)
    },
    editRunePage(page) {
      if (!page.isEditable) {
        set({ error: new Error('This rune page cannot be edited.'), isEditing: false })
        return false
      }

      const validation = get().validateRunes(page)
      if (!validation.isValid) {
        set({ error: new Error(validation.error ?? 'Invalid rune page.'), validation })
        return false
      }

      set({ currentPage: page, error: null, isEditing: true, validation })
      return true
    },
    reset() {
      set({ ...initialRunesState })
    },
    async saveRunePage(requestPage = defaultSaveRunePage) {
      const page = get().currentPage
      if (!page?.isEditable) {
        set({ error: new Error('This rune page cannot be saved because it is not editable.'), isEditing: false })
        return false
      }

      const validation = get().validateRunes(page)
      if (!validation.isValid) {
        set({ error: new Error(validation.error ?? 'Invalid rune page.'), validation })
        return false
      }

      try {
        await requestPage(page)
        set((state) => ({
          error: null,
          isEditing: false,
          presets: state.presets.map((preset) => (preset.id === page.id ? page : preset)),
          validation,
        }))
        return true
      } catch (error) {
        set({ error: normalizeError(error) })
        return false
      }
    },
    async selectPreset(index, requestPreset = defaultSelectPreset) {
      const preset = get().presets[index]
      if (!preset) {
        set({ error: new Error('Rune preset does not exist.') })
        return false
      }

      const validation = get().validateRunes(preset)
      if (!validation.isValid) {
        set({ error: new Error(validation.error ?? 'Invalid rune page.'), validation })
        return false
      }

      try {
        await requestPreset(preset.id)
        set((state) => ({
          currentPage: { ...preset, current: true, isActive: true },
          error: null,
          isEditing: false,
          presets: state.presets.map((page, pageIndex) => ({ ...page, current: pageIndex === index, isActive: pageIndex === index })),
          selectedPreset: index,
          validation,
        }))
        return true
      } catch (error) {
        set({ error: normalizeError(error) })
        return false
      }
    },
    setRuneData(data) {
      set((state) => {
        const presets = data.pages ? sortPresets(data.pages) : state.presets
        const currentPage = data.currentPage === undefined ? state.currentPage : data.currentPage
        const runeStyles = data.styles ?? state.runeStyles
        const selectedPreset = findSelectedPreset(presets, currentPage)
        const validation = validatePage(currentPage ?? presets[selectedPreset], runeStyles)

        return {
          currentPage: currentPage ?? presets[selectedPreset] ?? null,
          error: validation.isValid ? null : state.error,
          presets,
          runeStyles,
          selectedPreset,
          validation,
        }
      })

      const localChampionId = useChampSelectStore
        .getState()
        .myTeam.find((member) => member.cellId === useChampSelectStore.getState().localPlayerCellId)?.championId
      if (localChampionId) {
        void get().autoSelectForChampion(localChampionId)
      }
    },
    setRuneError(error) {
      set({ error: normalizeError(error) })
    },
    validateRunes(page = get().currentPage) {
      return validatePage(page, get().runeStyles)
    },
  }))
}

export const runeRequestPaths = {
  currentPage: LcuPaths.perks.currentPage,
  pages: LcuPaths.perks.pages,
  styles: LcuPaths.perks.styles,
} as const

export const useRunesStore = createRunesStore()
