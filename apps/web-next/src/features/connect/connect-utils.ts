import type { TFunction } from 'i18next'

import { RiftClientState, type RiftClientState as RiftClientStateValue } from '../../core/rift/rift-client-types'
import type {
  ChampSelectState,
  LobbyDetails,
  LobbyState,
  QueueState,
  ReadyCheckState,
  ReceivedInvite,
} from '../../core/rift/rift-lcu-types'
import type { ConnectionCopy } from './connect-types'

function readObject(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  return value as Record<string, unknown>
}

export function getStatusCopy(status: RiftClientStateValue | null, t: TFunction): ConnectionCopy | null {
  if (!status) {
    return null
  }

  switch (status) {
    case RiftClientState.CONNECTING:
      return {
        title: t(($) => $.connect.status.CONNECTING.title),
        body: t(($) => $.connect.status.CONNECTING.body),
      }
    case RiftClientState.FAILED_NO_DESKTOP:
      return {
        title: t(($) => $.connect.status.FAILED_NO_DESKTOP.title),
        body: t(($) => $.connect.status.FAILED_NO_DESKTOP.body),
      }
    case RiftClientState.FAILED_DESKTOP_DENY:
      return {
        title: t(($) => $.connect.status.FAILED_DESKTOP_DENY.title),
        body: t(($) => $.connect.status.FAILED_DESKTOP_DENY.body),
      }
    case RiftClientState.HANDSHAKING:
      return {
        title: t(($) => $.connect.status.HANDSHAKING.title),
        body: t(($) => $.connect.status.HANDSHAKING.body),
      }
    case RiftClientState.CONNECTED:
      return {
        title: t(($) => $.connect.status.CONNECTED.title),
        body: t(($) => $.connect.status.CONNECTED.body),
      }
    case RiftClientState.DISCONNECTED:
      return {
        title: t(($) => $.connect.status.DISCONNECTED.title),
        body: t(($) => $.connect.status.DISCONNECTED.body),
      }
    default:
      return null
  }
}

export function readInitialCode(): string {
  const query = new URLSearchParams(window.location.search).get('code')
  if (query && query.length === 6) {
    return query
  }

  const stored = window.localStorage.getItem('conduitID')
  if (stored && stored.length === 6) {
    return stored
  }

  return ''
}

export function readQueryCode(): string | null {
  const query = new URLSearchParams(window.location.search).get('code')
  if (!query || query.length !== 6) {
    return null
  }

  return query
}

export function parseQueueState(content: unknown): QueueState | null {
  const candidate = readObject(content)
  if (!candidate) {
    return null
  }

  if (typeof candidate.isCurrentlyInQueue !== 'boolean') {
    return null
  }

  return {
    isCurrentlyInQueue: candidate.isCurrentlyInQueue,
    estimatedQueueTime: typeof candidate.estimatedQueueTime === 'number' ? candidate.estimatedQueueTime : undefined,
    timeInQueue: typeof candidate.timeInQueue === 'number' ? candidate.timeInQueue : undefined,
    searchState: typeof candidate.searchState === 'string' ? candidate.searchState : undefined,
    errors: Array.isArray(candidate.errors) ? (candidate.errors as QueueState['errors']) : undefined,
  }
}

export function parseLobbyDetails(content: unknown): LobbyDetails | null {
  const candidate = readObject(content)
  if (!candidate) {
    return null
  }

  const state = candidate as LobbyState
  return {
    memberCount: Array.isArray(state.members) ? state.members.length : 0,
    inviteCount: Array.isArray(state.invitations) ? state.invitations.length : 0,
    queueId: typeof state.gameConfig?.queueId === 'number' ? state.gameConfig.queueId : null,
    mapId: typeof state.gameConfig?.mapId === 'number' ? state.gameConfig.mapId : null,
    queueName: null,
    mapName: null,
  }
}

export function parseReadyCheckState(content: unknown): ReadyCheckState | null {
  const candidate = readObject(content)
  if (!candidate) {
    return null
  }

  if (typeof candidate.timer !== 'number') {
    return null
  }

  if (typeof candidate.state !== 'string') {
    return null
  }

  if (typeof candidate.playerResponse !== 'string') {
    return null
  }

  return {
    timer: candidate.timer,
    state: candidate.state,
    playerResponse: candidate.playerResponse,
  }
}

