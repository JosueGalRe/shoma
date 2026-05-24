import { useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'

import { LandscapeWarningIcon } from './landscape-warning-icon'
import { landscapeWarningStyles } from './landscape-warning-styles'
import { getIsLandscapeMobile, subscribeToOrientationChanges } from './landscape-warning-utils'

export function LandscapeWarning() {
  const { t } = useTranslation()
  const showWarning = useSyncExternalStore(subscribeToOrientationChanges, getIsLandscapeMobile, () => {return false})
  const styles = landscapeWarningStyles()

  if (!showWarning) { return null }

  return (
    <div className={styles.overlay()}>
      <LandscapeWarningIcon />
      <h2 className={styles.title()}>{t('layout.rotateDeviceTitle')}</h2>
      <p className={styles.body()}>{t('layout.rotateDeviceBody')}</p>
    </div>
  )
}
