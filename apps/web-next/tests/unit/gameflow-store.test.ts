/// <reference types="bun" />

import { describe, expect, it } from 'bun:test'

import type { QueryClient } from '@tanstack/react-query'
import { LcuHttpMethod, LcuPaths, type LcuHttpMethodValue, type LcuResult } from '@mimic/protocol-contract'

import {
  createGameflowStore,
  gameflowPhases,
  gameflowSelectors,
  mapLcuGameflowPhase,
  type GameflowPhase,
  type LcuGameflowPhase,
} from '../../src/core/state/gameflow-store'
import type { ObserverRegistry } from '../../src/core/rift/observer'

type MockRequest = {
  body: unknown
  method: LcuHttpMethodValue | string | undefined
  path: string
}

type Deferred<T> = {
  promise: Promise<T>
  reject: (error: unknown) => void
  resolve: (value: T) => void
}

type MockObserver = Pick<ObserverRegistry, 'request' | 'subscribe' | 'onDisconnect' | 'onReconnect'> & {
  dispatch: (path: string, payload: unknown) => void
  disconnect: () => void
  getRequests: () => MockRequest[]
  reconnect: () => void
  setResponse: (path: string, result: LcuResult) => void
  shiftResponse: (path: string, result: LcuResult) => void
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })

  return { promise, reject, resolve }
}

function createQueryClientRecorder() {
  const invalidatedKeys: unknown[] = []
  const invalidateQueries: Pick<QueryClient, 'invalidateQueries'>['invalidateQueries'] = (filters) => {
    invalidatedKeys.push(filters?.queryKey)
    return Promise.resolve()
  }

  return {
    invalidateQueries,
    invalidatedKeys,
  }
}

function createMockObserver(defaultResponse: LcuResult = { content: 'None', status: 200 }): MockObserver {
  const handlers = new Map<string, Set<(payload: unknown) => void | Promise<void>>>()
  const disconnectHandlers = new Set<() => void>()
  const reconnectHandlers = new Set<() => void>()
  const requests: MockRequest[] = []
  const responses = new Map<string, LcuResult[]>([[LcuPaths.gameflow.phase, [defaultResponse]]])

  function nextResponse(path: string): LcuResult {
    const pathResponses = responses.get(path)
    if (!pathResponses || pathResponses.length === 0) {
      return { content: null, status: 200 }
    }

    if (pathResponses.length === 1) {
      return pathResponses[0]
    }

    return pathResponses.shift() ?? { content: null, status: 200 }
  }

  return {
    dispatch(path, payload) {
      handlers.get(path)?.forEach((handler) => {
        void handler(payload)
      })
    },
    disconnect() {
      disconnectHandlers.forEach((handler) => handler())
    },
    getRequests() {
      return requests
    },
    onDisconnect(handler) {
      disconnectHandlers.add(handler)
      return () => disconnectHandlers.delete(handler)
    },
    onReconnect(handler) {
      reconnectHandlers.add(handler)
      return () => reconnectHandlers.delete(handler)
    },
    reconnect() {
      reconnectHandlers.forEach((handler) => handler())
    },
    request<TContent = unknown>(path: string, method?: LcuHttpMethodValue | string, body?: unknown): Promise<LcuResult<TContent>> {
      requests.push({ body, method, path })
      return Promise.resolve(nextResponse(path) as LcuResult<TContent>)
    },
    setResponse(path, result) {
      responses.set(path, [result])
    },
    shiftResponse(path, result) {
      const current = responses.get(path) ?? []
      current.push(result)
      responses.set(path, current)
    },
    subscribe(path, handler) {
      const current = handlers.get(path) ?? new Set()
      current.add(handler as (payload: unknown) => void | Promise<void>)
      handlers.set(path, current)

      return () => {
        current.delete(handler as (payload: unknown) => void | Promise<void>)
      }
    },
  }
}

