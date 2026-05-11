import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { RiftClientState } from '../../core/rift/rift-client-types'
import { useRiftStore } from '../../core/rift/rift-store'
import {
  clearReturnUrl,
  readReturnUrl,
  readSessionCode,
  saveReturnUrl,
  wasSessionConnected,
} from '../../features/connect/hooks/use-auto-reconnect'

export function useRootSessionRedirect() {
  const navigate = useNavigate()
  const status = useRiftStore((state) => state.status)

  useEffect(() => {
    if (status === RiftClientState.CONNECTED) {
      const returnUrl = readReturnUrl()
      if (returnUrl) {
        clearReturnUrl()
        navigate({ to: returnUrl, replace: true })
      }
      return
    }

    const sessionCode = readSessionCode()
    if (!sessionCode || !wasSessionConnected()) {
      return
    }

    const currentPath = window.location.pathname
    if (currentPath === '/' || currentPath === '') {
      return
    }

    saveReturnUrl()
    navigate({ to: '/', replace: true })
  }, [status, navigate])
}
