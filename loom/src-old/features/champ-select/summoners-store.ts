import { LcuHttpMethod, LcuPaths, type LcuChampSelectMySelectionPatchBody } from '@mimic/protocol-contract'
import { create } from 'zustand'

import { createLCUClient } from '@core/rift/lcu-transport'

export type ChampSelectRole = 'top' | 'jungle' | 'middle' | 'bottom' | 'utility' | ''

export type SummonerSpell = {
  description?: string
  gameModes?: string[]
  iconPath?: string
  id: number
  name: string
}

export type SummonerSelectionRequest = (body: LcuChampSelectMySelectionPatchBody) => Promise<void>

export type SummonersStoreState = {
  availableSpells: SummonerSpell[]
  error: Error | null
  gameMode: string
  role: ChampSelectRole
  selectedSpell1: number | null
  selectedSpell2: number | null
  spells: SummonerSpell[]
}

export type SummonersStoreActions = {
  reset: () => void
  selectSpell1: (id: number, requestSelection?: SummonerSelectionRequest) => Promise<boolean>
  selectSpell2: (id: number, requestSelection?: SummonerSelectionRequest) => Promise<boolean>
  setRole: (role: ChampSelectRole) => void
  setSummonerData: (data: { gameMode?: string | null; selectedSpell1?: number | null; selectedSpell2?: number | null; spells?: SummonerSpell[] | null }) => void
  setSummonerError: (error: unknown) => void
  validateSpell: (id: number) => boolean
}

export type SummonersStore = SummonersStoreState & SummonersStoreActions

const smiteSpellId = 11
const defaultGameMode = 'CLASSIC'
const lcuClient = createLCUClient({ connectOnCreate: false })

export const initialSummonersState: SummonersStoreState = {
  availableSpells: [],
  error: null,
  gameMode: defaultGameMode,
  role: '',
  selectedSpell1: null,
  selectedSpell2: null,
  spells: [],
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error
  }

  if (typeof error === 'string') {
    return new Error(error)
  }

  return new Error('Summoner spell operation failed.')
}

function normalizeRole(role: ChampSelectRole | string | null | undefined): ChampSelectRole {
  const normalized = (role ?? '').toLowerCase()
  if (normalized === 'top' || normalized === 'jungle' || normalized === 'middle' || normalized === 'bottom' || normalized === 'utility') {
    return normalized
  }

  return ''
}

function isSmite(spellId: number): boolean {
  return spellId === smiteSpellId
}

function isSpellAllowedForRole(spellId: number, role: ChampSelectRole): boolean {
  return !isSmite(spellId) || role === 'jungle'
}

function filterAvailableSpells(spells: SummonerSpell[], gameMode: string, role: ChampSelectRole): SummonerSpell[] {
  return spells.filter((spell) => {
    const modeAllowed = !spell.gameModes?.length || spell.gameModes.includes(gameMode)
    return modeAllowed && isSpellAllowedForRole(spell.id, role)
  })
}

async function defaultSelectSummoners(body: LcuChampSelectMySelectionPatchBody): Promise<void> {
  const result = await lcuClient.request(LcuPaths.champSelect.mySelection, LcuHttpMethod.PATCH, body)
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`LCU request failed (${result.status}): ${LcuPaths.champSelect.mySelection}`)
  }
}

export function createSummonersStore() {
  return create<SummonersStore>()((set, get) => {
    function refreshAvailable(partial: Partial<SummonersStoreState> = {}) {
      const current = { ...get(), ...partial }
      return filterAvailableSpells(current.spells, current.gameMode, current.role)
    }

    async function selectSpell(slot: 1 | 2, id: number, requestSelection: SummonerSelectionRequest): Promise<boolean> {
      if (!get().validateSpell(id)) {
        return false
      }

      const current = get()
      let spell1Id = current.selectedSpell1
      let spell2Id = current.selectedSpell2

      if (slot === 1) {
        spell1Id = id
        if (spell2Id === id) {
          spell2Id = current.selectedSpell1
        }
      } else {
        spell2Id = id
        if (spell1Id === id) {
          spell1Id = current.selectedSpell2
        }
      }

      if (!spell1Id || !spell2Id) {
        set({ error: new Error('Both summoner spell slots must be selected.') })
        return false
      }

      try {
        await requestSelection({ spell1Id, spell2Id })
        set({ error: null, selectedSpell1: spell1Id, selectedSpell2: spell2Id })
        return true
      } catch (error) {
        set({ error: normalizeError(error) })
        return false
      }
    }

    return {
      ...initialSummonersState,
      reset() {
        set({ ...initialSummonersState })
      },
      selectSpell1(id, requestSelection = defaultSelectSummoners) {
        return selectSpell(1, id, requestSelection)
      },
      selectSpell2(id, requestSelection = defaultSelectSummoners) {
        return selectSpell(2, id, requestSelection)
      },
      setRole(role) {
        const normalizedRole = normalizeRole(role)
        const availableSpells = refreshAvailable({ role: normalizedRole })
        const selectedSpell1 = get().selectedSpell1 && availableSpells.some((spell) => spell.id === get().selectedSpell1) ? get().selectedSpell1 : null
        const selectedSpell2 = get().selectedSpell2 && availableSpells.some((spell) => spell.id === get().selectedSpell2) ? get().selectedSpell2 : null

        set({ availableSpells, role: normalizedRole, selectedSpell1, selectedSpell2 })
      },
      setSummonerData(data) {
        set((state) => {
          const gameMode = data.gameMode ?? state.gameMode
          const spells = data.spells ?? state.spells
          const availableSpells = filterAvailableSpells(spells, gameMode, state.role)
          const selectedSpell1 = data.selectedSpell1 === undefined ? state.selectedSpell1 : data.selectedSpell1
          const selectedSpell2 = data.selectedSpell2 === undefined ? state.selectedSpell2 : data.selectedSpell2

          return {
            availableSpells,
            error: null,
            gameMode,
            selectedSpell1: selectedSpell1 && availableSpells.some((spell) => spell.id === selectedSpell1) ? selectedSpell1 : null,
            selectedSpell2: selectedSpell2 && availableSpells.some((spell) => spell.id === selectedSpell2) ? selectedSpell2 : null,
            spells,
          }
        })
      },
      setSummonerError(error) {
        set({ error: normalizeError(error) })
      },
      validateSpell(id) {
        const state = get()
        const isAvailable = state.availableSpells.some((spell) => spell.id === id)
        if (!isAvailable) {
          set({ error: new Error(isSmite(id) && state.role !== 'jungle' ? 'Smite is only available to jungle.' : 'Summoner spell is unavailable for this queue.') })
          return false
        }

        set({ error: null })
        return true
      },
    }
  })
}

export const summonerRequestPaths = {
  gameflowSession: LcuPaths.gameflow.session,
  spells: LcuPaths.assetServing.summonerSpells,
} as const

export const useSummonersStore = createSummonersStore()
