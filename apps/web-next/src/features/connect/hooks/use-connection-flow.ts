import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'

import { useRiftClient } from '@/core/rift/hooks'
import { RiftClientState } from '@/core/rift/rift-client'
import { useRiftStore } from '@/core/state/rift-store'

export function useConnectionFlow() {
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { code?: string }
  
  const { code, status, connect, disconnect, setError, error } = useRiftStore()
  const [formCode, setFormCode] = useState(code || '')
  
  useEffect(() => {
    if (search.code && search.code.length === 6) {
      setFormCode(search.code)
      connect(search.code)
    } else if (status === 'disconnected' && code.length === 6) {
      connect(code)
    }
  }, [search.code, connect, status, code])

  const { client, state: clientState } = useRiftClient({
    code,
    enabled: status === 'connecting' || status === 'connected',
  })

  useEffect(() => {
    if (clientState === RiftClientState.CONNECTED) {
      navigate({ to: '/connected/lobby' })
    } else if (clientState === RiftClientState.FAILED_NO_DESKTOP) {
      setError('Could not connect to Rift. Is the desktop app running?')
      disconnect()
    } else if (clientState === RiftClientState.FAILED_DESKTOP_DENY) {
      setError('Connection was denied by the desktop app.')
      disconnect()
    }
  }, [clientState, navigate, setError, disconnect, status])

  const handleConnect = useCallback(
    (newCode: string) => {
      if (newCode.length !== 6) {
        setError('Code must be exactly 6 digits.')
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
