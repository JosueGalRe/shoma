import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

import { RelayClientState } from '@/core/relay/relay-client'
import { useSharedRelayClient } from '@/core/relay/relay-client-provider'
import { relayStoreSelectors, useRelayStore } from '@/core/state/relay-store'
import { clearPersistedReturnUrl, readPersistedReturnUrl } from '@/lib/session-utils'

const DEFAULT_CONNECTED_PATH = '/connected/lobby'

const DEV_ROUTES_THAT_SKIP_RECONNECT_REDIRECT = ['/prototype-header']

export function useGlobalSessionReconnect(): void {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const didRedirect = useRef(false)
  const didAutoReconnect = useRef(false)

  const setConnected = useRelayStore(relayStoreSelectors.setConnected)
  const disconnect = useRelayStore(relayStoreSelectors.disconnect)
  const setError = useRelayStore(relayStoreSelectors.setError)
  const connect = useRelayStore(relayStoreSelectors.connect)
  const code = useRelayStore(relayStoreSelectors.code)
  const status = useRelayStore(relayStoreSelectors.status)
  const { state: clientState } = useSharedRelayClient()

  const isDevRoute = DEV_ROUTES_THAT_SKIP_RECONNECT_REDIRECT.some((path) => pathname.startsWith(path))

  useEffect(() => {
    if (didAutoReconnect.current) {
      return
    }
    if (status === 'disconnected' && code.length === 6) {
      didAutoReconnect.current = true
      connect(code)
    }
  }, [status, code, connect])

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

    if (clientState === RelayClientState.FAILED_NO_DESKTOP) {
      disconnect()
      setError('connection.errors.relayUnreachable')
      return
    }

    if (clientState === RelayClientState.FAILED_DESKTOP_DENIED) {
      disconnect()
      setError('connection.errors.denied')
      return
    }

    if (clientState === RelayClientState.FAILED_INVALID_CODE) {
      disconnect()
      setError('connection.errors.invalidCode')
      return
    }

    if (clientState === RelayClientState.FAILED_RELAY_UNREACHABLE) {
      disconnect()
      setError('connection.errors.relayUnreachable')
      return
    }

    if (clientState === RelayClientState.FAILED_INVALID_TOKEN) {
      disconnect()
      setError('connection.errors.invalidToken')
      return
    }

    if (clientState === RelayClientState.FAILED_MISSING_PUBKEY) {
      disconnect()
      setError('connection.errors.missingPubkey')
      return
    }

    if (clientState === RelayClientState.FAILED_SESSION_EXPIRED) {
      disconnect()
      setError('connection.errors.sessionExpired')
      return
    }

    if (clientState === RelayClientState.FAILED_MALFORMED_MESSAGE) {
      disconnect()
      setError('connection.errors.malformedMessage')
      return
    }

    if (clientState === RelayClientState.FAILED_SERVER_ERROR) {
      disconnect()
      setError('connection.errors.serverError')
      return
    }

    if (clientState === RelayClientState.FAILED_UNKNOWN) {
      disconnect()
      setError('connection.errors.unknown')
      return
    }
  }, [clientState, navigate, setConnected, disconnect, setError, status, isDevRoute, pathname])
}
