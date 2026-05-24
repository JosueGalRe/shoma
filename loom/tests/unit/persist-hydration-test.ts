import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import type { SessionStore } from '../../src/core/state/session-store'
import type { SettingsStore } from '../../src/core/state/settings-store'

type SettingsModule = {
  useSettingsStore: {
    getState: () => SettingsStore
  }
}

type SessionModule = {
  useSessionStore: {
    getState: () => SessionStore
  }
}

class StorageMock implements Storage {
  readonly #values = new Map<string, string>()

  get length(): number {
    return this.#values.size
  }

  clear(): void {
    this.#values.clear()
  }

  getItem(key: string): string | null {
    return this.#values.get(key) ?? null
  }

  key(index: number): string | null {
    return [...this.#values.keys()][index] ?? null
  }

  removeItem(key: string): void {
    this.#values.delete(key)
  }

  setItem(key: string, value: string): void {
    this.#values.set(key, value)
  }
}

const originalWindow = globalThis.window
const originalLocalStorage = globalThis.localStorage
const originalSessionStorage = globalThis.sessionStorage

function persistedState(state: Record<string, unknown>): string {
  return JSON.stringify({ state, version: 1 })
}

function installStorage(): { localStorage: StorageMock; sessionStorage: StorageMock } {
  const localStorage = new StorageMock()
  const sessionStorage = new StorageMock()

  Object.defineProperty(globalThis, 'window', {
    value: { localStorage, sessionStorage },
    configurable: true,
  })
  Object.defineProperty(globalThis, 'localStorage', { value: localStorage, configurable: true })
  Object.defineProperty(globalThis, 'sessionStorage', { value: sessionStorage, configurable: true })

  return { localStorage, sessionStorage }
}

function installUnavailableStorage(): void {
  Object.defineProperty(globalThis, 'window', { value: {}, configurable: true })
  Object.defineProperty(globalThis, 'localStorage', { value: undefined, configurable: true })
  Object.defineProperty(globalThis, 'sessionStorage', { value: undefined, configurable: true })
}

async function loadSettingsStore(): Promise<SettingsModule> {
  await vi.resetModules()
  return import('../../src/core/state/settings-store')
}

async function loadSessionStore(): Promise<SessionModule> {
  await vi.resetModules()
  return import('../../src/core/state/session-store')
}

beforeEach(() => {
  installStorage()
})

afterEach(() => {
  Object.defineProperty(globalThis, 'window', { value: originalWindow, configurable: true })
  Object.defineProperty(globalThis, 'localStorage', { value: originalLocalStorage, configurable: true })
  Object.defineProperty(globalThis, 'sessionStorage', { value: originalSessionStorage, configurable: true })
})

describe('persisted store hydration', () => {
  test('hydrates settings from localStorage', async () => {
    localStorage.setItem('shoma:settings', persistedState({ theme: 'dark' }))

    const { useSettingsStore } = await loadSettingsStore()

    expect(useSettingsStore.getState().theme).toBe('dark')
  })

  test('hydrates session from localStorage and sessionStorage', async () => {
    localStorage.setItem('shoma:connection', persistedState({ deviceId: 'abc' }))
    sessionStorage.setItem('shoma:session', persistedState({ sessionCode: '123' }))

    const { useSessionStore } = await loadSessionStore()

    expect(useSessionStore.getState()).toMatchObject({ deviceId: 'abc', sessionCode: '123' })
  })

  test('migrates legacy session keys into the session store', async () => {
    localStorage.setItem('deviceID', 'legacy-device')
    localStorage.setItem('conduitID', 'legacy-code')
    sessionStorage.setItem('mimicSessionCode', '123456')

    const { useSessionStore } = await loadSessionStore()

    expect(useSessionStore.getState()).toMatchObject({
      connectionCode: 'legacy-code',
      deviceId: 'legacy-device',
      sessionCode: '123456',
    })
  })

  test('falls back to settings defaults when persisted JSON is malformed', async () => {
    localStorage.setItem('shoma:settings', 'not-json{{{')

    const { useSettingsStore } = await loadSettingsStore()

    expect(useSettingsStore.getState()).toMatchObject({ language: 'en', showOfflineGroup: false, theme: 'system' })
  })

  test('does not crash when browser storage is unavailable', async () => {
    installUnavailableStorage()

    const { useSettingsStore } = await loadSettingsStore()
    const { useSessionStore } = await loadSessionStore()

    expect(useSettingsStore.getState().theme).toBe('system')
    expect(useSessionStore.getState()).toMatchObject({ connectionCode: '', returnUrl: '', sessionCode: '' })
  })

  test('logout clears runtime session data without clearing persisted settings', async () => {
    const { useSettingsStore } = await loadSettingsStore()
    const { useSessionStore } = await loadSessionStore()

    useSettingsStore.getState().setTheme('dark')
    useSessionStore.getState().setSessionCode('abc')

    useSessionStore.getState().logout()

    expect(useSessionStore.getState().sessionCode).toBe('')
    expect(useSettingsStore.getState().theme).toBe('dark')
  })
})
