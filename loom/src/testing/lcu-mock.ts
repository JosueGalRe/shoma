import { LcuPaths, type LcuHttpMethodValue, type LcuResult } from '@shoma/protocol-contract'

import { pathToObservePattern, type LcuTransport } from '../core/rift/lcu-transport'

type Observer<TContent = unknown> = (result: LcuResult<TContent>) => void | Promise<void>
type MockEntry = LcuResult<unknown>

export type MockLcuTransport = Pick<LcuTransport, 'close' | 'observe' | 'onDisconnect' | 'onReconnect' | 'request' | 'unobserve'> & {
  emitUpdate<TContent = unknown>(path: string, content: TContent, status?: number): void
  mockChampSelectSession(session: object | null): void
  mockGameflowPhase(phase: string): void
  mockQueueSearch(state: object | null): void
  mockReadyCheck(state: object | null): void
  setState(path: string, content: unknown, status?: number): void
}

function createEntry(value: unknown): MockEntry {
  if (value && typeof value === 'object' && 'status' in value && 'content' in value) {
    const result = value as Partial<LcuResult<unknown>>

    if (typeof result.status === 'number') {
      return { status: result.status, content: result.content }
    }
  }

  return { status: 200, content: value }
}

function matchesPattern(pattern: string, path: string): boolean {
  try {
    return new RegExp(pattern).test(path)
  } catch {
    return false
  }
}

export function createMockLcuTransport(initialState: Record<string, unknown> = {}): MockLcuTransport {
  const state = new Map<string, MockEntry>(Object.entries(initialState).map(([path, value]) => [path, createEntry(value)]))
  const observers = new Map<string, Set<Observer>>()
  const disconnectListeners = new Set<() => void>()
  const reconnectListeners = new Set<() => void>()

  function setState(path: string, content: unknown, status = 200): void {
    state.set(path, { status, content })
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
      const result = { status, content }
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
      handlers.add(handler as Observer)
      observers.set(path, handlers)

      return Promise.resolve(() => {
        handlers.delete(handler as Observer)
        if (handlers.size === 0) {
          observers.delete(path)
        }
      })
    },
    onDisconnect(listener) {
      disconnectListeners.add(listener)
      return () => disconnectListeners.delete(listener)
    },
    onReconnect(listener) {
      reconnectListeners.add(listener)
      return () => reconnectListeners.delete(listener)
    },
    request<TContent = unknown>(path: string, _method?: LcuHttpMethodValue, _body?: unknown): Promise<LcuResult<TContent>> {
      const result = state.get(path) ?? { status: 404, content: null }
      return Promise.resolve(result as LcuResult<TContent>)
    },
    setState,
    unobserve(path) {
      observers.delete(path)
      return Promise.resolve()
    },
  }
}
