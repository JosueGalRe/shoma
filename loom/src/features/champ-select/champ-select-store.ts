import { create } from 'zustand'

import type { ChampionSummary } from '@/core/http/ddragon-client'
import { ChampionId } from '@/core/types/branded';
import type { CellId } from '@/core/types/branded';
import type { ChampionId as ChampionIdType } from '@/core/types/branded';
import type { QueueId } from '@/core/types/branded';
import type { RuneId } from '@/core/types/branded';
import type { SpellId } from '@/core/types/branded';
import type { SummonerId } from '@/core/types/branded';

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

export type ChampSelectDerivedState = {
  actions: ChampSelectAction[][]
  bannedChampions: ChampionIdType[]
  benchChampionIds: ChampionIdType[]
  currentAction: ChampSelectAction | null
  enemyTeam: ChampSelectMember[]
  isMyTurn: boolean
  localPlayerCellId: CellId | null
  phase: ChampSelectPhase
  team: ChampSelectMember[]
  timer: number
}

export type ChampSelectStoreState = ChampSelectDerivedState & {
  champions: ChampionSummary[]
  error: string | null
  braveryEnabled: boolean
  isAram: boolean
  isLoading: boolean
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
  selectChampionForTurn: (championId: ChampionIdType) => Promise<boolean>
  setChampions: (champions: ChampionSummary[]) => void
  setError: (error: unknown) => void
  setRuntimeState: (runtimeState: Pick<ChampSelectStoreState, 'isAram' | 'isLoading'>) => void
  setSession: (session: ChampSelectSession | null | undefined) => void
  setSelectChampionForTurnHandler: (handler: ((championId: ChampionIdType) => Promise<boolean>) | null) => void
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

function readCurrentTurn(actions: ChampSelectAction[][]): ChampSelectAction[] | null {
  return (
    actions.find((turn) => turn.some((action) => !action.completed && (action.type === 'pick' || action.type === 'ban'))) ??
    null
  )
}

function readCurrentAction(actions: ChampSelectAction[][], localPlayerCellId: CellId | null): ChampSelectAction | null {
  const currentTurn = readCurrentTurn(actions)
  if (!currentTurn || localPlayerCellId === null) {
    return null
  }

  return currentTurn.find((action) => action.actorCellId === localPlayerCellId && !action.completed) ?? null
}

function derivePhase(currentAction: ChampSelectAction | null, actions: ChampSelectAction[][]): ChampSelectPhase {
  if (currentAction?.type === 'pick' || currentAction?.type === 'ban') {
    return currentAction.type
  }

  const turnAction = readCurrentTurn(actions)?.find(
    (action) => !action.completed && (action.type === 'pick' || action.type === 'ban'),
  )
  return turnAction?.type === 'pick' || turnAction?.type === 'ban' ? turnAction.type : 'waiting'
}

function readBannedChampions(actions: ChampSelectAction[][]): ChampionIdType[] {
  return actions.flat().reduce<ChampionIdType[]>((acc, action) => {
    if (action.type === 'ban' && action.completed && action.championId > 0) {
      acc.push(action.championId)
    }
    return acc
  }, [])
}

function normalizeTimer(session: ChampSelectSession | null | undefined): number {
  return Math.max(0, Math.ceil((session?.timer?.adjustedTimeLeftInPhase ?? 0) / 1000))
}

function deriveChampSelectState(session: ChampSelectSession | null): ChampSelectDerivedState {
  const actions = session?.actions ?? []
  const localPlayerCellId = session?.localPlayerCellId ?? null
  const currentAction = readCurrentAction(actions, localPlayerCellId)

  return {
    actions,
    bannedChampions: readBannedChampions(actions),
    benchChampionIds: session?.benchChampionIds ?? [],
    currentAction,
    enemyTeam: session?.theirTeam ?? [],
    isMyTurn: Boolean(currentAction),
    localPlayerCellId,
    phase: derivePhase(currentAction, actions),
    team: session?.myTeam ?? [],
    timer: normalizeTimer(session),
  }
}

function createChampSelectDerivedSelector(): (state: Pick<ChampSelectStoreState, 'session'>) => ChampSelectDerivedState {
  let cachedSession: ChampSelectSession | null | undefined
  let cachedDerivedState = deriveChampSelectState(null)

  function selectChampSelectDerivedState(state: Pick<ChampSelectStoreState, 'session'>): ChampSelectDerivedState {
    if (state.session === cachedSession) {
      return cachedDerivedState
    }

    cachedSession = state.session
    cachedDerivedState = deriveChampSelectState(state.session)
    return cachedDerivedState
  }

  return selectChampSelectDerivedState
}

export const selectChampSelectDerivedState = createChampSelectDerivedSelector()

export const initialChampSelectStoreState: ChampSelectStoreState = {
  ...deriveChampSelectState(null),
  champions: [],
  error: null,
  braveryEnabled: false,
  isAram: false,
  isLoading: false,
  selectedChampion: null,
  selection: emptySelection,
  session: null,
}

let selectChampionForTurnHandler: ((championId: ChampionIdType) => Promise<boolean>) | null = null

function normalizeError(error: unknown): string {
  return typeof error === 'string' ? error : 'errors.generic'
}

function updateLocalMemberSelection(
  team: ChampSelectMember[],
  cellId: CellId | null,
  championId: ChampionIdType | null,
  locked: boolean,
): ChampSelectMember[] {
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

function updateSessionAction(
  session: ChampSelectSession | null,
  actionId: number,
  championId: ChampionIdType,
  completed: boolean,
): ChampSelectSession | null {
  if (!session?.actions) {
    return session
  }

  return {
    ...session,
    actions: session.actions.map((turn) =>
      turn.map((action) => (action.id === actionId ? { ...action, championId, completed } : action)),
    ),
  }
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

function readSessionSelectedChampion(
  session: ChampSelectSession | null,
  fallback: ChampionIdType | null,
): ChampionIdType | null {
  const currentAction = readCurrentAction(readSessionActions(session), readSessionLocalPlayerCellId(session))
  const localMember = readSessionTeam(session).find((member) => member.cellId === readSessionLocalPlayerCellId(session))
  const sessionChampionId = currentAction?.championId || localMember?.championPickIntent || localMember?.championId || null

  return sessionChampionId && sessionChampionId > 0 ? sessionChampionId : fallback
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

function withDerivedState(
  session: ChampSelectSession | null,
): Pick<ChampSelectStoreState, keyof ChampSelectDerivedState | 'session'> {
  return {
    session,
    ...selectChampSelectDerivedState({ session }),
  }
}

// Architecture decision: keep this volatile domain in one store rather than slices.
// Selection/session/error actions all depend on the active turn, so slices would add
// cross-slice orchestration without reducing public API surface. Memoized selectors
// centralize derived champ-select state while keeping persistence out of this store.
export const useChampSelectStore = create<ChampSelectStore>()((set, get) => ({
  ...initialChampSelectStoreState,
  ban(championId) {
    const state = get()
    const patch = createPatch({ ...state, selectedChampion: championId }, true)
    if (!patch || patch.type !== 'ban') {
      set({ error: 'champSelect.errors.noActiveBanTurn' })
      return null
    }

    const currentAction = readCurrentAction(readSessionActions(state.session), readSessionLocalPlayerCellId(state.session))
    const session = currentAction ? updateSessionAction(state.session, currentAction.id, championId, true) : state.session

    set({
      ...withDerivedState(session),
      error: null,
      selectedChampion: championId,
      selection: { ...state.selection, championId },
    })
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

    const currentAction = readCurrentAction(readSessionActions(state.session), readSessionLocalPlayerCellId(state.session))
    const sessionWithAction = currentAction
      ? updateSessionAction(state.session, currentAction.id, patch.championId, true)
      : state.session
    const session = sessionWithAction
      ? {
          ...sessionWithAction,
          myTeam: updateLocalMemberSelection(
            readSessionTeam(sessionWithAction),
            readSessionLocalPlayerCellId(sessionWithAction),
            patch.championId,
            patch.type === 'pick',
          ),
        }
      : null

    set({
      ...withDerivedState(session),
      error: null,
      selectedChampion: patch.championId,
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

    const sessionWithAction = updateSessionAction(state.session, currentAction.id, championId, false)
    const session = sessionWithAction
      ? {
          ...sessionWithAction,
          myTeam: updateLocalMemberSelection(
            readSessionTeam(sessionWithAction),
            readSessionLocalPlayerCellId(sessionWithAction),
            championId,
            false,
          ),
        }
      : null

    set({
      ...withDerivedState(session),
      error: null,
      selectedChampion: championId,
      selection: { ...state.selection, championId },
    })
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
  setError(error) {
    if (error === null) {
      set({ error: null })
      return
    }

    set({ error: normalizeError(error) })
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
