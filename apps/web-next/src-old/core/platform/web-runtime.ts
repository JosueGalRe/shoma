type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

type WebRuntimeWindow = Window & {
  installPrompt?: InstallPromptEvent
}

function readWebRuntimeWindow(windowRef: Window): WebRuntimeWindow {
  return windowRef as WebRuntimeWindow
}

function detectIos(userAgent: string): boolean {
  return /(iPad|iPhone|iPod)/g.test(userAgent)
}

function isInstallPromptEvent(event: Event): event is InstallPromptEvent {
  return 'prompt' in event && 'userChoice' in event
}

function applyStandaloneNotchClassNames(windowRef: Window): void {
  windowRef.setTimeout(() => {
    const runningStandalone = readStandaloneMode(windowRef)
    if (!runningStandalone) {
      return
    }

    const probe = windowRef.document.createElement('div')
    const supportsEnv = typeof CSS !== 'undefined' && CSS.supports('padding-top: env(safe-area-inset-top)')
    probe.style.paddingBottom = supportsEnv ? 'env(safe-area-inset-top)' : 'constant(safe-area-inset-top)'

    windowRef.document.body.appendChild(probe)
    const computed = windowRef.getComputedStyle(probe).paddingBottom
    const padding = Number.parseInt(computed, 10)
    windowRef.document.body.removeChild(probe)

    if (!Number.isFinite(padding) || padding <= 0) {
      return
    }

    windowRef.document.body.classList.add('has-notch')
  }, 500)
}

function captureInstallPrompt(windowRef: WebRuntimeWindow): void {
  windowRef.addEventListener('beforeinstallprompt', (event) => {
    if (!isInstallPromptEvent(event)) {
      return
    }

    event.preventDefault()
    windowRef.installPrompt = event
  })
}

function registerTouchStartForActiveStyles(documentRef: Document): void {
  documentRef.addEventListener('touchstart', () => {
    return
  })
}

export function readStandaloneMode(windowRef: Window): boolean {
  const navigatorWithStandalone = windowRef.navigator as Navigator & {
    standalone?: boolean
  }

  return Boolean(navigatorWithStandalone.standalone) || windowRef.matchMedia('(display-mode: standalone)').matches
}

export function canTriggerInstallPrompt(windowRef: Window = window): boolean {
  const runtimeWindow = readWebRuntimeWindow(windowRef)
  return Boolean(runtimeWindow.installPrompt)
}

export async function triggerInstallPrompt(windowRef: Window = window): Promise<boolean> {
  const runtimeWindow = readWebRuntimeWindow(windowRef)
  const promptEvent = runtimeWindow.installPrompt
  if (!promptEvent) {
    return false
  }

  await promptEvent.prompt()
  const choice = await promptEvent.userChoice

  runtimeWindow.installPrompt = undefined
  return choice.outcome === 'accepted'
}

export function initializeWebRuntime(): void {
  const windowRef = readWebRuntimeWindow(window)

  captureInstallPrompt(windowRef)
  registerTouchStartForActiveStyles(windowRef.document)
  applyStandaloneNotchClassNames(windowRef)

  if (detectIos(windowRef.navigator.userAgent)) {
    windowRef.document.body.classList.add('is-ios')
  }
}
