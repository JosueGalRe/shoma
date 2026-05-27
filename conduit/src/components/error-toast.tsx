import { useEffect, useState } from 'react'

import { Icon } from '@shoma/design-system'
import { errorTextKey, type TranslationKey } from '../app-utils'

import type { ConduitErrorCode } from '../app-types'

export function ErrorToast({
  error,
  t,
}: {
  error: ConduitErrorCode
  t: (key: TranslationKey) => string
}) {
  const [isVisible, setIsVisible] = useState(true)
  const [isRendered, setIsRendered] = useState(true)

  useEffect(() => {
    setIsVisible(true)
    setIsRendered(true)

    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 5000)

    return () => clearTimeout(timer)
  }, [error])

  useEffect(() => {
    if (!isVisible) {
      const timer = setTimeout(() => {
        setIsRendered(false)
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [isVisible])

  if (!isRendered) {
    return null
  }

  return (
    <div
      className={`error-toast ${isVisible ? 'error-toast--visible' : 'error-toast--hidden'}`}
      role="alert"
    >
      <div className="error-toast__icon" />

      <div className="error-toast__content">
        <h3 className="error-toast__title">Connection Error</h3>

        <p className="error-toast__message">{t(errorTextKey(error))}</p>
      </div>

      <button
        className="error-toast__dismiss"
        onClick={() => setIsVisible(false)}
        type="button"
      >
        <Icon name="x" size="sm" />
      </button>
    </div>
  )
}
