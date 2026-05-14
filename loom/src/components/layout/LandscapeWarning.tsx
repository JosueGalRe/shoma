import { useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'

const ROTATE_DEVICE_ICON = (
  <div className="mb-6 flex size-20 items-center justify-center rounded-full border border-border bg-secondary/80 text-primary">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="12" height="20" x="6" y="2" rx="2" />
      <path d="M12 18h.01" />
    </svg>
  </div>
)

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
  const showWarning = useSyncExternalStore(
    subscribeToOrientationChanges,
    getIsLandscapeMobile,
    () => false,
  )

  if (!showWarning) return null

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/95 p-6 text-center text-foreground backdrop-blur-md">
      {ROTATE_DEVICE_ICON}
      <h2 className="mb-2 text-2xl font-semibold text-primary">{t('layout.rotateDeviceTitle')}</h2>
      <p className="max-w-xs text-muted">{t('layout.rotateDeviceBody')}</p>
    </div>
  )
}
