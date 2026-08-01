import { useEffect, useState } from 'react'

import { Icon } from '@shoma/design-system'

import { errorTextKey, type TranslationKey } from '../app-utils'

import { errorToastStyles } from './error-toast-styles'

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

  const { base, icon, content, title, message, dismiss } = errorToastStyles()

  return (
    <div className={base()} role="alert">
      <div className={icon()} />

      <div className={content()}>
        <h3 className={title()}>Connection Error</h3>

        <p className={message()}>{t(errorTextKey(error))}</p>
      </div>

      <button
        aria-label="Dismiss error"
        className={dismiss()}
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
