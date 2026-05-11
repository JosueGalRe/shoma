import { useEffect, useRef } from 'react'

import { RiftClientState } from '../../core/rift/rift-client-types'
import { useRiftStore } from '../../core/rift/rift-store'
import { useRiftLcuRuntime } from '../../features/connect/hooks/use-rift-lcu-runtime'
import { useConnectionFlow } from '../../features/connect/hooks/use-connection-flow'
import { readSessionCode, wasSessionConnected } from '../../features/connect/hooks/use-auto-reconnect'

export function useGlobalSessionReconnect() {
  const didAttemptReconnect = useRef(false)

  const {
    status,
    client,
    code,
    appendLog,
    setCode,
    setStatus,
    setClient,
    setPeer,
    setErrorBanner,
    resetLcuSession,
  } = useRiftStore()

  const { lcuTransport } = useRiftLcuRuntime({
    appendLog,
    client,
    setPeer,
    status,
  })

  const { handleConnect } = useConnectionFlow({
    code,
    client,
    lcuTransport,
    appendLog,
    setCode,
    setStatus,
    setClient,
    setErrorBanner,
    resetLcuSession,
    invalidCodeLengthMessage: '',
  })

  useEffect(() => {
    if (didAttemptReconnect.current) {
      return
    }

    didAttemptReconnect.current = true

    if (status === RiftClientState.CONNECTED) {
      return
    }

    const sessionCode = readSessionCode()
    if (!sessionCode || code) {
      return
    }

    if (!wasSessionConnected()) {
      return
    }

    void handleConnect(sessionCode)
  }, [status, code, handleConnect])
}
