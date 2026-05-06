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

  const setConnected = useRiftStore((state) => state.setConnected)
  const { state: clientState } = useSharedRiftClient()

  // External system sync: Navigation after connection established
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
