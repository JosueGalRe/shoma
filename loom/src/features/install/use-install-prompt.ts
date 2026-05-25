import { useEffect, useState } from 'react'

import { isBeforeInstallPromptEvent } from './use-install-prompt-utils'

import type { BeforeInstallPromptEvent } from './use-install-prompt-types'

export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    if (typeof globalThis === 'undefined') {
      return undefined
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

    globalThis.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    globalThis.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      globalThis.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      globalThis.removeEventListener('appinstalled', handleAppInstalled)
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
