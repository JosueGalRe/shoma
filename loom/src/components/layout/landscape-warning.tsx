import { useSyncExternalStore } from 'react'

import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import { getIsLandscapeMobile, subscribeToOrientationChanges } from './landscape-warning-utils'

export function LandscapeWarning() {
  const { t } = useTranslation()
  const showWarning = useSyncExternalStore(subscribeToOrientationChanges, getIsLandscapeMobile, () => {
    return false
  })

  if (!showWarning) {
    return null
  }

  return (
    <div {...props(styles.overlay)}>
      <svg
        aria-hidden
        fill="none"
        height="40"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="40"
        {...props(styles.icon)}
      >
        <rect height="20" rx="2" width="12" x="6" y="2" />

        <path d="M12 18h.01" />
      </svg>

      <h2 {...props(text.heading2, styles.title)}>{t('layout.rotateDeviceTitle')}</h2>

      <p {...props(text.body2, styles.body)}>{t('layout.rotateDeviceBody')}</p>
    </div>
  )
}

const styles = create({
  body: {
    color: color.textSecondary,
    margin: 0,
    maxWidth: 320,
  },
  icon: {
    color: color.accent,
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: color.background,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    inset: 0,
    justifyContent: 'center',
    padding: 24,
    position: 'fixed',
    textAlign: 'center',
    zIndex: 9999,
  },
  title: {
    color: color.text,
    margin: 0,
  },
})
