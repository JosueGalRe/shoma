import { useCallback } from 'react'

import type { ConnectionFormValues } from '../connect-types'
import { logEvent } from '../../../core/logging/app-logger'
import { RiftClient } from '../../../core/rift/rift-client'
import { RiftClientState, type RiftClientState as RiftClientStateValue } from '../../../core/rift/rift-client-types'
import { RiftLcuTransport } from '../../../core/rift/rift-lcu-transport'
import { isSixDigitConnectionCode, persistConnectionCode, resolveConnectionCode } from './use-connection-flow-utils'

type UseConnectionFlowOptions = {
  code: string
  client: RiftClient | null
  lcuTransport: RiftLcuTransport
  appendLog: (line: string) => void
  setCode: (code: string) => void
  setStatus: (status: RiftClientStateValue | null) => void
  setClient: (client: RiftClient | null) => void
  setErrorBanner: (message: string | null) => void
  setFormCode?: (code: string) => void
  resetLcuSession: () => void
  invalidCodeLengthMessage: string
}

export function useConnectionFlow({
  code,
  client,
  lcuTransport,
  appendLog,
  setCode,
  setStatus,
  setClient,
  setErrorBanner,
  setFormCode,
  resetLcuSession,
  invalidCodeLengthMessage,
}: UseConnectionFlowOptions) {
  const resetLcuState = useCallback(() => {
    lcuTransport.reset()
    resetLcuSession()
  }, [lcuTransport, resetLcuSession])

  const handleConnect = useCallback(
    async (nextCode?: string) => {
      const targetCode = resolveConnectionCode(code, nextCode)
      if (!isSixDigitConnectionCode(targetCode)) {
        setErrorBanner(invalidCodeLengthMessage)
        return
      }

      setErrorBanner(null)

      if (client) {
        client.close()
      }

      persistConnectionCode(targetCode)
      setCode(targetCode)
      setFormCode?.(targetCode)
      resetLcuState()
      logEvent('connection_start', { code: targetCode })

      const nextClient = new RiftClient({
        code: targetCode,
        onStateChange(nextState) {
          setStatus(nextState)
          logEvent('connection_state_change', { state: nextState })
        },
        onClose() {
          logEvent('connection_closed')
        },
        onData(payload) {
          appendLog(`receive: ${payload}`)
          lcuTransport.handlePayload(payload)
        },
      })

      setStatus(RiftClientState.CONNECTING)
      setClient(nextClient)
    },
    [
      appendLog,
      client,
      code,
      invalidCodeLengthMessage,
      lcuTransport,
      resetLcuState,
      setClient,
      setCode,
      setErrorBanner,
      setStatus,
      setFormCode,
    ],
  )

  const handleCancel = useCallback(() => {
    if (client) {
      client.close()
    }

    setClient(null)
    setStatus(null)
    setErrorBanner(null)
    resetLcuState()
  }, [client, resetLcuState, setClient, setErrorBanner, setStatus])

  const handleRetry = useCallback(() => {
    void handleConnect()
  }, [handleConnect])

  const handleConnectSubmit = useCallback(
    async (values: ConnectionFormValues) => {
      await handleConnect(values.code)
    },
    [handleConnect],
  )

  return {
    handleCancel,
    handleConnect,
    handleConnectSubmit,
    handleRetry,
  }
}
