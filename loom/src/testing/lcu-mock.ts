import { type LcuHttpMethodValue, LcuPaths, type LcuResult } from '@shoma/protocol-contract'

import { pathToObservePattern } from '../core/relay/lcu-transport';

type Observer<TContent = unknown> = (result: LcuResult<TContent>) => void | Promise<void>
type MockEntry = LcuResult

function isMockEntry(value: unknown): value is MockEntry {
  if (!value || typeof value !== 'object') {
    return false
  }

  return typeof Reflect.get(value, 'status') === 'number' && 'content' in value
}

export interface MockLcuTransport {
  close(): void
  emitUpdate(path: string, content: unknown, status?: number): void
  mockChampSelectSession(session: object | null): void
  mockGameflowPhase(phase: string): void
  mockQueueSearch(state: object | null): void
  mockReadyCheck(state: object | null): void
  observe(path: string, handler: Observer): Promise<() => void>
  onDisconnect(listener: () => void): () => void
  onReconnect(listener: () => void): () => void
  request(path: string, _method?: LcuHttpMethodValue, _body?: unknown): Promise<MockEntry>
  setState(path: string, content: unknown, status?: number): void
  unobserve(path: string): Promise<void>
}

function createEntry(value: unknown): MockEntry {
  if (isMockEntry(value)) {
    return value
  }

  return { content: value, status: 200 }
}

function matchesPattern(pattern: string, path: string): boolean {
  try {
    return new RegExp(pattern).test(path)
  } catch {
    return false
  }
}

export function createMockLcuTransport(initialState: Record<string, unknown> = {}): MockLcuTransport {
  const state = new Map<string, MockEntry>(Object.entries(initialState).map(([path, value]) => {return [path, createEntry(value)]}))
  const observers = new Map<string, Set<Observer>>()
  const disconnectListeners = new Set<() => void>()
  const reconnectListeners = new Set<() => void>()

  function setState(path: string, content: unknown, status = 200): void {
    state.set(path, { content, status })
  }

  function notify(path: string, result: MockEntry): void {
    observers.forEach((handlers, observedPath) => {
      if (!matchesPattern(pathToObservePattern(observedPath), path)) {
        return
      }

      handlers.forEach((handler) => {
        Promise.resolve(handler(result)).catch(() => {
          // Mock observers mirror production transport by isolating handler failures.
        })
      })
    })
  }

  return {
    close() {
      state.clear()
      observers.clear()
      disconnectListeners.clear()
      reconnectListeners.clear()
    },
    emitUpdate(path, content, status = 200) {
      const result = { content, status }

      state.set(path, result)
      notify(path, result)
    },

    mockChampSelectSession(session) {
      setState(LcuPaths.champSelect.session, session, session ? 200 : 404)
    },

    mockGameflowPhase(phase) {
      setState(LcuPaths.gameflow.phase, phase)
    },

    mockQueueSearch(searchState) {
      setState(LcuPaths.matchmaking.search, searchState, searchState ? 200 : 404)
    },

    mockReadyCheck(readyCheckState) {
      setState(LcuPaths.matchmaking.readyCheck, readyCheckState, readyCheckState ? 200 : 404)
    },

    observe(path, handler) {
      const handlers = observers.get(path) ?? new Set<Observer>()

      handlers.add(handler)
      observers.set(path, handlers)

      return Promise.resolve(() => {
        handlers.delete(handler)

        if (handlers.size === 0) {
          observers.delete(path)
        }
      })
    },

    onDisconnect(listener) {
      disconnectListeners.add(listener)

      return () => { return disconnectListeners.delete(listener); }
    },

    onReconnect(listener) {
      reconnectListeners.add(listener)

      return () => { return reconnectListeners.delete(listener); }
    },

    request(path: string, _method?: LcuHttpMethodValue, _body?: unknown): Promise<MockEntry> {
      const result = state.get(path) ?? { content: null, status: 404 }

      return Promise.resolve(result)
    },

    setState,

    unobserve(path) {
      observers.delete(path)

      return Promise.resolve()
    },
  }
}
