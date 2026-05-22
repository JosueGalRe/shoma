import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import {
  createInitialRelayStoreState,
  relayStoreSelectors,
  reduceConnect,
  reduceDisconnect,
  reduceReconnect,
  reduceSetError,
  useRelayStore,
  type RelayStoreState,
} from '../../src/core/state/relay-store'
import { useSessionStore } from '../../src/core/state/session-store'
import { clearPersistedReturnUrl, readPersistedReturnUrl } from '../../src/lib/session-utils'

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
  useSessionStore.getState().setConnectionCode('')
  useSessionStore.getState().logout()
  useRelayStore.setState({ code: '', error: null, status: 'idle' })
})

afterEach(() => {
  Object.defineProperty(globalThis, 'window', { value: originalWindow, configurable: true })
  Object.defineProperty(globalThis, 'localStorage', { value: originalLocalStorage, configurable: true })
  Object.defineProperty(globalThis, 'sessionStorage', { value: originalSessionStorage, configurable: true })
})

describe('relay session store integration', () => {
  test('builds initial state from the centralized connection code', () => {
    useSessionStore.getState().setConnectionCode('222222')

    expect(createInitialRelayStoreState()).toEqual({ code: '222222', error: null, status: 'disconnected' })
  })

  test('reads and clears return URLs through session utilities', () => {
    useSessionStore.getState().setReturnUrl('/connected/lobby')

    expect(readPersistedReturnUrl()).toBe('/connected/lobby')

    clearPersistedReturnUrl()
    expect(readPersistedReturnUrl()).toBeNull()
  })
})

describe('relay reducers and store actions', () => {
  test('connect trims valid codes', () => {
    const state = reduceConnect({ code: '', error: 'old', status: 'idle' }, ' 123456 ')

    expect(state).toEqual({ code: '123456', error: null, status: 'connecting' })
  })

  test('rejects empty connect and reconnect attempts', () => {
    const state: RelayStoreState = { code: '', error: null, status: 'idle' }

    expect(reduceConnect(state, '  ')).toEqual({ code: '', error: 'Connection code is required.', status: 'error' })
    expect(reduceReconnect(state)).toEqual({ code: '', error: 'Connection code is required.', status: 'error' })
  })

  test('reconnect falls back to persisted codes', () => {
    useSessionStore.getState().setConnectionCode('999888')

    expect(reduceReconnect({ code: '', error: 'lost', status: 'disconnected' })).toEqual({
      code: '999888',
      error: null,
      status: 'connecting',
    })
  })

  test('disconnect and setError update status without losing code', () => {
    const connected: RelayStoreState = { code: '123456', error: null, status: 'connected' }

    expect(reduceDisconnect(connected)).toEqual({ code: '123456', error: null, status: 'disconnected' })
    expect(reduceSetError(connected, new Error('denied'))).toEqual({ code: '123456', error: 'denied', status: 'error' })
    expect(reduceSetError(connected, null)).toEqual(connected)
  })

  test('store actions apply reducer state transitions', () => {
    useRelayStore.getState().connect('654321')
    expect(useRelayStore.getState()).toMatchObject({ code: '654321', status: 'connecting' })
    expect(useSessionStore.getState().connectionCode).toBe('654321')

    useSessionStore.getState().setReturnUrl('/connected/lobby')
    useRelayStore.getState().disconnect()
    expect(useRelayStore.getState()).toMatchObject({ code: '654321', status: 'disconnected' })
    expect(useSessionStore.getState().returnUrl).toBe('')
  })

  test('exports stable selectors without changing the store API', () => {
    const state = useRelayStore.getState()

    expect(relayStoreSelectors.code(state)).toBe('')
    expect(relayStoreSelectors.error(state)).toBeNull()
    expect(relayStoreSelectors.status(state)).toBe('idle')
    expect(relayStoreSelectors.connect(state)).toBe(state.connect)
    expect(relayStoreSelectors.disconnect(state)).toBe(state.disconnect)
    expect(relayStoreSelectors.setConnected(state)).toBe(state.setConnected)
    expect(relayStoreSelectors.setError(state)).toBe(state.setError)
    expect(Object.keys(state).sort()).toEqual([
      'code',
      'connect',
      'disconnect',
      'error',
      'reconnect',
      'setConnected',
      'setError',
      'status',
    ])
  })
})
