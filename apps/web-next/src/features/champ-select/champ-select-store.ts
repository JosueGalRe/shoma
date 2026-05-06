import { create } from 'zustand'

import type { ChampionSummary } from '@/core/http/ddragon-client'

export type ChampSelectPhase = 'pick' | 'ban' | 'waiting'

export type ChampSelectActionType = 'pick' | 'ban'

export type ChampSelectAction = {
  actorCellId: number
  championId: number
  completed: boolean
  id: number
  isAllyAction?: boolean
  isInProgress?: boolean
  type: ChampSelectActionType
}

export type ChampSelectMember = {
  assignedPosition?: string
  cellId: number
  championId: number
  championPickIntent?: number
  displayName?: string
  selectedSkinId?: number
  spell1Id?: number
  spell2Id?: number
  summonerId?: number
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
  benchChampionIds?: number[]
  benchEnabled?: boolean
  gameMode?: string
  localPlayerCellId?: number
  mapId?: number
  myTeam?: ChampSelectMember[]
  queueId?: number
  theirTeam?: ChampSelectMember[]
  timer?: ChampSelectTimer
}

export type ChampSelectSelection = {
  championId: number | null
  runeId: number | null
  skinId: number | null
  spell1Id: number | null
  spell2Id: number | null
}

export type ChampSelectActionPatch = {
  championId: number
  completed: boolean
  type: 'ban' | 'pick'
}

export type ChampSelectStoreState = {
  actions: ChampSelectAction[][]
  champions: ChampionSummary[]
  crowdFavorites: number[]
  enemyTeam: ChampSelectMember[]
  error: string | null
  braveryEnabled: boolean
  localPlayerCellId: number | null
  selectedChampion: number | null
  selection: ChampSelectSelection
  session: ChampSelectSession | null
  team: ChampSelectMember[]
  timer: number
}

export type ChampSelectStoreActions = {
  ban: (championId: number) => ChampSelectActionPatch | null
  changeRune: (runeId: number) => void
  changeSkin: (skinId: number) => void
  changeSpell: (slot: 1 | 2, spellId: number) => void
  decrementTimer: () => void
  lockIn: () => ChampSelectActionPatch | null
  previewChampion: (championId: number) => void
  reset: () => void
  selectChampion: (championId: number) => ChampSelectActionPatch | null
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
  actions: [],
  champions: [],
  crowdFavorites: [],
  enemyTeam: [],
  error: null,
  braveryEnabled: false,
  localPlayerCellId: null,
  selectedChampion: null,
  selection: emptySelection,
  session: null,
  team: [],
  timer: 0,
}

function normalizeError(error: unknown): string {
  return typeof error === 'string' ? error : 'errors.generic'
}

function normalizeTimer(timer: ChampSelectTimer | null | undefined): number {
  return Math.max(0, Math.ceil((timer?.adjustedTimeLeftInPhase ?? 0) / 1000))
}

function readCurrentTurn(actions: ChampSelectAction[][]): ChampSelectAction[] | null {
  return actions.find((turn) => turn.some((action) => !action.completed && (action.type === 'pick' || action.type === 'ban'))) ?? null
}

function readCurrentAction(actions: ChampSelectAction[][], localPlayerCellId: number | null): ChampSelectAction | null {
  const currentTurn = readCurrentTurn(actions)
  if (!currentTurn || localPlayerCellId === null) {
    return null
  }

  return currentTurn.find((action) => action.actorCellId === localPlayerCellId && !action.completed) ?? null
}

function updateLocalMemberSelection(team: ChampSelectMember[], cellId: number | null, championId: number | null, locked: boolean): ChampSelectMember[] {
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

function createPatch(state: ChampSelectStoreState, completed: boolean): ChampSelectActionPatch | null {
  const currentAction = readCurrentAction(state.actions, state.localPlayerCellId)
  if (!currentAction || (currentAction.type !== 'pick' && currentAction.type !== 'ban')) {
    return null
  }

  const championId = state.selectedChampion ?? currentAction.championId
  if (!championId && currentAction.type === 'pick') {
    return null
  }

  return {
    championId: championId ?? 0,
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
    set((state) => ({ timer: Math.max(0, state.timer - 1) }))
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
      team: updateLocalMemberSelection(state.team, state.localPlayerCellId, patch.championId, patch.type === 'pick'),
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
    const currentAction = readCurrentAction(state.actions, state.localPlayerCellId)
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
      team: updateLocalMemberSelection(state.team, state.localPlayerCellId, championId, false),
    })
    return patch
  },
  setChampions(champions) {
    set((state) => ({
      champions,
      crowdFavorites: state.crowdFavorites.length > 0 ? state.crowdFavorites : champions.slice(0, 6).map((champion) => champion.id),
    }))
  },
  setError(error) {
    if (error === null) {
      set({ error: null })
      return
    }

    set({ error: normalizeError(error) })
  },
  setSession(session) {
    const actions = session?.actions ?? []
    const localPlayerCellId = session?.localPlayerCellId ?? null
    const currentAction = readCurrentAction(actions, localPlayerCellId)
    const team = session?.myTeam ?? []
    const localMember = team.find((member) => member.cellId === localPlayerCellId)
    const selectedChampion = currentAction?.championId || localMember?.championPickIntent || localMember?.championId || get().selectedChampion

    set((state) => ({
      actions,
      enemyTeam: session?.theirTeam ?? [],
      error: null,
      localPlayerCellId,
      selectedChampion: selectedChampion || null,
      selection: { ...state.selection, championId: selectedChampion || null },
      session: session ?? null,
      team,
      timer: normalizeTimer(session?.timer),
    }))
  },
  toggleBravery() {
    set((state) => ({ braveryEnabled: !state.braveryEnabled }))
  },
}))
