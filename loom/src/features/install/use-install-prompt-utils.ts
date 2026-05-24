import type { BeforeInstallPromptEvent } from './use-install-prompt-types'

export function isBeforeInstallPromptEvent(event: Event): event is BeforeInstallPromptEvent {
  return 'prompt' in event && 'userChoice' in event
}
