/// <reference types="bun" />

import { afterEach, describe, expect, it } from 'bun:test'

import type { LcuResult } from '@mimic/protocol-contract'

import type { LcuTransportClient } from '../../src/core/rift/lcu-transport'
import { createObserverRegistry, pathPatternMatches } from '../../src/core/rift/observer'

type MockTransport = LcuTransportClient & {
  dispatch: (path: string, payload: unknown) => void
  getObservedPaths: () => string[]
  getUnobservedPaths: () => string[]
  disconnect: () => void
  reconnect: () => void
}

const originalDateNow = Date.now

function createMockTransport(): MockTransport {
  const observers = new Map<string, (payload: unknown) => void | Promise<void>>()
  const unobservedPaths: string[] = []
  const disconnectHandlers = new Set<() => void>()
  const reconnectHandlers = new Set<() => void>()

  return {
    close() {},
    connect() {},
    dispatch(path, payload) {
      observers.forEach((handler, observedPath) => {
        if (new RegExp(`^${observedPath}$`).test(path)) {
          void handler(payload)
        }
      })
    },
    disconnect() {
      disconnectHandlers.forEach((handler) => handler())
    },
    getObservedPaths() {
      return [...observers.keys()]
    },
    getUnobservedPaths() {
      return unobservedPaths
    },
    observe(path, handler) {
      observers.set(path, handler as (payload: unknown) => void | Promise<void>)

      return () => {
        observers.delete(path)
        unobservedPaths.push(path)
      }
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
    request<TContent = unknown>(): Promise<LcuResult<TContent>> {
      return Promise.resolve({ status: 200, content: null as TContent })
    },
  }
}

function setNow(value: number): void {
  Date.now = () => value
}

afterEach(() => {
  Date.now = originalDateNow
})

describe('createObserverRegistry', () => {
  it('subscribes, dispatches updates, and unsubscribes cleanly', () => {
    const transport = createMockTransport()
    const subscribedPaths: string[] = []
    const unsubscribedPaths: string[] = []
    const registry = createObserverRegistry(transport, {
      onSubscribe: (path) => subscribedPaths.push(path),
      onUnsubscribe: (path) => unsubscribedPaths.push(path),
    })
    const updates: unknown[] = []

    const unsubscribe = registry.subscribe('/lol-lobby/v2/lobby', (payload) => {
      updates.push(payload)
    })

    expect(transport.getObservedPaths()).toEqual(['/lol-lobby/v2/lobby'])
    expect(subscribedPaths).toEqual(['/lol-lobby/v2/lobby'])

    transport.dispatch('/lol-lobby/v2/lobby', { canStartActivity: true })
    expect(updates).toEqual([{ canStartActivity: true }])

    unsubscribe()

    expect(registry.getSubscriptionCount()).toBe(0)
    expect(transport.getUnobservedPaths()).toEqual(['/lol-lobby/v2/lobby'])
    expect(unsubscribedPaths).toEqual(['/lol-lobby/v2/lobby'])
  })

  it('does not leak subscriptions after repeated mount and unmount cycles', () => {
    const transport = createMockTransport()
    const registry = createObserverRegistry(transport)

    for (let index = 0; index < 100; index += 1) {
      const unsubscribe = registry.subscribe('/test/path', () => {})
      unsubscribe()
    }

    expect(registry.getSubscriptionCount()).toBe(0)
    expect(transport.getObservedPaths()).toEqual([])
    expect(transport.getUnobservedPaths()).toHaveLength(100)
  })

  it('deduplicates identical payloads received within 50ms', () => {
    const transport = createMockTransport()
    const registry = createObserverRegistry(transport)
    const updates: unknown[] = []
    registry.subscribe('/test/path', (payload) => {
      updates.push(payload)
    })

    setNow(1_000)
    transport.dispatch('/test/path', { value: 1 })
    setNow(1_030)
    transport.dispatch('/test/path', { value: 1 })
    setNow(1_051)
    transport.dispatch('/test/path', { value: 1 })

    expect(updates).toEqual([{ value: 1 }, { value: 1 }])
  })

  it('throttles high-frequency gameflow phase updates to one event per 100ms', () => {
    const transport = createMockTransport()
    const registry = createObserverRegistry(transport)
    const updates: unknown[] = []
    registry.subscribe('/lol-gameflow/v1/gameflow-phase', (payload) => {
      updates.push(payload)
    })

    setNow(2_000)
    transport.dispatch('/lol-gameflow/v1/gameflow-phase', 'Lobby')
    setNow(2_050)
    transport.dispatch('/lol-gameflow/v1/gameflow-phase', 'Matchmaking')
    setNow(2_100)
    transport.dispatch('/lol-gameflow/v1/gameflow-phase', 'ReadyCheck')

    expect(updates).toEqual(['Lobby', 'ReadyCheck'])
  })

  it('matches exact paths and wildcard path patterns', () => {
    const transport = createMockTransport()
    const registry = createObserverRegistry(transport)
    const exactUpdates: unknown[] = []
    const wildcardUpdates: unknown[] = []

    registry.subscribe('/lol-lobby/v2/lobby', (payload) => {
      exactUpdates.push(payload)
    })
    registry.subscribe('/lol-champ-select/v1/session/*', (payload) => {
      wildcardUpdates.push(payload)
    })

    expect(pathPatternMatches('/lol-lobby/v2/lobby', '/lol-lobby/v2/lobby')).toBe(true)
    expect(pathPatternMatches('/lol-lobby/v2/lobby', '/lol-lobby/v2/party')).toBe(false)
    expect(pathPatternMatches('/lol-champ-select/v1/session/*', '/lol-champ-select/v1/session/actions/1')).toBe(true)

    transport.dispatch('/lol-lobby/v2/lobby', { lobby: true })
    transport.dispatch('/lol-champ-select/v1/session/actions/1', { action: 1 })

    expect(exactUpdates).toEqual([{ lobby: true }])
    expect(wildcardUpdates).toEqual([{ action: 1 }])
    expect(transport.getObservedPaths()).toEqual(['/lol-lobby/v2/lobby', '/lol-champ-select/v1/session/.*'])
  })
})
