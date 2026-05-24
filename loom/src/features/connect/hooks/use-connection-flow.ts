import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'

import { RelayClientState } from '@/core/relay/relay-client'
import { useSharedRelayClient } from '@/core/relay/relay-client-provider'
import { relayStoreSelectors, useRelayStore } from '@/core/state/relay-store'
import { requestNotificationPermission } from '@/features/notifications/notification-manager'

import type { ConnectSearch } from '../connect-types'
import { getConnectionErrorKey, isCompleteConnectCode } from '../connect-utils'

export function useConnectionFlow() {
  const navigate = useNavigate({ from: '/' })
  const search: ConnectSearch = useSearch({ from: '/' })
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
  const [formCode, setFormCode] = useState(() => {
    return isCompleteConnectCode(initialSearchCode.current ?? '')
      ? (initialSearchCode.current ?? '')
      : initialStoredCode.current || ''
  })
  const didAttemptAutoConnect = useRef(false)

  const initializeConnectionFlow = useCallback(() => {
    if (didAttemptAutoConnect.current) {
      return
    }

    const searchCode = initialSearchCode.current
    const storedCode = initialStoredCode.current

    if (searchCode && isCompleteConnectCode(searchCode)) {
      didAttemptAutoConnect.current = true
      connect(searchCode)
    } else if (initialStatus.current === 'disconnected' && isCompleteConnectCode(storedCode)) {
      didAttemptAutoConnect.current = true
      connect(storedCode)
    }
  }, [connect])

  useEffect(() => {
    initializeConnectionFlow()
  }, [initializeConnectionFlow])

  const { state: clientState } = useSharedRelayClient()

  /* eslint-disable react-doctor/no-cascading-set-state -- Each branch sets different orthogonal state slices (connected, error, code) based on a single external event (relay client state change) */
  // External system sync: bridges external Relay client lifecycle events into navigation, notification permission, and connection errors.
  useEffect(() => {
    if (clientState === RelayClientState.CONNECTED) {
      setConnected()
      if (!hasRequestedNotificationPermission.current) {
        hasRequestedNotificationPermission.current = true
        void requestNotificationPermission()
      }
      void navigate({ to: '/connected/lobby' })
    } else if (clientState === RelayClientState.DISCONNECTED) {
      disconnect()
    } else {
      const connectionError = getConnectionErrorKey(clientState)

      if (connectionError) {
        disconnect()
        setError(connectionError)
      }
    }
  }, [clientState, navigate, setConnected, setError, disconnect])

  const handleConnect = useCallback(
    (newCode: string) => {
      if (!isCompleteConnectCode(newCode)) {
        setError('connection.errors.invalidCode')
        return
      }
      setError(null)
      connect(newCode)
    },
    [connect, setError],
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
