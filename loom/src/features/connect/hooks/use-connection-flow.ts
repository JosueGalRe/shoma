import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useSharedRelayClient } from '@/core/relay/relay-client-provider'
import { RelayClientState } from '@/core/relay/relay-client'
import { relayStoreSelectors, useRelayStore } from '@/core/state/relay-store'
import { requestNotificationPermission } from '@/features/notifications/notification-manager'

export function useConnectionFlow() {
  const navigate = useNavigate({ from: '/' })
  const search = useSearch({ strict: false }) as { code?: string }
  const hasRequestedNotificationPermission = useRef(false)

  const code = useRelayStore(relayStoreSelectors.code)
  const status = useRelayStore(relayStoreSelectors.status)
  const connect = useRelayStore(relayStoreSelectors.connect)
  const disconnect = useRelayStore(relayStoreSelectors.disconnect)
  const setConnected = useRelayStore(relayStoreSelectors.setConnected)
  const setError = useRelayStore(relayStoreSelectors.setError)
  const error = useRelayStore(relayStoreSelectors.error)
  const initialSearchCode = useRef(search.code)
  const initialStoredCode = useRef(code)
  const initialStatus = useRef(status)
  const [formCode, setFormCode] = useState(() => (initialSearchCode.current?.length === 6 ? initialSearchCode.current : initialStoredCode.current || ''))
  const didAttemptAutoConnect = useRef(false)

  const initializeConnectionFlow = useCallback(() => {
    if (didAttemptAutoConnect.current) {
      return
    }

    const searchCode = initialSearchCode.current
    const storedCode = initialStoredCode.current

    if (searchCode && searchCode.length === 6) {
      didAttemptAutoConnect.current = true
      connect(searchCode)
    } else if (initialStatus.current === 'disconnected' && storedCode.length === 6) {
      didAttemptAutoConnect.current = true
      connect(storedCode)
    }
  }, [connect])

  // External system sync: mount-time auto-connect initializer
  useEffect(() => {
    initializeConnectionFlow()
  }, [initializeConnectionFlow])

  const { state: clientState } = useSharedRelayClient()

  // External system sync: bridges external Relay client lifecycle events into navigation, notification permission, and connection errors.
  useEffect(() => {
    if (clientState === RelayClientState.CONNECTED) {
      setConnected()
      if (!hasRequestedNotificationPermission.current) {
        hasRequestedNotificationPermission.current = true
        void requestNotificationPermission()
      }
      void navigate({ to: '/connected/lobby' })
    } else if (clientState === RelayClientState.FAILED_NO_DESKTOP) {
      disconnect()
      setError('connection.errors.relayUnreachable')
    } else if (clientState === RelayClientState.FAILED_DESKTOP_DENY) {
      disconnect()
      setError('connection.errors.denied')
    } else if (clientState === RelayClientState.DISCONNECTED) {
      disconnect()
    }
  }, [clientState, navigate, setConnected, setError, disconnect])

  const handleConnect = useCallback(
    (newCode: string) => {
      if (newCode.length !== 6) {
        setError('connection.errors.invalidCode')
        return
      }
      setError(null)
      connect(newCode)
    },
    [connect, setError]
  )

  const handleCancel = useCallback(() => {
    disconnect()
    setError(null)
  }, [disconnect, setError])

  return {
    code: formCode,
    setCode: setFormCode,
    status,
    clientState,
    error,
    handleConnect,
    handleCancel,
  }
}
