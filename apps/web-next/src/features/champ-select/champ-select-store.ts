import { create } from 'zustand'

import type { ChampionSummary } from '@/core/http/ddragon-client'
import { ChampionId, type CellId, type ChampionId as ChampionIdType, type QueueId, type RuneId, type SpellId, type SummonerId } from '@/core/types/branded'

export type ChampSelectPhase = 'pick' | 'ban' | 'waiting'

export type ChampSelectActionType = 'pick' | 'ban'

export type ChampSelectAction = {
  actorCellId: CellId
  championId: ChampionIdType
  completed: boolean
  id: number
  isAllyAction?: boolean
  isInProgress?: boolean
  type: ChampSelectActionType
}

export type ChampSelectMember = {
  assignedPosition?: string
  cellId: CellId
  championId: ChampionIdType
  championPickIntent?: ChampionIdType
  displayName?: string
  selectedSkinId?: number
  spell1Id?: SpellId
  spell2Id?: SpellId
  summonerId?: SummonerId
  team?: number
}

export type ChampSelectTimer = {
  adjustedTimeLeftInPhase?: number
  internalNowInEpochMs?: number
  isInfinite?: boolean
  phase?: string
  totalTimeInPhase?: number
}

export type ChampSelectSession = {
  actions?: ChampSelectAction[][]
  benchChampionIds?: ChampionIdType[]
  benchEnabled?: boolean
  gameMode?: string
  localPlayerCellId?: CellId
  mapId?: number
  myTeam?: ChampSelectMember[]
  queueId?: QueueId
  theirTeam?: ChampSelectMember[]
  timer?: ChampSelectTimer
}

export type ChampSelectSelection = {
  championId: ChampionIdType | null
  runeId: RuneId | null
  skinId: number | null
  spell1Id: SpellId | null
  spell2Id: SpellId | null
}

export type ChampSelectActionPatch = {
  championId: ChampionIdType
  completed: boolean
  type: 'ban' | 'pick'
}

export type ChampSelectStoreState = {
  champions: ChampionSummary[]
  error: string | null
  braveryEnabled: boolean
  selectedChampion: ChampionIdType | null
  selection: ChampSelectSelection
  session: ChampSelectSession | null
}

export type ChampSelectStoreActions = {
  ban: (championId: ChampionIdType) => ChampSelectActionPatch | null
  changeRune: (runeId: RuneId) => void
  changeSkin: (skinId: number) => void
  changeSpell: (slot: 1 | 2, spellId: SpellId) => void
  decrementTimer: () => void
  lockIn: () => ChampSelectActionPatch | null
  previewChampion: (championId: ChampionIdType) => void
  reset: () => void
  selectChampion: (championId: ChampionIdType) => ChampSelectActionPatch | null
  setChampions: (champions: ChampionSummary[]) => void
  setError: (error: unknown) => void
  setSession: (session: ChampSelectSession | null | undefined) => void
  toggleBravery: () => void
}

export type ChampSelectStore = ChampSelectStoreState & ChampSelectStoreActions

const emptySelection: ChampSelectSelection = {
  championId: null,
  runeId: null,
  skinId: null,
  spell1Id: null,
  spell2Id: null,
}

export const initialChampSelectStoreState: ChampSelectStoreState = {
  champions: [],
  error: null,
  braveryEnabled: false,
  selectedChampion: null,
  selection: emptySelection,
  session: null,
}

function normalizeError(error: unknown): string {
  return typeof error === 'string' ? error : 'errors.generic'
}

function readCurrentTurn(actions: ChampSelectAction[][]): ChampSelectAction[] | null {
  return actions.find((turn) => turn.some((action) => !action.completed && (action.type === 'pick' || action.type === 'ban'))) ?? null
}

function readCurrentAction(actions: ChampSelectAction[][], localPlayerCellId: CellId | null): ChampSelectAction | null {
  const currentTurn = readCurrentTurn(actions)
  if (!currentTurn || localPlayerCellId === null) {
    return null
  }

  return currentTurn.find((action) => action.actorCellId === localPlayerCellId && !action.completed) ?? null
}

