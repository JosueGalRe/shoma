import { useSessionStore } from '@/core/state/session-store'

export function readPersistedReturnUrl(): string | null {
  return useSessionStore.getState().returnUrl || null
}

export function clearPersistedReturnUrl(): void {
  useSessionStore.getState().setReturnUrl('')
}
