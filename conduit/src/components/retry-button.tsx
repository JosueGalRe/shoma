import { useState } from 'react'

import { invoke } from '@tauri-apps/api/core'

import type { TranslationKey } from '../app-utils'

const DEBOUNCE_MS = 3000

interface RetryButtonProps {
  reconnectAttempt: number
  disabled: boolean
  t: (key: TranslationKey) => string
}

export function RetryButton({ reconnectAttempt, disabled, t }: RetryButtonProps) {
  const [isDebouncing, setIsDebouncing] = useState(false)

  const handleRetry = async () => {
    if (isDebouncing || disabled) {
      return
    }

    setIsDebouncing(true)

    try {
      await invoke('reconnect_now')
    } catch (error) {
      console.error('failed to trigger reconnect:', error)
    }

    setTimeout(() => {
      setIsDebouncing(false)
    }, DEBOUNCE_MS)
  }

  const isActive = isDebouncing || disabled

  return (
    <button className="retry-button" disabled={isActive} onClick={handleRetry} type="button">
      {isDebouncing ? (
        <>
          <span className="retry-spinner" />

          {t('button.retrying')}
        </>
      ) : (
        <>
          {t('button.retry')}

          {reconnectAttempt > 0 && <span className="retry-attempt">{reconnectAttempt}</span>}
        </>
      )}
    </button>
  )
}