function updateLocalMemberSelection(team: ChampSelectMember[], cellId: CellId | null, championId: ChampionIdType | null, locked: boolean): ChampSelectMember[] {
  if (cellId === null || championId === null) {
    return team
  }

  return team.map((member) => {
    if (member.cellId !== cellId) {
      return member
    }

    return {
      ...member,
      championId: locked ? championId : member.championId,
      championPickIntent: locked ? member.championPickIntent : championId,
    }
  })
}

function readSessionActions(session: ChampSelectSession | null): ChampSelectAction[][] {
  return session?.actions ?? []
}

function readSessionLocalPlayerCellId(session: ChampSelectSession | null): CellId | null {
  return session?.localPlayerCellId ?? null
}

function readSessionTeam(session: ChampSelectSession | null): ChampSelectMember[] {
  return session?.myTeam ?? []
}

function createPatch(state: ChampSelectStoreState, completed: boolean): ChampSelectActionPatch | null {
  const currentAction = readCurrentAction(readSessionActions(state.session), readSessionLocalPlayerCellId(state.session))
  if (!currentAction || (currentAction.type !== 'pick' && currentAction.type !== 'ban')) {
    return null
  }

  const championId = state.selectedChampion ?? currentAction.championId
  if (!championId && currentAction.type === 'pick') {
    return null
  }

  return {
    championId: championId ?? ChampionId(0),
    completed,
    type: currentAction.type,
  }
}

export const useChampSelectStore = create<ChampSelectStore>()((set, get) => ({
  ...initialChampSelectStoreState,
  ban(championId) {
    const patch = createPatch({ ...get(), selectedChampion: championId }, true)
    if (!patch || patch.type !== 'ban') {
      set({ error: 'champSelect.errors.noActiveBanTurn' })
      return null
    }

    set({ error: null, selectedChampion: championId, selection: { ...get().selection, championId } })
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
    // Timer is derived from session in the hook; this API remains for compatibility.
  },
  lockIn() {
    const state = get()
    const patch = createPatch(state, true)
    if (!patch) {
      set({ error: 'champSelect.errors.selectChampionBeforeLockingIn' })
      return null
    }

    set({
      error: null,
      selectedChampion: patch.championId,
      session: {
        ...state.session,
        myTeam: updateLocalMemberSelection(readSessionTeam(state.session), readSessionLocalPlayerCellId(state.session), patch.championId, patch.type === 'pick'),
      },
    })
    return patch
  },
  previewChampion(championId) {
    set((state) => ({ error: null, selectedChampion: championId, selection: { ...state.selection, championId } }))
  },
  reset() {
    set({ ...initialChampSelectStoreState })
  },
  selectChampion(championId) {
    const state = get()
    const currentAction = readCurrentAction(readSessionActions(state.session), readSessionLocalPlayerCellId(state.session))
    if (!currentAction) {
      set({ error: 'champSelect.errors.notYourTurn' })
      return null
    }

    const patch = createPatch({ ...state, selectedChampion: championId }, false)
    if (!patch) {
      set({ error: 'champSelect.errors.noActivePickOrBanTurn' })
      return null
    }

    set({
      error: null,
      selectedChampion: championId,
      selection: { ...state.selection, championId },
      session: {
        ...state.session,
        myTeam: updateLocalMemberSelection(readSessionTeam(state.session), readSessionLocalPlayerCellId(state.session), championId, false),
      },
    })
    return patch
  },
  setChampions(champions) {
    set({ champions })
  },
  setError(error) {
    if (error === null) {
      set({ error: null })
      return
    }

    set({ error: normalizeError(error) })
  },
  setSession(session) {
    set({ session: session ?? null })
  },
  toggleBravery() {
    set((state) => ({ braveryEnabled: !state.braveryEnabled }))
  },
}))
