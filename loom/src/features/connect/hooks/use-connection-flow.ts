import { useCallback, useEffect, useRef, useState } from 'react'

import { MobileOpcode } from '@shoma/protocol-contract'
import { useNavigate, useSearch } from '@tanstack/react-router'

import { RelayClientState } from '@/core/relay/relay-client'
import { useSharedRelayClient } from '@/core/relay/use-relay-client'
import { relayStoreSelectors, useRelayStore } from '@/core/state/relay-store'
import { requestNotificationPermission } from '@/features/notifications/notification-manager'

import { getConnectionErrorKey, isCompleteConnectCode, readDeviceNameFrame } from '../connect-utils'
import {
  addRecentSession,
  removeRecentSession,
  setRecentSessionDeviceName,
  useRecentSessionsStore,
} from '../recent-sessions-store'

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
    return state.recentSessions
  })
  const [formCode, setFormCode] = useState(() => {
    const initialCode = search.code

    return initialCode && isCompleteConnectCode(initialCode) ? initialCode : ''
  })
  const pendingRecentSessionCode = useRef<string | null>(null)

  useEffect(() => {
    const { code } = search

    if (code && isCompleteConnectCode(code)) {
      setFormCode(code)
    }
  }, [search.code])

  const { client, state: clientState } = useSharedRelayClient()

  /* eslint-disable react-doctor/no-cascading-set-state -- Each branch sets different orthogonal state slices (connected, error, code) based on a single external event (relay client state change) */
  // External system sync: bridges external Relay client lifecycle events into navigation, notification permission, and connection errors.
  useEffect(() => {
    if (clientState === RelayClientState.CONNECTED) {
      setConnected()

      const connectedCode = pendingRecentSessionCode.current

      pendingRecentSessionCode.current = null

      if (connectedCode) {
        addRecentSession(connectedCode)

        if (client) {
          const unsubscribe = client.onData((payload) => {
            const deviceName = readDeviceNameFrame(payload)

            if (!deviceName) {
              return
            }

            setRecentSessionDeviceName(connectedCode, deviceName)
            unsubscribe()
          })

          void client.send(JSON.stringify([MobileOpcode.VERSION])).catch(() => {
            unsubscribe()
          })
        }
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
        const failedCode = pendingRecentSessionCode.current

        pendingRecentSessionCode.current = null
        disconnect()
        setError(connectionError)

        if (
          failedCode &&
          (clientState === RelayClientState.FAILED_INVALID_CODE || clientState === RelayClientState.FAILED_SESSION_EXPIRED)
        ) {
          removeRecentSession(failedCode)
        }
      }
    }
  }, [clientState, client, navigate, setConnected, setError, disconnect])

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

  const handleRemoveRecent = useCallback((recentCode: string) => {
    removeRecentSession(recentCode)
  }, [])

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
    onRemoveRecent: handleRemoveRecent,
    recentSessions,
    setCode: setFormCode,
    status,
  }
}
