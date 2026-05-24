import { ChampionId } from '@/core/types/branded'
import type { CellId } from '@/core/types/branded'
import type { ChampionId as ChampionIdType } from '@/core/types/branded'
import type { QueueId } from '@/core/types/branded'
import type { RuneId } from '@/core/types/branded'
import type { SpellId } from '@/core/types/branded'
import type { SummonerId } from '@/core/types/branded'

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
  type: ChampSelectActionType
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

export const emptySelection: ChampSelectSelection = {
  championId: null,
  runeId: null,
  skinId: null,
  spell1Id: null,
  spell2Id: null,
}

export function readCurrentTurn(actions: ChampSelectAction[][]): ChampSelectAction[] | null {
  return (
    actions.find((turn) => turn.some((action) => !action.completed && (action.type === 'pick' || action.type === 'ban'))) ??
    null
  )
}

export function readCurrentAction(actions: ChampSelectAction[][], localPlayerCellId: CellId | null): ChampSelectAction | null {
  const currentTurn = readCurrentTurn(actions)
  if (!currentTurn || localPlayerCellId === null) {
    return null
  }

  return currentTurn.find((action) => action.actorCellId === localPlayerCellId && !action.completed) ?? null
}

export function derivePhase(currentAction: ChampSelectAction | null, actions: ChampSelectAction[][]): ChampSelectPhase {
  if (currentAction?.type === 'pick' || currentAction?.type === 'ban') {
    return currentAction.type
  }

  const turnAction = readCurrentTurn(actions)?.find((action) => !action.completed && (action.type === 'pick' || action.type === 'ban'))
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

export function normalizeTimer(session: ChampSelectSession | null | undefined): number {
  return Math.max(0, Math.ceil((session?.timer?.adjustedTimeLeftInPhase ?? 0) / 1000))
}

export function deriveChampSelectState(session: ChampSelectSession | null): ChampSelectDerivedState {
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

export type ChampSelectSessionState = {
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

export function updateLocalMemberSelection(
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

export function updateSessionAction(
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

export function readSessionSelectedChampion(
  session: ChampSelectSession | null,
  fallback: ChampionIdType | null,
): ChampionIdType | null {
  const currentAction = readCurrentAction(readSessionActions(session), readSessionLocalPlayerCellId(session))
  const localMember = readSessionTeam(session).find((member) => member.cellId === readSessionLocalPlayerCellId(session))
  const sessionChampionId = currentAction?.championId || localMember?.championPickIntent || localMember?.championId || null

  return sessionChampionId && sessionChampionId > 0 ? sessionChampionId : fallback
}

export function createChampSelectPatch(
  state: {
    selectedChampion: ChampionIdType | null
    session: ChampSelectSession | null
  },
  completed: boolean,
): ChampSelectActionPatch | null {
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

export function withDerivedState(
  session: ChampSelectSession | null,
): ChampSelectSessionState & ChampSelectDerivedState {
  return {
    session,
    ...selectChampSelectDerivedState({ session }),
  }
}
