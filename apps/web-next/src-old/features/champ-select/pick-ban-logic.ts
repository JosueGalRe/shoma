import type { ChampSelectAction, ChampSelectActionType, ChampSelectMember, ChampSelectSession } from './champ-select-store'

export type PickBanPhase = 'ban' | 'pick' | 'idle'

export type ChampionAvailability = 'available' | 'picked' | 'banned' | 'bench' | 'disabled'

export type ChampionOption = {
  availability: ChampionAvailability
  championId: number
  isActionable: boolean
  isBannable: boolean
  isPickable: boolean
}

export type TurnState = {
  activeAction: ChampSelectAction | null
  activeTurn: ChampSelectAction[] | null
  isLocalTurn: boolean
  nextTurn: ChampSelectAction[] | null
  phase: PickBanPhase
}

export type TimeoutResolution = {
  action: ChampSelectAction | null
  championId: number | null
  shouldCommit: boolean
}

type ChampionFilterInput = {
  allChampionIds?: number[]
  bannableChampionIds?: number[]
  benchChampionIds?: number[]
  phase: PickBanPhase
  pickableChampionIds?: number[]
  session?: ChampSelectSession | null
}

type TimeoutInput = {
  fallbackChampionIds?: number[]
  pickableChampionIds?: number[]
  session?: ChampSelectSession | null
  timer: number
}

function isPickOrBanAction(action: ChampSelectAction): boolean {
  return action.type === 'ban' || action.type === 'pick'
}

function normalizeChampionIds(championIds: number[] | null | undefined): number[] {
  return [...new Set((championIds ?? []).filter((championId) => championId > 0))].sort((left, right) => left - right)
}

function collectActionChampionIds(actions: ChampSelectAction[][] | null | undefined, type: ChampSelectActionType): Set<number> {
  return new Set(
    (actions ?? [])
      .flat()
      .filter((action) => action.type === type && action.completed && action.championId > 0)
      .map((action) => action.championId),
  )
}

export function getPickedChampionIds(session: ChampSelectSession | null | undefined): Set<number> {
  const pickedFromActions = collectActionChampionIds(session?.actions, 'pick')
  for (const member of [...(session?.myTeam ?? []), ...(session?.theirTeam ?? [])]) {
    if (member.championId > 0) {
      pickedFromActions.add(member.championId)
    }
  }

  return pickedFromActions
}

export function getBannedChampionIds(session: ChampSelectSession | null | undefined): Set<number> {
  return collectActionChampionIds(session?.actions, 'ban')
}

export function getCurrentTurn(session: ChampSelectSession | null | undefined): ChampSelectAction[] | null {
  if (session?.timer?.phase !== 'BAN_PICK') {
    return null
  }

  return (session.actions ?? []).find((turn) => turn.some((action) => !action.completed && isPickOrBanAction(action))) ?? null
}

export function getNextTurn(session: ChampSelectSession | null | undefined): ChampSelectAction[] | null {
  if (session?.timer?.phase !== 'BAN_PICK') {
    return null
  }

  return (session.actions ?? []).filter((turn) => turn.some((action) => !action.completed && isPickOrBanAction(action)))[1] ?? null
}

export function getTurnState(session: ChampSelectSession | null | undefined): TurnState {
  const activeTurn = getCurrentTurn(session)
  const activeAction = activeTurn?.find((action) => !action.completed && isPickOrBanAction(action)) ?? null
  const localAction =
    activeTurn?.find(
      (action) => action.actorCellId === session?.localPlayerCellId && !action.completed && isPickOrBanAction(action),
    ) ?? null
  const phase = activeAction?.type === 'ban' || activeAction?.type === 'pick' ? activeAction.type : 'idle'

  return {
    activeAction,
    activeTurn,
    isLocalTurn: Boolean(localAction),
    nextTurn: getNextTurn(session),
    phase,
  }
}

export function getMemberByCellId(session: ChampSelectSession | null | undefined, cellId: number): ChampSelectMember | null {
  return [...(session?.myTeam ?? []), ...(session?.theirTeam ?? [])].find((member) => member.cellId === cellId) ?? null
}

export function buildChampionOptions(input: ChampionFilterInput): ChampionOption[] {
  const pickableChampionIds = new Set(normalizeChampionIds(input.pickableChampionIds))
  const bannableChampionIds = new Set(normalizeChampionIds(input.bannableChampionIds))
  const benchChampionIds = new Set(normalizeChampionIds(input.benchChampionIds ?? input.session?.benchChampionIds))
  const pickedChampionIds = getPickedChampionIds(input.session)
  const bannedChampionIds = getBannedChampionIds(input.session)
  const championIds = normalizeChampionIds([
    ...(input.allChampionIds ?? []),
    ...pickableChampionIds,
    ...bannableChampionIds,
    ...benchChampionIds,
    ...pickedChampionIds,
    ...bannedChampionIds,
  ])

  return championIds.map((championId) => {
    const isPickable = pickableChampionIds.size === 0 || pickableChampionIds.has(championId)
    const isBannable = bannableChampionIds.size === 0 || bannableChampionIds.has(championId)
    const availability: ChampionAvailability = bannedChampionIds.has(championId)
      ? 'banned'
      : pickedChampionIds.has(championId)
        ? 'picked'
        : benchChampionIds.has(championId)
          ? 'bench'
          : input.phase === 'pick'
            ? isPickable
              ? 'available'
              : 'disabled'
            : input.phase === 'ban'
              ? isBannable
                ? 'available'
                : 'disabled'
              : 'disabled'

    return {
      availability,
      championId,
      isActionable: availability === 'available' && (input.phase === 'pick' ? isPickable : input.phase === 'ban' && isBannable),
      isBannable,
      isPickable,
    }
  })
}

export function getBenchChampionOptions(session: ChampSelectSession | null | undefined): number[] {
  return session?.benchEnabled ? normalizeChampionIds(session.benchChampionIds) : []
}

export function canSwapBenchChampion(session: ChampSelectSession | null | undefined, championId: number): boolean {
  return getBenchChampionOptions(session).includes(championId)
}

export function resolveTimeoutAction(input: TimeoutInput): TimeoutResolution {
  if (input.timer > 0) {
    return { action: null, championId: null, shouldCommit: false }
  }

  const turnState = getTurnState(input.session)
  const localAction =
    turnState.activeTurn?.find(
      (action) => action.actorCellId === input.session?.localPlayerCellId && !action.completed && isPickOrBanAction(action),
    ) ?? null

  if (!localAction) {
    return { action: null, championId: null, shouldCommit: false }
  }

  if (localAction.type === 'ban') {
    return { action: localAction, championId: localAction.championId || 0, shouldCommit: true }
  }

  const pickableChampionIds = normalizeChampionIds(input.pickableChampionIds)
  const pickedChampionIds = getPickedChampionIds(input.session)
  const fallbackChampionIds = normalizeChampionIds(input.fallbackChampionIds)
  const championId = [...pickableChampionIds, ...fallbackChampionIds].find((candidate) => !pickedChampionIds.has(candidate)) ?? null

  return { action: localAction, championId, shouldCommit: championId !== null }
}