describe('gameflow store', () => {
  it('transitions through every explicit state machine phase', () => {
    const store = createGameflowStore()

    gameflowPhases.forEach((phase) => {
      store.getState().setPhase(phase)
      expect(store.getState().phase).toBe(phase)
    })
  })

  it('maps observed LCU gameflow phases to store phases', async () => {
    const observer = createMockObserver({ content: 'Lobby', status: 200 })
    const store = createGameflowStore({ observer })

    const unsubscribe = store.getState().bindObserver()
    await Promise.resolve()

    expect(store.getState().phase).toBe('lobby')

    const updates: Array<[LcuGameflowPhase, GameflowPhase]> = [
      ['Matchmaking', 'queue'],
      ['ReadyCheck', 'readyCheck'],
      ['ChampSelect', 'champSelect'],
      ['InProgress', 'inGame'],
      ['EndOfGame', 'postGame'],
      ['None', 'connected'],
    ]

    updates.forEach(([lcuPhase, expectedPhase]) => {
      observer.dispatch(LcuPaths.gameflow.phase, lcuPhase)
      expect(store.getState().phase).toBe(expectedPhase)
    })

    unsubscribe()
  })

  it('returns correct derived selector values', () => {
    const store = createGameflowStore()

    store.getState().setPhase('lobby')
    expect(gameflowSelectors.isInLobby(store.getState())).toBe(true)
    expect(gameflowSelectors.canInvite(store.getState())).toBe(true)

    store.getState().setPhase('queue')
    expect(gameflowSelectors.isInQueue(store.getState())).toBe(true)
    expect(gameflowSelectors.canInvite(store.getState())).toBe(false)

    store.getState().setPhase('readyCheck')
    expect(gameflowSelectors.isReadyCheckActive(store.getState())).toBe(true)

    store.getState().setPhase('champSelect')
    expect(gameflowSelectors.isChampSelectActive(store.getState())).toBe(true)
  })

  it('optimistically enters queue and rolls back with an error when LCU rejects', async () => {
    const deferred = createDeferred<LcuResult>()
    const requests: MockRequest[] = []
    const observer = createMockObserver({ content: 'Lobby', status: 200 })
    observer.request = <TContent = unknown>(path: string, method?: LcuHttpMethodValue | string, body?: unknown): Promise<LcuResult<TContent>> => {
      requests.push({ body, method, path })
      if (path === LcuPaths.lobby.matchmakingSearch) {
        return deferred.promise as Promise<LcuResult<TContent>>
      }

      return Promise.resolve({ content: 'Lobby' as TContent, status: 200 })
    }

    const store = createGameflowStore({ observer })
    store.getState().setPhase('lobby')

    const startQueue = store.getState().startQueue()
    expect(store.getState().phase).toBe('queue')

    deferred.resolve({ content: { message: 'blocked' }, status: 409 })
    await startQueue

    expect(store.getState().phase).toBe('lobby')
    expect(store.getState().error?.message).toContain('409')
    expect(requests[0]).toEqual({ body: undefined, method: LcuHttpMethod.POST, path: LcuPaths.lobby.matchmakingSearch })
  })

  it('optimistically handles ready check accept and decline actions', async () => {
    const observer = createMockObserver({ content: 'ReadyCheck', status: 200 })
    const store = createGameflowStore({ observer })

    store.getState().setPhase('readyCheck')
    await store.getState().acceptReadyCheck()
    expect(store.getState().phase).toBe('champSelect')

    store.getState().setPhase('readyCheck')
    observer.setResponse(LcuPaths.matchmaking.readyCheckDecline, { content: null, status: 500 })
    observer.setResponse(LcuPaths.gameflow.phase, { content: 'ReadyCheck', status: 200 })

    await store.getState().declineReadyCheck()

    expect(store.getState().phase).toBe('readyCheck')
    expect(store.getState().error?.message).toContain('500')
  })

  it('recovers gameflow phase from LCU with retry for transient errors', async () => {
    const observer = createMockObserver()
    observer.setResponse(LcuPaths.gameflow.phase, { content: null, status: 503 })
    observer.shiftResponse(LcuPaths.gameflow.phase, { content: 'ReadyCheck', status: 200 })
    const store = createGameflowStore({ observer })

    await store.getState().recoverFromLcu()

    expect(store.getState().phase).toBe('readyCheck')
    expect(store.getState().isRecovering).toBe(false)
    expect(store.getState().retryCount).toBe(1)
  })

  it('invalidates gameflow query keys when phase changes', () => {
    const queryClient = createQueryClientRecorder()
    const store = createGameflowStore({ queryClient })

    store.getState().setPhaseFromLcu('ChampSelect')

    expect(queryClient.invalidatedKeys).toContainEqual(['gameflow'])
    expect(queryClient.invalidatedKeys).toContainEqual(['lcu', LcuPaths.gameflow.phase])
    expect(queryClient.invalidatedKeys).toContainEqual(['lcu', LcuPaths.gameflow.session])
  })
})

describe('mapLcuGameflowPhase', () => {
  it('falls back unknown or empty LCU phases to connected', () => {
    expect(mapLcuGameflowPhase('UnknownFuturePhase')).toBe('connected')
    expect(mapLcuGameflowPhase(null)).toBe('connected')
  })
})
