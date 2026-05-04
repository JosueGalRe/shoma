import {
  clearPersistedReturnUrl as clearPersistedReturnUrlFromStore,
  readPersistedReturnUrl as readPersistedReturnUrlFromStore,
} from '@/core/state/rift-store'

export function readPersistedReturnUrl(): string | null {
  return readPersistedReturnUrlFromStore()
}

export function clearPersistedReturnUrl(): void {
  clearPersistedReturnUrlFromStore()
}
