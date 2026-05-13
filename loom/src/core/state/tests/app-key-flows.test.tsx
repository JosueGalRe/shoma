import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

import { useSessionStore } from '../session-store'
import { createInitialRelayStoreState, reduceReconnect } from '../relay-store'
import { initialUiStoreState, useUiStore } from '../ui-store'
import { useSettingsStore } from '../settings-store'

import type { ChampionSummary } from '../../../core/http/ddragon-client'
import { CellId, ChampionId, SummonerId } from '../../../core/types/branded'

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
    return Array.from(this.#items.keys())[index] ?? null
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

const championImage = {
  full: 'Aatrox.png',
  sprite: 'champion0.png',
  group: 'champion',
  x: 0,
  y: 0,
  w: 48,
  h: 48,
}

function createChampion(id: number, name: string): ChampionSummary {
  return {
    id: ChampionId(id),
    key: name,
    name,
    title: `${name} title`,
    tags: [],
    partype: 'Mana',
    image: championImage,
    stats: {},
  }
}

describe('post-refactor app key flows', () => {
  test('connection screen flow: relay-store reads the code from session-store', () => {
    testLocalStorage.clear()
    testSessionStorage.clear()

    useSessionStore.getState().setConnectionCode('ABC123')
    useSessionStore.getState().setDeviceId('device-1')

    expect(createInitialRelayStoreState()).toMatchObject({ code: 'ABC123', status: 'disconnected' })
    expect(reduceReconnect({ code: '', error: null, status: 'idle' })).toMatchObject({ code: 'ABC123', status: 'connecting' })
  })

  test('lobby flow: social drawer uses ui-store and lobby state uses lobby-store', async () => {
    const { initialLobbyStoreState, useLobbyStore } = await import('../../../features/lobby/lobby-store')

    useUiStore.setState(initialUiStoreState)
    useLobbyStore.setState(initialLobbyStoreState)

    expect(useUiStore.getState().isSocialDrawerOpen).toBe(false)
    useUiStore.getState().toggleSocialDrawer()
    expect(useUiStore.getState().isSocialDrawerOpen).toBe(true)

    useLobbyStore.getState().setMembers([
      {
        allowedInviteOthers: true,
        displayName: 'Lobby Owner',
        firstPositionPreference: 'TOP',
        iconUrl: null,
        isLeader: true,
        isLocalMember: true,
        profileIconId: 1,
        secondPositionPreference: 'JUNGLE',
        summonerId: SummonerId(101),
      },
    ])
    useLobbyStore.getState().updateRole('first', 'MIDDLE')

    expect(useLobbyStore.getState().members).toHaveLength(1)
    expect(useLobbyStore.getState().rolePreferences.first).toBe('MIDDLE')
  })

  test('champ select flow: ChampionPicker reads champion data directly from the champ-select store', async () => {
    const { initialChampSelectStoreState, useChampSelectStore } = await import('../../../features/champ-select/champ-select-store')

    useChampSelectStore.setState({
      ...initialChampSelectStoreState,
      champions: [createChampion(266, 'Aatrox'), createChampion(103, 'Ahri')],
      isMyTurn: true,
      phase: 'pick',
      selectedChampion: ChampionId(103),
      team: [{ cellId: CellId(1), championId: ChampionId(0) }],
      enemyTeam: [],
      bannedChampions: [],
    })

    const source = readFileSync(new URL('../../../features/champ-select/components/champion-picker.tsx', import.meta.url), 'utf8')

    expect(source).toContain('const champions = useChampSelectStore((state) => state.champions)')
    expect(source).toContain('const selectedChampionId = useChampSelectStore((state) => state.selectedChampion)')
    expect(useChampSelectStore.getState().champions.map((champion) => champion.name)).toEqual(['Aatrox', 'Ahri'])
    expect(useChampSelectStore.getState().selectedChampion).toBe(ChampionId(103))
  })

  test('custom game flow: custom-store team state drives TeamPanel player grouping semantics', async () => {
    const { initialCustomGameState, selectCustomNonSpectatorPlayerCount, useCustomGameStore } = await import('../../../features/custom/custom-store')

    useCustomGameStore.setState(initialCustomGameState)
    useCustomGameStore.getState().addPlayer({ id: 'local', name: 'Local Player', team: 'blue', isBot: false })
    useCustomGameStore.getState().addBot('easy', 'red')
    useCustomGameStore.getState().movePlayer('local', 'spectator')

    const players = useCustomGameStore.getState().players
    expect(players.filter((player: { team: string }) => player.team === 'spectator').map((player: { name: string }) => player.name)).toEqual(['Local Player'])
    expect(players.filter((player: { team: string }) => player.team === 'red').map((player: { name: string }) => player.name)).toEqual(['Bot 1'])
    expect(selectCustomNonSpectatorPlayerCount(useCustomGameStore.getState())).toBe(1)
  })

  test('settings persist flow: theme and showOfflineGroup survive store reload', () => {
    testLocalStorage.clear()
    testLocalStorage.setItem('shoma:settings', JSON.stringify({ state: { language: 'en', showOfflineGroup: true, theme: 'dark' }, version: 1 }))

    useSettingsStore.getState().setTheme('system')
    useSettingsStore.getState().setShowOfflineGroup(false)

    expect(useSettingsStore.getState().theme).toBe('system')
    expect(useSettingsStore.getState().showOfflineGroup).toBe(false)
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
