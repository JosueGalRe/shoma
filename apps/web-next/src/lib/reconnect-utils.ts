import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { RiftClientState } from '@/core/rift/rift-client'
import { useRiftClient } from '@/core/rift/hooks'
import { useRiftStore } from '@/core/state/rift-store'
import { clearPersistedReturnUrl, readPersistedReturnUrl } from '@/lib/session-utils'

const DEFAULT_CONNECTED_PATH = '/connected/lobby'

export function useGlobalSessionReconnect(): void {
  const navigate = useNavigate()
  const didAttemptReconnect = useRef(false)
  const didRedirect = useRef(false)

  const status = useRiftStore((state) => state.status)
  const code = useRiftStore((state) => state.code)
  const reconnect = useRiftStore((state) => state.reconnect)
  const setConnected = useRiftStore((state) => state.setConnected)

  const shouldConnect = status === 'connecting' || status === 'connected'
  const clientOptions = useMemo(
    () => ({
      code,
      enabled: shouldConnect,
    }),
    [code, shouldConnect],
  )

  const { state: clientState } = useRiftClient(clientOptions)

  useEffect(() => {
    if (didAttemptReconnect.current) {
      return
    }

    if (!code || (status !== 'idle' && status !== 'disconnected')) {
      return
    }

    didAttemptReconnect.current = true
    reconnect()
  }, [code, reconnect, status])

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
