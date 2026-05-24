import { useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'

import { LandscapeWarningIcon } from './landscape-warning-icon'
import { landscapeWarningStyles } from './landscape-warning-styles'

const LANDSCAPE_QUERY = '(orientation: landscape)'

function getIsLandscapeMobile() {
  if (typeof window === 'undefined') return false

  return window.matchMedia(LANDSCAPE_QUERY).matches && window.innerWidth < 768
}

function subscribeToOrientationChanges(callback: () => void) {
  if (typeof window === 'undefined') return () => {}

  const mediaQuery = window.matchMedia(LANDSCAPE_QUERY)

  window.addEventListener('resize', callback)
  mediaQuery.addEventListener('change', callback)

  return () => {
    window.removeEventListener('resize', callback)
    mediaQuery.removeEventListener('change', callback)
  }
}

export function LandscapeWarning() {
  const { t } = useTranslation()
  const showWarning = useSyncExternalStore(subscribeToOrientationChanges, getIsLandscapeMobile, () => false)
  const styles = landscapeWarningStyles()

  if (!showWarning) return null

  return (
    <div className={styles.overlay()}>
      <LandscapeWarningIcon />
      <h2 className={styles.title()}>{t('layout.rotateDeviceTitle')}</h2>
      <p className={styles.body()}>{t('layout.rotateDeviceBody')}</p>
    </div>
  )
}
