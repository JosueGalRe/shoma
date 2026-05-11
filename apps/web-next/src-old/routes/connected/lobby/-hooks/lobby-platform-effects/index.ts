import { useEffect } from 'react'

interface UseLobbyPlatformEffectsOptions {
  readyCheckState: { timer: number; playerResponse: string } | null
  appendLog: (message: string) => void
  setInstallPromptAvailable: (value: boolean) => void
  setIsStandaloneMode: (value: boolean) => void
}

export function useLobbyPlatformEffects(options: UseLobbyPlatformEffectsOptions) {
  const { readyCheckState, appendLog, setInstallPromptAvailable, setIsStandaloneMode } = options

  const readyCheckVisible = Boolean(readyCheckState && readyCheckState.timer > 0)
  const readyCheckResponded = readyCheckState?.playerResponse !== 'None'

  useEffect(() => {
    setIsStandaloneMode(window.matchMedia('(display-mode: standalone)').matches)
  }, [setIsStandaloneMode])

  useEffect(() => {
    const handler = () => setInstallPromptAvailable(true)
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [setInstallPromptAvailable])

  useEffect(() => {
    if (readyCheckVisible) {
      try {
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200])
        }
      } catch {
        /* vibration not supported */
      }
    }
  }, [readyCheckVisible])

  return {
    readyCheckVisible,
    readyCheckResponded,
    showInstallPrompt: async () => {
      const event = (window as unknown as { installPrompt?: { prompt: () => Promise<void> } }).installPrompt
      if (event) {
        await event.prompt()
      }
    },
  }
}
