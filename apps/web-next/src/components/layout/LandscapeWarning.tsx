import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export function LandscapeWarning() {
  const [showWarning, setShowWarning] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkOrientation = () => {
      const isLandscape = window.matchMedia('(orientation: landscape)').matches
      const isMobile = window.innerWidth < 768
      setShowWarning(isLandscape && isMobile)
    }

    checkOrientation()

    window.addEventListener('resize', checkOrientation)
    const mediaQuery = window.matchMedia('(orientation: landscape)')
    
    // Modern browsers support addEventListener on MediaQueryList
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', checkOrientation)
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(checkOrientation)
    }

    return () => {
      window.removeEventListener('resize', checkOrientation)
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', checkOrientation)
      } else {
        mediaQuery.removeListener(checkOrientation)
      }
    }
  }, [])

  if (!showWarning) return null

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/95 p-6 text-center backdrop-blur-md">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-secondary/50">
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
          className="text-primary"
        >
          <rect width="12" height="20" x="6" y="2" rx="2" />
          <path d="M12 18h.01" />
        </svg>
      </div>
      <h2 className="mb-2 text-2xl font-bold text-primary">{t('layout.rotateDeviceTitle')}</h2>
      <p className="max-w-xs text-muted-foreground">{t('layout.rotateDeviceBody')}</p>
    </div>
  )
}
