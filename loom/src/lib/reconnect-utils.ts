import { useEffect, useRef } from 'react'

import { useNavigate, useRouterState } from '@tanstack/react-router'

import { RelayClientState } from '@/core/relay/relay-client'
import { useSharedRelayClient } from '@/core/relay/use-relay-client'
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

  const setConnected = useRelayStore(relayStoreSelectors.setConnected)
  const disconnect = useRelayStore(relayStoreSelectors.disconnect)
  const setError = useRelayStore(relayStoreSelectors.setError)
  const status = useRelayStore(relayStoreSelectors.status)
  const { state: clientState } = useSharedRelayClient()

  const isDevRoute = isReconnectDevRoute(pathname)

  /* eslint-disable react-doctor/no-cascading-set-state -- Reconnect logic branches on a single external state (relay client state) and sets orthogonal UI state (connected, error, navigation) */
  useEffect(() => {
    if (clientState === RelayClientState.CONNECTED) {
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

    if (clientState === RelayClientState.DISCONNECTED && status === 'connected') {
      disconnect()

      void navigate({
        replace: true,
        search: (prev) => {
          return { ...prev, code: undefined }
        },
        to: '/',
      })

      return
    }

    const errorKey = getReconnectErrorKey(clientState)

    if (errorKey) {
      disconnect()
      setError(errorKey)

      return
    }
  }, [clientState, navigate, setConnected, disconnect, setError, status, isDevRoute])
}
