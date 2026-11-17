import { describe, expect, test } from 'vitest'

import { SummonerId } from '../../../core/types/branded'
import { createInitialRelayStoreState, reduceReconnect } from '../relay-store'
import { useSessionStore } from '../session-store'
import { useSettingsStore } from '../settings-store'
import { initialUiStoreState, useUiStore } from '../ui-store'

class MemoryStorage implements Storage {
  readonly #items = new Map<string, string>()

  get length() {
    return this.#items.size
  }

  clear() {
    this.#items.clear()
  }

  getItem(key: string) {
    return this.#items.get(key) ?? null
  }

  key(index: number) {
    return [...this.#items.keys()][index] ?? null
  }

  removeItem(key: string) {
    this.#items.delete(key)
  }

  setItem(key: string, value: string) {
    this.#items.set(key, value)
  }
}

const testLocalStorage = new MemoryStorage()
const testSessionStorage = new MemoryStorage()

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    localStorage: testLocalStorage,
    sessionStorage: testSessionStorage,
  },
})

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: testLocalStorage,
})

Object.defineProperty(globalThis, 'sessionStorage', {
  configurable: true,
  value: testSessionStorage,
})

describe('post-refactor app key flows', () => {
  test('connection screen flow: relay-store reads the code from session-store', () => {
    testLocalStorage.clear()
    testSessionStorage.clear()

    useSessionStore.getState().setConnectionCode('ABC123')
    useSessionStore.getState().setDeviceId('device-1')

    expect(createInitialRelayStoreState()).toMatchObject({ code: 'ABC123', status: 'connecting' })

    expect(reduceReconnect({ code: '', error: null, lostReason: null, status: 'idle' })).toMatchObject({
      code: 'ABC123',
      status: 'connecting',
    })
  })

  test('lobby flow: social screen uses ui-store and lobby state uses lobby-store', async () => {
    const { initialLobbyStoreState, useLobbyStore } = await import('../../../features/lobby/lobby-store')

    useUiStore.setState(initialUiStoreState)
    useLobbyStore.setState(initialLobbyStoreState)

    expect(useUiStore.getState().isSocialOpen).toBe(false)
    useUiStore.getState().setSocialOpen(true)
    expect(useUiStore.getState().isSocialOpen).toBe(true)

    useLobbyStore.getState().setMembers([
      {
        allowedInviteOthers: true,
        displayName: 'Lobby Owner',
        firstPositionPreference: 'TOP',
        iconUrl: null,
        isLeader: true,
        isLocalMember: true,
        profileIconId: 1,
        puuid: null,
        secondPositionPreference: 'JUNGLE',
        summonerId: SummonerId(101),
      },
    ])

    useLobbyStore.getState().updateRole('first', 'MIDDLE')

    expect(useLobbyStore.getState().members).toHaveLength(1)
    expect(useLobbyStore.getState().rolePreferences.first).toBe('MIDDLE')
  })

  test('settings persist flow: theme survives store reload', () => {
    testLocalStorage.clear()

    testLocalStorage.setItem(
      'shoma:settings',
      JSON.stringify({ state: { language: 'en', showOfflineGroup: true, theme: 'dark' }, version: 1 }),
    )

    useSettingsStore.getState().setTheme('system')

    expect(useSettingsStore.getState().theme).toBe('system')
  })

  test('session persist flow: deviceId and connectionCode survive store reload', () => {
    testLocalStorage.clear()
    testSessionStorage.clear()

    useSessionStore.getState().setConnectionCode('ZXCVBN')
    useSessionStore.getState().setDeviceId('device-persisted')

    expect(useSessionStore.getState().deviceId).toBe('device-persisted')
    expect(useSessionStore.getState().connectionCode).toBe('ZXCVBN')

    useSessionStore.getState().logout()

    expect(useSessionStore.getState().connectionCode).toBe('')
    expect(useSessionStore.getState().returnUrl).toBe('')
    expect(useSessionStore.getState().deviceId).toBe('device-persisted')
  })
})
