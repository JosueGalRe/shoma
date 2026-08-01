import { useState } from 'react'

import { invoke } from '@tauri-apps/api/core'

import { retryButtonStyles } from './retry-button-styles'

import type { RetryButtonProps } from './retry-button-types'

const DEBOUNCE_MS = 3000

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

  const { base, spinner, attempt } = retryButtonStyles()

  return (
    <button className={base()} disabled={isActive} onClick={handleRetry} type="button">
      {isDebouncing ? (
        <>
          <span className={spinner()} />

          {t('button.retrying')}
        </>
      ) : (
        <>
          {t('button.retry')}

          {reconnectAttempt > 0 && <span className={attempt()}>{reconnectAttempt}</span>}
        </>
      )}
    </button>
  )
}
