import { RelayClientState } from '@/core/relay/relay-client'
import { getConnectionErrorKey } from '@/features/connect/connect-utils'

import type { ReconnectErrorKey } from './reconnect-utils-types'

export const DEFAULT_CONNECTED_PATH = '/connected/lobby'

export const DEV_ROUTES_THAT_SKIP_RECONNECT_REDIRECT = ['/prototype-header', '/prototype'] as const

export function isReconnectDevRoute(pathname: string): boolean {
  return DEV_ROUTES_THAT_SKIP_RECONNECT_REDIRECT.some((path) => pathname.startsWith(path))
}

export function getReconnectErrorKey(clientState: RelayClientState): ReconnectErrorKey | null {
  if (
    clientState === RelayClientState.CONNECTED ||
    clientState === RelayClientState.DISCONNECTED ||
    clientState === RelayClientState.CONNECTING ||
    clientState === RelayClientState.HANDSHAKING
  ) {
    return null
  }

  return getConnectionErrorKey(clientState)
}
