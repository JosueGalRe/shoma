import { useEffect, useState } from 'react'

import { Icon } from '@shoma/design-system'

import { errorTextKey, type TranslationKey } from '../app-utils'

import type { ConduitErrorCode } from '../app-types'

export function ErrorToast({ error, t }: { error: ConduitErrorCode; t: (key: TranslationKey) => string }) {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDismissed(true)
    }, 5000)

    return () => {
      return clearTimeout(timer)
    }
  }, [])

  if (dismissed) {
    return null
  }

  return (
    <div className="error-toast error-toast--visible" role="alert">
      <div className="error-toast__icon" />

      <div className="error-toast__content">
        <h3 className="error-toast__title">Connection Error</h3>

        <p className="error-toast__message">{t(errorTextKey(error))}</p>
      </div>

      <button
        aria-label="Dismiss error"
        className="error-toast__dismiss"
        onClick={() => {
          return setDismissed(true)
        }}
        type="button"
      >
        <Icon name="x" size="sm" />
      </button>
    </div>
  )
}
