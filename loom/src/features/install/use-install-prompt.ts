import { useEffect, useState } from 'react'

import { isBeforeInstallPromptEvent } from './use-install-prompt-utils'

import type { BeforeInstallPromptEvent } from './use-install-prompt-types'

export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  /* eslint-disable react-doctor/no-cascading-set-state -- PWA install state is orthogonal; setInstallPrompt and setIsInstalled react to different browser events */
  // External system sync: Browser PWA event listeners
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()

      if (isBeforeInstallPromptEvent(event)) {
        setInstallPrompt(event)
      }
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const promptInstall = async () => {
    if (!installPrompt) {
      return
    }

    await installPrompt.prompt()

    const choice = await installPrompt.userChoice

    if (choice.outcome === 'accepted') {
      setIsInstalled(true)
    }

    setInstallPrompt(null)
  }

  return {
    canInstall: Boolean(installPrompt) && !isInstalled,
    promptInstall,
  }
}
