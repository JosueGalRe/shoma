import type { LcuHttpMethodValue, LcuResult } from '@mimic/protocol-contract'

import type { LcuTransportClient } from './lcu-transport'

type Unsubscribe = () => void

export type LcuObserverHandler<TContent = unknown> = (data: TContent) => void | Promise<void>

export type ObserverRegistryLifecycle = {
  onSubscribe?: (path: string) => void
  onUnsubscribe?: (path: string) => void
  onError?: (error: Error) => void
}

type ObserverEntry = {
  handlers: Set<LcuObserverHandler<unknown>>
  transportUnsubscribe: Unsubscribe
  lastPayloadHash: string | null
  lastPayloadAt: number
  lastDispatchAt: number
}

const DEDUPE_WINDOW_MS = 50
const HIGH_FREQUENCY_THROTTLE_MS = 100
const HIGH_FREQUENCY_PATHS = new Set(['/lol-gameflow/v1/gameflow-phase'])

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value)
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right))
  return `{${entries.map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`).join(',')}}`
}

function escapeRegexCharacter(character: string): string {
  return /[\\^$+?.()|[\]{}]/.test(character) ? `\\${character}` : character
}

export function pathPatternToTransportPath(path: string): string {
  if (!path.includes('*')) {
    return path
  }

  return [...path].map((character) => (character === '*' ? '.*' : escapeRegexCharacter(character))).join('')
}

export function pathPatternMatches(pattern: string, path: string): boolean {
  const matcher = `^${pathPatternToTransportPath(pattern)}$`

  try {
    return new RegExp(matcher).test(path)
  } catch {
    return false
  }
}

export function createObserverRegistry(transport: LcuTransportClient, lifecycle: ObserverRegistryLifecycle = {}) {
  const entries = new Map<string, ObserverEntry>()
  const disconnectHandlers = new Set<() => void>()
  const reconnectHandlers = new Set<() => void>()
  const disposeTransportDisconnect = transport.onDisconnect(() => {
    disconnectHandlers.forEach((handler) => handler())
  })
  const disposeTransportReconnect = transport.onReconnect(() => {
    reconnectHandlers.forEach((handler) => handler())
  })

  function reportError(error: unknown): void {
    lifecycle.onError?.(error instanceof Error ? error : new Error('LCU observer handler failed.'))
  }

  function shouldDispatch(path: string, entry: ObserverEntry, payload: unknown): boolean {
    const now = Date.now()
    const nextPayloadHash = stableStringify(payload)

    if (entry.lastPayloadHash === nextPayloadHash && now - entry.lastPayloadAt <= DEDUPE_WINDOW_MS) {
      return false
    }

    if (HIGH_FREQUENCY_PATHS.has(path) && entry.lastDispatchAt > 0 && now - entry.lastDispatchAt < HIGH_FREQUENCY_THROTTLE_MS) {
      entry.lastPayloadHash = nextPayloadHash
      entry.lastPayloadAt = now
      return false
    }

    entry.lastPayloadHash = nextPayloadHash
    entry.lastPayloadAt = now
    entry.lastDispatchAt = now
    return true
  }

  function dispatch(path: string, payload: unknown): void {
    const entry = entries.get(path)
    if (!entry || !shouldDispatch(path, entry, payload)) {
      return
    }

    entry.handlers.forEach((handler) => {
      Promise.resolve(handler(payload)).catch(reportError)
    })
  }

  function subscribe<TContent = unknown>(path: string, handler: LcuObserverHandler<TContent>): Unsubscribe {
    let entry = entries.get(path)

    if (!entry) {
      const transportPath = pathPatternToTransportPath(path)
      const transportUnsubscribe = transport.observe<unknown>(transportPath, (payload) => dispatch(path, payload))
      entry = {
        handlers: new Set(),
        transportUnsubscribe,
        lastPayloadHash: null,
        lastPayloadAt: 0,
        lastDispatchAt: 0,
      }
      entries.set(path, entry)
      lifecycle.onSubscribe?.(path)
    }

    const typedHandler = handler as LcuObserverHandler<unknown>
    entry.handlers.add(typedHandler)

    return () => {
      const currentEntry = entries.get(path)
      if (!currentEntry) {
        return
      }

      currentEntry.handlers.delete(typedHandler)
      if (currentEntry.handlers.size > 0) {
        return
      }

      currentEntry.transportUnsubscribe()
      entries.delete(path)
      lifecycle.onUnsubscribe?.(path)
    }
  }

  function unsubscribe(path: string): void {
    const entry = entries.get(path)
    if (!entry) {
      return
    }

    entry.transportUnsubscribe()
    entries.delete(path)
    lifecycle.onUnsubscribe?.(path)
  }

  function onDisconnect(handler: () => void): Unsubscribe {
    disconnectHandlers.add(handler)
    return () => disconnectHandlers.delete(handler)
  }

  function onReconnect(handler: () => void): Unsubscribe {
    reconnectHandlers.add(handler)
    return () => reconnectHandlers.delete(handler)
  }

  function request<TContent = unknown>(path: string, method?: LcuHttpMethodValue | string, body?: unknown): Promise<LcuResult<TContent>> {
    return transport.request<TContent>(path, method, body)
  }

  function close(): void {
    entries.forEach((entry) => entry.transportUnsubscribe())
    entries.clear()
    disconnectHandlers.clear()
    reconnectHandlers.clear()
    disposeTransportDisconnect()
    disposeTransportReconnect()
  }

  function getSubscriptionCount(path?: string): number {
    if (path) {
      return entries.get(path)?.handlers.size ?? 0
    }

    let count = 0
    entries.forEach((entry) => {
      count += entry.handlers.size
    })
    return count
  }

  return {
    close,
    getSubscriptionCount,
    onDisconnect,
    onReconnect,
    request,
    subscribe,
    unsubscribe,
  }
}

export type ObserverRegistry = ReturnType<typeof createObserverRegistry>
