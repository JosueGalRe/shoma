import { useEffect, useRef } from 'react'

import { useNavigate, useRouterState } from '@tanstack/react-router'

import { isFatalRelayClientState, RelayClientState } from '@/core/relay/relay-client'
import { useSharedRelayClient } from '@/core/relay/use-relay-client'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'
import { relayStoreSelectors, useRelayStore } from '@/core/state/relay-store'
import { getConnectionErrorKey } from '@/features/connect/connect-utils'
import { clearPersistedReturnUrl, readPersistedReturnUrl } from '@/lib/session-utils'

import type { ReconnectErrorKey } from './reconnect-utils-types'

export const DEFAULT_CONNECTED_PATH = '/connected/lobby'

export const DEV_ROUTES_THAT_SKIP_RECONNECT_REDIRECT = ['/prototype-header', '/prototype'] as const

export function isReconnectDevRoute(pathname: string): boolean {
  return DEV_ROUTES_THAT_SKIP_RECONNECT_REDIRECT.some((path) => {
    return pathname.startsWith(path)
  })
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

export function useGlobalSessionReconnect(): void {
  const navigate = useNavigate()
  const pathname = useRouterState({
    select: (state) => {
      return state.location.pathname
    },
  })
  const didRedirect = useRef(false)
  const lastClientState = useRef<RelayClientState | null>(null)

  const setConnected = useRelayStore(relayStoreSelectors.setConnected)
  const disconnect = useRelayStore(relayStoreSelectors.disconnect)
  const setError = useRelayStore(relayStoreSelectors.setError)
  const lose = useRelayStore(relayStoreSelectors.lose)
  const status = useRelayStore(relayStoreSelectors.status)
  const { state: clientState } = useSharedRelayClient()
  const transport = useSharedLCUTransport()

  const isDevRoute = isReconnectDevRoute(pathname)

  // Conduit's notice comes just before the relay drops, so the loss reads as the client closing, not the PC
  useEffect(() => {
    return transport?.onClientClosed(() => {
      lose('client-closed')
    })
  }, [transport, lose])

  useEffect(() => {
    const isNewClientState = lastClientState.current !== clientState

    lastClientState.current = clientState

    if (clientState === RelayClientState.CONNECTED) {
      // Conduit's notice loses the session while its socket is still up; only connecting again brings it back
      if (status === 'lost' && !isNewClientState) {
        return
      }

      setConnected()

      if (didRedirect.current || isDevRoute) {
        return
      }

      didRedirect.current = true

      const nextUrl = readPersistedReturnUrl() ?? DEFAULT_CONNECTED_PATH

      clearPersistedReturnUrl()
      void navigate({ replace: true, to: nextUrl })

      return
    }

    const errorKey = getReconnectErrorKey(clientState)

    // A session that drops stays while its client tries again; only a refusal for good ends it
    if (status === 'connected' || status === 'lost') {
      if (!isFatalRelayClientState(clientState)) {
        if (status === 'connected') {
          lose('pc')
        }

        return
      }

      disconnect()
      setError(errorKey)

      void navigate({
        replace: true,
        search: (prev) => {
          return { ...prev, code: undefined }
        },
        to: '/',
      })

      return
    }

    if (errorKey) {
      disconnect()
      setError(errorKey)

      return
    }
  }, [clientState, navigate, setConnected, disconnect, setError, lose, status, isDevRoute])
}
