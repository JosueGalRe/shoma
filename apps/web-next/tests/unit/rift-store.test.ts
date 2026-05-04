import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import {
  clearPersistedConnectionCode,
  clearPersistedReturnUrl,
  createInitialRiftStoreState,
  persistReturnUrl,
  readPersistedConnectionCode,
  readPersistedReturnUrl,
  reduceConnect,
  reduceDisconnect,
  reduceReconnect,
  reduceSetError,
  useRiftStore,
  type RiftStoreState,
} from '../../src/core/state/rift-store'

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

function installStorage(): { localStorage: StorageMock; sessionStorage: StorageMock } {
  const localStorage = new StorageMock()
  const sessionStorage = new StorageMock()
  Object.defineProperty(globalThis, 'window', {
    value: { localStorage, sessionStorage },
    configurable: true,
  })
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorage,
    configurable: true,
  })
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: sessionStorage,
    configurable: true,
  })

  return { localStorage, sessionStorage }
}

beforeEach(() => {
  installStorage()
  useRiftStore.setState({ code: '', error: null, status: 'idle' })
})

afterEach(() => {
  Object.defineProperty(globalThis, 'window', { value: originalWindow, configurable: true })
  Object.defineProperty(globalThis, 'localStorage', { value: originalLocalStorage, configurable: true })
  Object.defineProperty(globalThis, 'sessionStorage', { value: originalSessionStorage, configurable: true })
})

describe('rift persistence helpers', () => {
  test('prefers the session code and clears both persisted code stores', () => {
    localStorage.setItem('conduitID', '111111')
    sessionStorage.setItem('mimicSessionCode', '222222')

    expect(readPersistedConnectionCode()).toBe('222222')
    expect(createInitialRiftStoreState()).toEqual({ code: '222222', error: null, status: 'disconnected' })

    clearPersistedConnectionCode()

    expect(localStorage.getItem('conduitID')).toBeNull()
    expect(sessionStorage.getItem('mimicSessionCode')).toBeNull()
  })

  test('persists and clears return URLs in session storage', () => {
    persistReturnUrl('/connected/lobby')

    expect(readPersistedReturnUrl()).toBe('/connected/lobby')

    clearPersistedReturnUrl()
    expect(readPersistedReturnUrl()).toBeNull()
  })
})

describe('rift reducers and store actions', () => {
  test('connect trims and persists valid codes', () => {
    const state = reduceConnect({ code: '', error: 'old', status: 'idle' }, ' 123456 ')

    expect(state).toEqual({ code: '123456', error: null, status: 'connecting' })
    expect(localStorage.getItem('conduitID')).toBe('123456')
    expect(sessionStorage.getItem('mimicSessionCode')).toBe('123456')
  })

  test('rejects empty connect and reconnect attempts', () => {
    const state: RiftStoreState = { code: '', error: null, status: 'idle' }

    expect(reduceConnect(state, '  ')).toEqual({ code: '', error: 'Connection code is required.', status: 'error' })
    expect(reduceReconnect(state)).toEqual({ code: '', error: 'Connection code is required.', status: 'error' })
  })

  test('reconnect falls back to persisted codes', () => {
    sessionStorage.setItem('mimicSessionCode', '999888')

    expect(reduceReconnect({ code: '', error: 'lost', status: 'disconnected' })).toEqual({
      code: '999888',
      error: null,
      status: 'connecting',
    })
  })

  test('disconnect and setError update status without losing code', () => {
    const connected: RiftStoreState = { code: '123456', error: null, status: 'connected' }

    expect(reduceDisconnect(connected)).toEqual({ code: '123456', error: null, status: 'disconnected' })
    expect(reduceSetError(connected, new Error('denied'))).toEqual({ code: '123456', error: 'denied', status: 'error' })
    expect(reduceSetError(connected, null)).toEqual(connected)
  })

  test('store actions apply reducer state transitions', () => {
    useRiftStore.getState().connect('654321')
    expect(useRiftStore.getState()).toMatchObject({ code: '654321', status: 'connecting' })

    useRiftStore.getState().disconnect()
    expect(useRiftStore.getState()).toMatchObject({ code: '654321', status: 'disconnected' })
  })
})
