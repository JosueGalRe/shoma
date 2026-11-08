import {
  type CellId,
  ChampionId,
  type ChampionId as ChampionIdType,
  type QueueId,
  type RuneId,
  type SpellId,
  type SummonerId,
} from '@/core/types/branded'

export type ChampSelectPhase = 'pick' | 'ban' | 'waiting'

export type ChampSelectActionType = 'pick' | 'ban' | 'ten_bans_reveal'

export interface ChampSelectAction {
  actorCellId: CellId
  championId: ChampionIdType
  completed: boolean
  id: number
  isAllyAction?: boolean
  isInProgress?: boolean
  type: ChampSelectActionType
}

export interface ChampSelectBenchChampion {
  championId: ChampionIdType
  isPriority?: boolean
}

export interface ChampSelectMember {
  assignedPosition?: string
  cellId: CellId
  championId: ChampionIdType
  championPickIntent?: ChampionIdType
  displayName?: string
  gameName?: string
  selectedSkinId?: number
  spell1Id?: SpellId
  spell2Id?: SpellId
  summonerId?: SummonerId
  team?: number
  wardSkinId?: number
}

export interface ChampSelectTimer {
  adjustedTimeLeftInPhase?: number
  internalNowInEpochMs?: number
  isInfinite?: boolean
  phase?: string
  totalTimeInPhase?: number
}

export interface ChampSelectSession {
  actions?: ChampSelectAction[][]
  benchChampions?: ChampSelectBenchChampion[]
  benchEnabled?: boolean
  gameMode?: string
  localPlayerCellId?: CellId
  mapId?: number
  myTeam?: ChampSelectMember[]
  queueId?: QueueId
  theirTeam?: ChampSelectMember[]
  timer?: ChampSelectTimer
}

export interface ChampSelectSelection {
  championId: ChampionIdType | null
  runeId: RuneId | null
  skinId: number | null
  spell1Id: SpellId | null
  spell2Id: SpellId | null
}

export interface ChampSelectActionPatch {
  championId: ChampionIdType
  completed: boolean
  type: ChampSelectActionType
}

export interface ChampSelectDerivedState {
  actions: ChampSelectAction[][]
  bannedChampions: ChampionIdType[]
  benchChampionIds: ChampionIdType[]
  currentAction: ChampSelectAction | null
  enemyTeam: ChampSelectMember[]
  intentAction: ChampSelectAction | null
  isMyTurn: boolean
  localPlayerCellId: CellId | null
  phase: ChampSelectPhase
  team: ChampSelectMember[]
  timer: number
}

export const emptySelection: ChampSelectSelection = {
  championId: null,
  runeId: null,
  skinId: null,
  spell1Id: null,
  spell2Id: null,
}

export function readCurrentTurn(actions: ChampSelectAction[][]): ChampSelectAction[] | null {
  return (
    actions.find((turn) => {
      return turn.some((action) => {
        return !action.completed && (action.type === 'pick' || action.type === 'ban')
      })
    }) ?? null
  )
}

export function readCurrentAction(
  actions: ChampSelectAction[][],
  localPlayerCellId: CellId | null,
  timerPhase?: string,
): ChampSelectAction | null {
  // PLANNING only declares pick intent; the LCU already flags bans isInProgress there, so the phase decides
  if (timerPhase === 'PLANNING') {
    return null
  }

  const currentTurn = readCurrentTurn(actions)

  if (!currentTurn || localPlayerCellId === null) {
    return null
  }

  return (
    currentTurn.find((action) => {
      return action.actorCellId === localPlayerCellId && !action.completed
    }) ?? null
  )
}

/**
 * The local player's pending pick. Hovering it outside their turn declares the champion intent.
 */
export function readIntentAction(actions: ChampSelectAction[][], localPlayerCellId: CellId | null): ChampSelectAction | null {
  if (localPlayerCellId === null) {
    return null
  }

  return (
    actions.flat().find((action) => {
      return action.actorCellId === localPlayerCellId && action.type === 'pick' && !action.completed
    }) ?? null
  )
}

export function derivePhase(currentAction: ChampSelectAction | null, actions: ChampSelectAction[][]): ChampSelectPhase {
  if (currentAction?.type === 'pick' || currentAction?.type === 'ban') {
    return currentAction.type
  }

  const turnAction = readCurrentTurn(actions)?.find((action) => {
    return !action.completed && (action.type === 'pick' || action.type === 'ban')
  })

  return turnAction?.type === 'pick' || turnAction?.type === 'ban' ? turnAction.type : 'waiting'
}

export function readBannedChampions(actions: ChampSelectAction[][]): ChampionIdType[] {
  return actions.flat().reduce<ChampionIdType[]>((acc, action) => {
    if (action.type === 'ban' && action.completed && action.championId > 0) {
      acc.push(action.championId)
    }

    return acc
  }, [])
}

