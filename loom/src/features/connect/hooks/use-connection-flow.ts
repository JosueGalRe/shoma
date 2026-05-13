import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useSharedRiftClient } from '@/core/rift/rift-client-provider'
import { RiftClientState } from '@/core/rift/rift-client'
import { riftStoreSelectors, useRiftStore } from '@/core/state/rift-store'
import { requestNotificationPermission } from '@/features/notifications/notification-manager'

export function useConnectionFlow() {
  const navigate = useNavigate({ from: '/' })
  const search = useSearch({ strict: false }) as { code?: string }
  const hasRequestedNotificationPermission = useRef(false)

  const code = useRiftStore(riftStoreSelectors.code)
  const status = useRiftStore(riftStoreSelectors.status)
  const connect = useRiftStore(riftStoreSelectors.connect)
  const disconnect = useRiftStore(riftStoreSelectors.disconnect)
  const setConnected = useRiftStore(riftStoreSelectors.setConnected)
  const setError = useRiftStore(riftStoreSelectors.setError)
  const error = useRiftStore(riftStoreSelectors.error)
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

  const { state: clientState } = useSharedRiftClient()

  // External system sync: bridges external Rift client lifecycle events into navigation, notification permission, and connection errors.
  useEffect(() => {
    if (clientState === RiftClientState.CONNECTED) {
      setConnected()
      if (!hasRequestedNotificationPermission.current) {
        hasRequestedNotificationPermission.current = true
        void requestNotificationPermission()
      }
      void navigate({ to: '/connected/lobby' })
    } else if (clientState === RiftClientState.FAILED_NO_DESKTOP) {
      disconnect()
      setError('connection.errors.riftUnreachable')
    } else if (clientState === RiftClientState.FAILED_DESKTOP_DENY) {
      disconnect()
      setError('connection.errors.denied')
    } else if (clientState === RiftClientState.DISCONNECTED) {
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
