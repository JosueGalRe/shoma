import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

import { RelayClientState } from '@/core/relay/relay-client'
import { useSharedRelayClient } from '@/core/relay/relay-client-provider'
import { relayStoreSelectors, useRelayStore } from '@/core/state/relay-store'
import { clearPersistedReturnUrl, readPersistedReturnUrl } from '@/lib/session-utils'

import { DEFAULT_CONNECTED_PATH, getReconnectErrorKey, isReconnectDevRoute } from './reconnect-utils-utils'

export function useGlobalSessionReconnect(): void {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => { return state.location.pathname; } })
  const didRedirect = useRef(false)
  const didAutoReconnect = useRef(false)

  const setConnected = useRelayStore(relayStoreSelectors.setConnected)
  const disconnect = useRelayStore(relayStoreSelectors.disconnect)
  const setError = useRelayStore(relayStoreSelectors.setError)
  const connect = useRelayStore(relayStoreSelectors.connect)
  const code = useRelayStore(relayStoreSelectors.code)
  const status = useRelayStore(relayStoreSelectors.status)
  const { state: clientState } = useSharedRelayClient()

  const isDevRoute = isReconnectDevRoute(pathname)

  useEffect(() => {
    if (didAutoReconnect.current) {
      return
    }
    if (status === 'disconnected' && code.length === 6) {
      didAutoReconnect.current = true
      connect(code)
    }
  }, [status, code, connect])

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
      void navigate({ to: nextUrl, replace: true })
      return
    }

    if (clientState === RelayClientState.DISCONNECTED && status === 'connected') {
      disconnect()
      void navigate({ to: '/', replace: true, search: { code: undefined } })
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
