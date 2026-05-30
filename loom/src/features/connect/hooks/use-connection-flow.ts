import { useCallback, useEffect, useRef, useState } from 'react'

import { useNavigate, useSearch } from '@tanstack/react-router'

import { RelayClientState } from '@/core/relay/relay-client'
import { useSharedRelayClient } from '@/core/relay/use-relay-client'
import { relayStoreSelectors, useRelayStore } from '@/core/state/relay-store'
import { requestNotificationPermission } from '@/features/notifications/notification-manager'

import { getConnectionErrorKey, isCompleteConnectCode } from '../connect-utils'
import { addRecentSession, useRecentSessionsStore } from '../recent-sessions-store'

import type { ConnectSearch } from '../connect-types'

export function useConnectionFlow() {
  const navigate = useNavigate({ from: '/' })
  const search: ConnectSearch = useSearch({ from: '/' })
  const hasRequestedNotificationPermission = useRef(false)

  const status = useRelayStore(relayStoreSelectors.status)
  const connect = useRelayStore(relayStoreSelectors.connect)
  const disconnect = useRelayStore(relayStoreSelectors.disconnect)
  const setConnected = useRelayStore(relayStoreSelectors.setConnected)
  const setError = useRelayStore(relayStoreSelectors.setError)
  const error = useRelayStore(relayStoreSelectors.error)
  const recentSessions = useRecentSessionsStore((state) => {
    return state.recentCodes
  })
  const [formCode, setFormCode] = useState('')
  const pendingRecentSessionCode = useRef<string | null>(null)

  useEffect(() => {
    const searchCode = search.code

    if (searchCode && isCompleteConnectCode(searchCode)) {
      setFormCode(searchCode)
    }
  }, [search.code])

  const { state: clientState } = useSharedRelayClient()

  /* eslint-disable react-doctor/no-cascading-set-state -- Each branch sets different orthogonal state slices (connected, error, code) based on a single external event (relay client state change) */
  // External system sync: bridges external Relay client lifecycle events into navigation, notification permission, and connection errors.
  useEffect(() => {
    if (clientState === RelayClientState.CONNECTED) {
      setConnected()

      if (pendingRecentSessionCode.current) {
        addRecentSession(pendingRecentSessionCode.current)
        pendingRecentSessionCode.current = null
      }

      if (!hasRequestedNotificationPermission.current) {
        hasRequestedNotificationPermission.current = true
        void requestNotificationPermission()
      }

      void navigate({ to: '/connected/lobby' })
    } else if (clientState === RelayClientState.DISCONNECTED) {
      pendingRecentSessionCode.current = null
      disconnect()
    } else {
      const connectionError = getConnectionErrorKey(clientState)

      if (connectionError) {
        pendingRecentSessionCode.current = null
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
      pendingRecentSessionCode.current = newCode
      connect(newCode)
    },
    [connect, setError],
  )

  const handleReconnectRecent = useCallback(
    (recentCode: string) => {
      setFormCode(recentCode)
      handleConnect(recentCode)
    },
    [handleConnect],
  )

  const handleCancel = useCallback(() => {
    pendingRecentSessionCode.current = null
    disconnect()
    setError(null)
  }, [disconnect, setError])

  return {
    clientState,
    code: formCode,
    error,
    handleCancel,
    handleConnect,
    onReconnectRecent: handleReconnectRecent,
    recentSessions,
    setCode: setFormCode,
    status,
  }
}
