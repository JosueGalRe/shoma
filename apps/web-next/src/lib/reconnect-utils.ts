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
    if (clientState !== RiftClientState.CONNECTED) {
      return
    }

    setConnected()

    if (didRedirect.current) {
      return
    }

    didRedirect.current = true

    const nextUrl = readPersistedReturnUrl() ?? DEFAULT_CONNECTED_PATH
    clearPersistedReturnUrl()
    void navigate({ to: nextUrl, replace: true })
  }, [clientState, navigate, setConnected])
}
