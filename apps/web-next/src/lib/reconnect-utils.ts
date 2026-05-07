import { useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { RiftClientState } from '@/core/rift/rift-client'
import { useSharedRiftClient } from '@/core/rift/rift-client-provider'
import { useRiftStore } from '@/core/state/rift-store'
import { clearPersistedReturnUrl, readPersistedReturnUrl } from '@/lib/session-utils'

const DEFAULT_CONNECTED_PATH = '/connected/lobby'

export function useGlobalSessionReconnect(): void {
  const navigate = useNavigate()
  const didRedirect = useRef(false)
  const didAutoReconnect = useRef(false)

  const setConnected = useRiftStore((state) => state.setConnected)
  const disconnect = useRiftStore((state) => state.disconnect)
  const setError = useRiftStore((state) => state.setError)
  const connect = useRiftStore((state) => state.connect)
  const code = useRiftStore((state) => state.code)
  const status = useRiftStore((state) => state.status)
  const { state: clientState } = useSharedRiftClient()

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
    if (clientState === RiftClientState.CONNECTED) {
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

    if (clientState === RiftClientState.DISCONNECTED && status === 'connected') {
      disconnect()
      void navigate({ to: '/', replace: true, search: { code: undefined } })
      return
    }

    if (clientState === RiftClientState.FAILED_NO_DESKTOP) {
      disconnect()
      setError('connection.errors.riftUnreachable')
      return
    }

    if (clientState === RiftClientState.FAILED_DESKTOP_DENY) {
      disconnect()
      setError('connection.errors.denied')
    }
  }, [clientState, navigate, setConnected, disconnect, setError, status])
}
