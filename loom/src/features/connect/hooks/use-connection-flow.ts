import { useCallback, useEffect, useRef, useState } from 'react'

import { useNavigate, useSearch } from '@tanstack/react-router'

import { RelayClientState } from '@/core/relay/relay-client'
import { useSharedRelayClient } from '@/core/relay/use-relay-client'
import { relayStoreSelectors, useRelayStore } from '@/core/state/relay-store'
import { requestNotificationPermission } from '@/features/notifications/notification-manager'

import { getConnectionErrorKey, isCompleteConnectCode } from '../connect-utils'

import type { ConnectSearch } from '../connect-types'

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
  const [formCode, setFormCode] = useState(code)
  const didAttemptAutoConnect = useRef(false)

  useEffect(() => {
    const searchCode = search.code
    const storedCode = code

    if (searchCode && isCompleteConnectCode(searchCode)) {
      setFormCode(searchCode)
    } else if (!searchCode && storedCode) {
      setFormCode(storedCode)
    }
  }, [search.code, code])

  useEffect(() => {
    if (didAttemptAutoConnect.current) {
      return
    }

    const searchCode = search.code
    const storedCode = code

    if (searchCode && isCompleteConnectCode(searchCode)) {
      didAttemptAutoConnect.current = true
      connect(searchCode)
    } else if (status === 'disconnected' && isCompleteConnectCode(storedCode)) {
      didAttemptAutoConnect.current = true
      connect(storedCode)
    }
  }, [search.code, code, status, connect])

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
    clientState,
    code: formCode,
    error,
    handleCancel,
    handleConnect,
    setCode: setFormCode,
    status,
  }
}
