import { create } from 'zustand'

import type { ChampionSummary } from '@/core/http/ddragon-client'
import { useChampSelectErrorStore } from '@/features/champ-select/champ-select-error-store'
import {
  createChampSelectPatch,
  emptySelection,
  readSessionSelectedChampion,
  type ChampSelectActionPatch,
  type ChampSelectDerivedState,
  type ChampSelectSelection,
  type ChampSelectSession,
  updateLocalMemberSelection,
  updateSessionAction,
  withDerivedState,
} from '@/features/champ-select/champ-select-actions'
import type { ChampionId as ChampionIdType } from '@/core/types/branded'
import type { RuneId } from '@/core/types/branded'
import type { SpellId } from '@/core/types/branded'

export type ChampSelectUiStoreState = ChampSelectDerivedState & {
  braveryEnabled: boolean
  champions: ChampionSummary[]
  isAram: boolean
  isLoading: boolean
  selectedChampion: ChampionIdType | null
  selection: ChampSelectSelection
  session: ChampSelectSession | null
}

export type ChampSelectUiStoreActions = {
  ban: (championId: ChampionIdType) => ChampSelectActionPatch | null
  changeRune: (runeId: RuneId) => void
  changeSkin: (skinId: number) => void
  changeSpell: (slot: 1 | 2, spellId: SpellId) => void
  decrementTimer: () => void
  lockIn: () => ChampSelectActionPatch | null
  previewChampion: (championId: ChampionIdType) => void
  reset: () => void
  selectChampion: (championId: ChampionIdType) => ChampSelectActionPatch | null
  selectChampionForTurn: (championId: ChampionIdType) => Promise<boolean>
  setChampions: (champions: ChampionSummary[]) => void
  setRuntimeState: (runtimeState: Pick<ChampSelectUiStoreState, 'isAram' | 'isLoading'>) => void
  setSession: (session: ChampSelectSession | null | undefined) => void
  setSelectChampionForTurnHandler: (handler: ((championId: ChampionIdType) => Promise<boolean>) | null) => void
  toggleBravery: () => void
}

export type ChampSelectUiStore = ChampSelectUiStoreState & ChampSelectUiStoreActions

export type ChampSelectStoreState = ChampSelectUiStoreState
export type ChampSelectStoreActions = ChampSelectUiStoreActions
export type ChampSelectStore = ChampSelectUiStore

export const initialChampSelectUiStoreState: ChampSelectUiStoreState = {
  ...withDerivedState(null),
  braveryEnabled: false,
  champions: [],
  isAram: false,
  isLoading: false,
  selectedChampion: null,
  selection: emptySelection,
  session: null,
}

export const initialChampSelectStoreState = initialChampSelectUiStoreState

let selectChampionForTurnHandler: ((championId: ChampionIdType) => Promise<boolean>) | null = null

export const useChampSelectUiStore = create<ChampSelectUiStore>()((set, get) => ({
  ...initialChampSelectUiStoreState,
  ban(championId) {
    const state = get()
    const patch = createChampSelectPatch({ ...state, selectedChampion: championId }, true)
    if (!patch || patch.type !== 'ban') {
      useChampSelectErrorStore.getState().setError('champSelect.errors.noActiveBanTurn')
      return null
    }

    const currentAction = state.currentAction
    const session = currentAction ? updateSessionAction(state.session, currentAction.id, championId, true) : state.session

    set({
      ...withDerivedState(session),
      selectedChampion: championId,
      selection: { ...state.selection, championId },
    })
    useChampSelectErrorStore.getState().setError(null)
    return patch
  },
  changeRune(runeId) {
    set((state) => ({ selection: { ...state.selection, runeId } }))
  },
  changeSkin(skinId) {
    set((state) => ({ selection: { ...state.selection, skinId } }))
  },
  changeSpell(slot, spellId) {
    set((state) => ({
      selection: {
        ...state.selection,
        ...(slot === 1 ? { spell1Id: spellId } : { spell2Id: spellId }),
      },
    }))
  },
  decrementTimer() {
  },
  lockIn() {
    const state = get()
    const patch = createChampSelectPatch(state, true)
    if (!patch) {
      useChampSelectErrorStore.getState().setError('champSelect.errors.selectChampionBeforeLockingIn')
      return null
    }

    const currentAction = state.currentAction
    const sessionWithAction = currentAction ? updateSessionAction(state.session, currentAction.id, patch.championId, true) : state.session
    const session = sessionWithAction
      ? {
          ...sessionWithAction,
          myTeam: updateLocalMemberSelection(
            sessionWithAction.myTeam ?? [],
            sessionWithAction.localPlayerCellId ?? null,
            patch.championId,
            patch.type === 'pick',
          ),
        }
      : null

    set({
      ...withDerivedState(session),
      selectedChampion: patch.championId,
    })
    useChampSelectErrorStore.getState().setError(null)
    return patch
  },
  previewChampion(championId) {
    set((state) => ({ selectedChampion: championId, selection: { ...state.selection, championId } }))
    useChampSelectErrorStore.getState().setError(null)
  },
  reset() {
    set({ ...initialChampSelectUiStoreState })
    useChampSelectErrorStore.getState().reset()
  },
  selectChampion(championId) {
    const state = get()
    const patch = createChampSelectPatch({ ...state, selectedChampion: championId }, false)
    if (!patch) {
      useChampSelectErrorStore.getState().setError('champSelect.errors.notYourTurn')
      return null
    }

    const sessionWithAction = updateSessionAction(state.session, state.currentAction?.id ?? 0, championId, false)
    const session = sessionWithAction
      ? {
          ...sessionWithAction,
          myTeam: updateLocalMemberSelection(
            sessionWithAction.myTeam ?? [],
            sessionWithAction.localPlayerCellId ?? null,
            championId,
            false,
          ),
        }
      : null

    set({
      ...withDerivedState(session),
      selectedChampion: championId,
      selection: { ...state.selection, championId },
    })
    useChampSelectErrorStore.getState().setError(null)
    return patch
  },
  async selectChampionForTurn(championId) {
    if (selectChampionForTurnHandler) {
      return selectChampionForTurnHandler(championId)
    }

    return Boolean(get().selectChampion(championId))
  },
  setChampions(champions) {
    set({ champions })
  },
  setRuntimeState(runtimeState) {
    set(runtimeState)
  },
  setSession(session) {
    set((state) => {
      const nextSession = session ?? null
      const selectedChampion = readSessionSelectedChampion(nextSession, state.selectedChampion)

      return {
        ...withDerivedState(nextSession),
        selectedChampion,
        selection: { ...state.selection, championId: selectedChampion },
      }
    })
  },
  setSelectChampionForTurnHandler(handler) {
    selectChampionForTurnHandler = handler
  },
  toggleBravery() {
    set((state) => ({ braveryEnabled: !state.braveryEnabled }))
  },
}))

export const useChampSelectStore = useChampSelectUiStore
