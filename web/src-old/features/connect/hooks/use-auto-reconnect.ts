import { useEffect, useRef } from 'react'

import { RiftClientState, type RiftClientState as RiftClientStateValue } from '../../../core/rift/rift-client-types'

const SESSION_CODE_KEY = 'mimicSessionCode'
const SESSION_WAS_CONNECTED_KEY = 'mimicSessionWasConnected'
const RETURN_URL_KEY = 'mimicReturnUrl'

export function persistSessionCode(code: string): void {
  window.sessionStorage.setItem(SESSION_CODE_KEY, code)
}

export function readSessionCode(): string | null {
  return window.sessionStorage.getItem(SESSION_CODE_KEY)
}

export function clearSessionCode(): void {
  window.sessionStorage.removeItem(SESSION_CODE_KEY)
  window.sessionStorage.removeItem(SESSION_WAS_CONNECTED_KEY)
}

export function markSessionConnected(): void {
  window.sessionStorage.setItem(SESSION_WAS_CONNECTED_KEY, 'true')
}

export function wasSessionConnected(): boolean {
  return window.sessionStorage.getItem(SESSION_WAS_CONNECTED_KEY) === 'true'
}

export function saveReturnUrl(): void {
  window.sessionStorage.setItem(RETURN_URL_KEY, window.location.pathname + window.location.search)
}

export function readReturnUrl(): string | null {
  return window.sessionStorage.getItem(RETURN_URL_KEY)
}

export function clearReturnUrl(): void {
  window.sessionStorage.removeItem(RETURN_URL_KEY)
}

function hasQueryCode(): boolean {
  const query = new URLSearchParams(window.location.search).get('code')
  return query !== null && query.length === 6
}

type UseAutoReconnectOptions = {
  status: RiftClientStateValue | null
  code: string
  handleConnect: (nextCode?: string) => Promise<void>
  setErrorBanner: (message: string | null) => void
  setValue: (field: 'code', value: string) => void
  invalidSessionMessage: string
}

export function useAutoReconnect({
  status,
  code,
  handleConnect,
  setErrorBanner,
  setValue,
  invalidSessionMessage,
}: UseAutoReconnectOptions) {
  const didAttemptReconnect = useRef(false)
  const previousStatus = useRef(status)

  useEffect(() => {
    if (didAttemptReconnect.current) {
      return
    }

    didAttemptReconnect.current = true

    if (hasQueryCode()) {
      return
    }

    const sessionCode = readSessionCode()
    if (!sessionCode || code) {
      return
    }

    if (!wasSessionConnected()) {
      return
    }

    setValue('code', sessionCode)
    void handleConnect(sessionCode)
  }, [code, handleConnect, setValue])

  useEffect(() => {
    const prev = previousStatus.current
    previousStatus.current = status

    if (
      status === RiftClientState.FAILED_NO_DESKTOP &&
      (prev === RiftClientState.CONNECTING || prev === RiftClientState.HANDSHAKING)
    ) {
      const sessionCode = readSessionCode()
      if (sessionCode) {
        clearSessionCode()
        clearReturnUrl()
        setErrorBanner(invalidSessionMessage)
      }
    }

    if (status === RiftClientState.CONNECTED) {
      markSessionConnected()
    }
  }, [status, setErrorBanner, invalidSessionMessage])
}
