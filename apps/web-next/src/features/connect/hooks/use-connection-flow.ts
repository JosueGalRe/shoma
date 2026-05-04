import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useRiftClient } from '@/core/rift/hooks'
import { RiftClientState } from '@/core/rift/rift-client'
import { useRiftStore } from '@/core/state/rift-store'
import { requestNotificationPermission } from '@/features/notifications/notification-manager'

export function useConnectionFlow() {
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { code?: string }
  const hasRequestedNotificationPermission = useRef(false)
  
  const { code, status, connect, disconnect, setConnected, setError, error } = useRiftStore()
  const [formCode, setFormCode] = useState(code || '')
  
  useEffect(() => {
    if (search.code && search.code.length === 6) {
      setFormCode(search.code)
      connect(search.code)
    } else if (status === 'disconnected' && code.length === 6) {
      connect(code)
    }
  }, [search.code, connect, status, code])

  const { state: clientState } = useRiftClient({
    code,
    enabled: status === 'connecting' || status === 'connected',
  })

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
