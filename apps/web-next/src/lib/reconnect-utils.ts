import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { RiftClientState } from '@/core/rift/rift-client'
import { useRiftClient } from '@/core/rift/hooks'
import { useRiftStore } from '@/core/state/rift-store'
import { clearPersistedReturnUrl, readPersistedReturnUrl } from '@/lib/session-utils'

const DEFAULT_CONNECTED_PATH = '/connected/lobby'

export function useGlobalSessionReconnect(): void {
  const navigate = useNavigate()
  const didRedirect = useRef(false)

  const status = useRiftStore((state) => state.status)
  const code = useRiftStore((state) => state.code)
  const setConnected = useRiftStore((state) => state.setConnected)

  const initialReconnectCode = useRef((status === 'idle' || status === 'disconnected') && code.length > 0 ? code : '')
  const shouldReconnectInitialSession = initialReconnectCode.current.length > 0
  const shouldConnect = status === 'connecting' || status === 'connected' || shouldReconnectInitialSession
  const clientOptions = useMemo(
    () => ({
      code: shouldReconnectInitialSession ? initialReconnectCode.current : code,
      enabled: shouldConnect,
    }),
    [code, shouldConnect, shouldReconnectInitialSession],
  )

  const { state: clientState } = useRiftClient(clientOptions)

  // External system sync: Navigation after connection established
  useEffect(() => {
    if (clientState !== RiftClientState.CONNECTED) {
      return
    }

    setConnected()
    initialReconnectCode.current = ''

    if (didRedirect.current) {
      return
    }

    didRedirect.current = true

    const nextUrl = readPersistedReturnUrl() ?? DEFAULT_CONNECTED_PATH
    clearPersistedReturnUrl()
    void navigate({ to: nextUrl, replace: true })
  }, [clientState, navigate, setConnected])
}
