import { useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { RelayClientState } from '@/core/relay/relay-client'
import { useSharedRelayClient } from '@/core/relay/relay-client-provider'
import { relayStoreSelectors, useRelayStore } from '@/core/state/relay-store'
import { clearPersistedReturnUrl, readPersistedReturnUrl } from '@/lib/session-utils'

const DEFAULT_CONNECTED_PATH = '/connected/lobby'

export function useGlobalSessionReconnect(): void {
  const navigate = useNavigate()
  const didRedirect = useRef(false)
  const didAutoReconnect = useRef(false)

  const setConnected = useRelayStore(relayStoreSelectors.setConnected)
  const disconnect = useRelayStore(relayStoreSelectors.disconnect)
  const setError = useRelayStore(relayStoreSelectors.setError)
  const connect = useRelayStore(relayStoreSelectors.connect)
  const code = useRelayStore(relayStoreSelectors.code)
  const status = useRelayStore(relayStoreSelectors.status)
  const { state: clientState } = useSharedRelayClient()

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

      if (didRedirect.current) {
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

    if (clientState === RelayClientState.FAILED_DESKTOP_DENY) {
      disconnect()
      setError('connection.errors.denied')
    }
  }, [clientState, navigate, setConnected, disconnect, setError, status])
}