export interface BanSlot {
  championId: ChampionIdType | null
  id: number
  isNoBan: boolean
  isPending: boolean
}

export function readBanSlots(actions: ChampSelectAction[][], isAlly: boolean): BanSlot[] {
  return actions.flat().flatMap((action): BanSlot[] => {
    if (action.type !== 'ban' || Boolean(action.isAllyAction) !== isAlly) {
      return []
    }

    return [
      {
        championId: action.completed && action.championId > 0 ? action.championId : null,
        id: action.id,
        isNoBan: action.completed && action.championId === -1,
        isPending: !action.completed,
      },
    ]
  })
}

export function normalizeTimer(session: ChampSelectSession | null | undefined): number {
  return Math.max(0, Math.ceil((session?.timer?.adjustedTimeLeftInPhase ?? 0) / 1000))
}

export function deriveChampSelectState(session: ChampSelectSession | null): ChampSelectDerivedState {
  const actions = session?.actions ?? []
  const localPlayerCellId = session?.localPlayerCellId ?? null
  const timerPhase = session?.timer?.phase
  const currentAction = readCurrentAction(actions, localPlayerCellId, timerPhase)

  return {
    actions,
    bannedChampions: readBannedChampions(actions),
    benchChampionIds:
      session?.benchChampions?.map((bench) => {
        return bench.championId
      }) ?? [],
    currentAction,
    enemyTeam: session?.theirTeam ?? [],
    intentAction: readIntentAction(actions, localPlayerCellId),
    isMyTurn: Boolean(currentAction),
    localPlayerCellId,
    phase: timerPhase === 'PLANNING' ? 'waiting' : derivePhase(currentAction, actions),
    team: session?.myTeam ?? [],
    timer: normalizeTimer(session),
  }
}

export interface ChampSelectSessionState {
  session: ChampSelectSession | null
}

export function createChampSelectDerivedSelector(): (state: ChampSelectSessionState) => ChampSelectDerivedState {
  let cachedSession: ChampSelectSession | null | undefined
  let cachedDerivedState = deriveChampSelectState(null)

  function selectChampSelectDerivedState(state: ChampSelectSessionState): ChampSelectDerivedState {
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

export function normalizeError(error: unknown): string {
  return typeof error === 'string' ? error : 'errors.generic'
}

export function updateLocalMemberSelection(options: {
  team: ChampSelectMember[]
  cellId: CellId | null
  championId: ChampionIdType | null
  locked: boolean
}): ChampSelectMember[] {
  const { cellId, championId, locked, team } = options

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

export function updateSessionAction(options: {
  session: ChampSelectSession | null
  actionId: number
  championId: ChampionIdType
  completed: boolean
}): ChampSelectSession | null {
  const { actionId, championId, completed, session } = options

  if (!session?.actions) {
    return session
  }

  return {
    ...session,
    actions: session.actions.map((turn) => {
      return turn.map((action) => {
        return action.id === actionId ? { ...action, championId, completed } : action
      })
    }),
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

export function readSessionSelectedChampion(
  session: ChampSelectSession | null,
  fallback: ChampionIdType | null,
): ChampionIdType | null {
  const currentAction = readCurrentAction(
    readSessionActions(session),
    readSessionLocalPlayerCellId(session),
    session?.timer?.phase,
  )
  const localMember = readSessionTeam(session).find((member) => {
    return member.cellId === readSessionLocalPlayerCellId(session)
  })
  const sessionChampionId = currentAction?.championId || localMember?.championPickIntent || localMember?.championId || null

  return sessionChampionId && sessionChampionId > 0 ? sessionChampionId : fallback
}

/**
 * The action a PATCH targets: the local turn, or outside it only a pick hover (intent declaration).
 */
export function readPatchTarget(session: ChampSelectSession | null, completed: boolean): ChampSelectAction | null {
  const actions = readSessionActions(session)
  const localPlayerCellId = readSessionLocalPlayerCellId(session)
  const currentAction = readCurrentAction(actions, localPlayerCellId, session?.timer?.phase)

  if (currentAction) {
    return currentAction
  }

  return completed ? null : readIntentAction(actions, localPlayerCellId)
}

export function createChampSelectPatch(
  state: {
    selectedChampion: ChampionIdType | null
    session: ChampSelectSession | null
  },
  completed: boolean,
): ChampSelectActionPatch | null {
  const target = readPatchTarget(state.session, completed)

  if (!target || (target.type !== 'pick' && target.type !== 'ban')) {
    return null
  }

  const championId = state.selectedChampion ?? target.championId

  if (!championId && target.type === 'pick') {
    return null
  }

  return {
    championId: championId ?? ChampionId(0),
    completed,
    type: target.type,
  }
}

export function withDerivedState(session: ChampSelectSession | null): ChampSelectSessionState & ChampSelectDerivedState {
  return {
    session,
    ...selectChampSelectDerivedState({ session }),
  }
}
