import type { TFunction } from 'i18next'

import { RiftClientState, type RiftClientState as RiftClientStateValue } from '../../core/rift/rift-client-types'
import type { LobbyDetails, LobbyState, QueueState } from '../../core/rift/rift-lcu-types'
import type { ConnectionCopy } from './connect-types'

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
  if (typeof content !== 'object' || content === null) {
    return null
  }

  const candidate = content as Record<string, unknown>
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
  if (typeof content !== 'object' || content === null) {
    return null
  }

  const state = content as LobbyState
  return {
    memberCount: Array.isArray(state.members) ? state.members.length : 0,
    inviteCount: Array.isArray(state.invitations) ? state.invitations.length : 0,
    queueId: typeof state.gameConfig?.queueId === 'number' ? state.gameConfig.queueId : null,
    mapId: typeof state.gameConfig?.mapId === 'number' ? state.gameConfig.mapId : null,
    queueName: null,
    mapName: null,
  }
}

export function deriveStatusFlags(status: RiftClientStateValue | null) {
  return {
    isFailureState: status === RiftClientState.FAILED_NO_DESKTOP || status === RiftClientState.FAILED_DESKTOP_DENY,
    isPendingState: status === RiftClientState.CONNECTING || status === RiftClientState.HANDSHAKING,
    shouldShowEntry: !status || status === RiftClientState.DISCONNECTED || status === RiftClientState.CONNECTED,
  }
}