function parseInvite(content: unknown): ReceivedInvite | null {
  const candidate = readObject(content)
  if (!candidate) {
    return null
  }

  if (typeof candidate.invitationId !== 'string') {
    return null
  }

  if (typeof candidate.canAcceptInvitation !== 'boolean') {
    return null
  }

  if (typeof candidate.fromSummonerId !== 'number') {
    return null
  }

  if (typeof candidate.state !== 'string') {
    return null
  }

  const gameConfigCandidate = readObject(candidate.gameConfig)
  if (!gameConfigCandidate) {
    return null
  }

  const queueId = typeof gameConfigCandidate.queueId === 'number' ? gameConfigCandidate.queueId : undefined
  const mapId = typeof gameConfigCandidate.mapId === 'number' ? gameConfigCandidate.mapId : undefined

  return {
    invitationId: candidate.invitationId,
    canAcceptInvitation: candidate.canAcceptInvitation,
    fromSummonerId: candidate.fromSummonerId,
    state: candidate.state,
    gameConfig: {
      queueId,
      mapId,
    },
  }
}

export function parseReceivedInvites(content: unknown): ReceivedInvite[] {
  if (!Array.isArray(content)) {
    return []
  }

  const invites: ReceivedInvite[] = []
  for (const item of content) {
    const invite = parseInvite(item)
    if (!invite || invite.state !== 'Pending') {
      continue
    }

    invites.push(invite)
  }

  return invites
}

export function parseChampSelectState(content: unknown): ChampSelectState | null {
  const candidate = readObject(content)
  if (!candidate) {
    return null
  }

  const timer = readObject(candidate.timer)
  if (!timer || typeof timer.phase !== 'string') {
    return null
  }

  const localPlayerCellId = typeof candidate.localPlayerCellId === 'number' ? candidate.localPlayerCellId : null

  const myTeam = Array.isArray(candidate.myTeam) ? candidate.myTeam : []
  const theirTeam = Array.isArray(candidate.theirTeam) ? candidate.theirTeam : []
  const actions = Array.isArray(candidate.actions) ? candidate.actions : []

  let localPlayerChampionId: number | null = null
  if (localPlayerCellId !== null) {
    for (const member of myTeam) {
      const memberCandidate = readObject(member)
      if (!memberCandidate || memberCandidate.cellId !== localPlayerCellId) {
        continue
      }

      localPlayerChampionId = typeof memberCandidate.championId === 'number' ? memberCandidate.championId : null
      break
    }
  }

  let currentTurnActions: Record<string, unknown>[] | null = null
  let hasPendingLocalPick = false

  for (const turn of actions) {
    if (!Array.isArray(turn)) {
      continue
    }

    const parsedTurnActions: Record<string, unknown>[] = []
    let hasPendingActionInTurn = false

    for (const action of turn) {
      const actionCandidate = readObject(action)
      if (!actionCandidate) {
        continue
      }

      parsedTurnActions.push(actionCandidate)

      if (actionCandidate.completed === false) {
        hasPendingActionInTurn = true
      }

      if (actionCandidate.type === 'pick' && actionCandidate.completed === false && actionCandidate.actorCellId === localPlayerCellId) {
        hasPendingLocalPick = true
      }
    }

    if (currentTurnActions === null && hasPendingActionInTurn) {
      currentTurnActions = parsedTurnActions
    }
  }

  let currentActionType: string | null = null
  let currentActionChampionId: number | null = null
  let isLocalPlayerTurn = false

  if (currentTurnActions && localPlayerCellId !== null) {
    for (const action of currentTurnActions) {
      if (action.completed !== false || action.actorCellId !== localPlayerCellId) {
        continue
      }

      isLocalPlayerTurn = true
      currentActionType = typeof action.type === 'string' ? action.type : null
      currentActionChampionId = typeof action.championId === 'number' ? action.championId : null
      break
    }
  }

  return {
    phase: timer.phase,
    timeLeftInPhaseMs: typeof timer.adjustedTimeLeftInPhase === 'number' ? timer.adjustedTimeLeftInPhase : null,
    myTeamCount: myTeam.length,
    theirTeamCount: theirTeam.length,
    localPlayerCellId,
    localPlayerChampionId,
    isLocalPlayerTurn,
    currentActionType,
    currentActionChampionId,
    hasLockedChampion: !hasPendingLocalPick,
  }
}

export function deriveStatusFlags(status: RiftClientStateValue | null) {
  return {
    isFailureState: status === RiftClientState.FAILED_NO_DESKTOP || status === RiftClientState.FAILED_DESKTOP_DENY,
    isPendingState: status === RiftClientState.CONNECTING || status === RiftClientState.HANDSHAKING,
    shouldShowEntry: !status || status === RiftClientState.DISCONNECTED || status === RiftClientState.CONNECTED,
  }
}
