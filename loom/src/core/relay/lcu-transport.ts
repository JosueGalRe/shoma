import { LcuHttpMethod, LcuPaths, MobileOpcode } from '@shoma/protocol-contract'
import * as v from 'valibot'

import { debugError, debugLog } from '../debug'

import { RelayClientDisconnectedError } from './relay-client'

import type { RelayClient } from './relay-client'
import type { LcuHttpMethodValue } from '@shoma/protocol-contract'
import type { LcuObserver } from '@shoma/protocol-contract'
import type { LcuResult } from '@shoma/protocol-contract'

type RelayClientLike = Pick<RelayClient, 'isConnected' | 'onData' | 'onOpen' | 'onClose' | 'send'>

const DEFAULT_REQUEST_TIMEOUT_MS = 10_000

type Unsubscribe = () => void
type MobileFrame = [number, ...unknown[]]

interface PendingRequest<TContent = unknown> {
  path: string
  reject(error: Error): void
  resolve(value: LcuResult<TContent>): void
  timeout: ReturnType<typeof setTimeout>
}

interface ObserverSubscription<TContent = unknown> {
  notify(result: LcuResult<TContent>): void | Promise<void>
}

interface ObserverEntry<TContent = unknown> {
  handlers: Set<ObserverSubscription<TContent>>
  pattern: string
}

export interface LcuTransportOptions {
  requestTimeoutMs?: number
}

// @knip
export class LcuTransportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LcuTransportError'
  }
}

export class LcuTransportTimeoutError extends LcuTransportError {
  constructor(path: string, timeoutMs: number) {
    super(`LCU request timed out after ${timeoutMs}ms: ${path}`)
    this.name = 'LcuTransportTimeoutError'
  }
}

// @knip
export class LcuTransportMalformedResponseError extends LcuTransportError {
  constructor() {
    super('LCU transport received a malformed response frame.')
    this.name = 'LcuTransportMalformedResponseError'
  }
}

const MobileFrameSchema = v.array(v.unknown())

function parseMobileFrame(payload: string): MobileFrame | null {
  try {
    const parsed = v.safeParse(MobileFrameSchema, JSON.parse(payload))

    if (!parsed.success) {
      return null
    }

    const [opcode, ...args] = parsed.output

    return typeof opcode === 'number' ? [opcode, ...args] : null
  } catch {
    return null
  }
}

function escapeRegexCharacter(character: string): string {
  return /[\\^$+?.()|[\]{}]/.test(character) ? `\\${character}` : character
}

export function pathToObservePattern(path: string): string {
  const source = [...path]
    .map((character) => {
      return character === '*' ? '.*' : escapeRegexCharacter(character)
    })
    .join('')

  return `^${source}$`
}

function matchesPattern(pattern: string, path: string): boolean {
  try {
    return new RegExp(pattern).test(path)
  } catch {
    return false
  }
}

export class LcuTransport {
  readonly #client: RelayClientLike
  readonly #requestTimeoutMs: number
  readonly #pendingRequests = new Map<number, PendingRequest>()
  readonly #observers = new Map<string, ObserverEntry>()
  readonly #disconnectListeners = new Set<() => void>()
  readonly #reconnectListeners = new Set<() => void>()
  readonly #disposeData: Unsubscribe
  readonly #disposeOpen: Unsubscribe
  readonly #disposeClose: Unsubscribe

  #requestId = 0

  constructor(client: RelayClientLike, options: LcuTransportOptions = {}) {
    this.#client = client
    this.#requestTimeoutMs = options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS

    this.#disposeData = client.onData((payload) => {
      return this.#handlePayload(payload)
    })

    this.#disposeOpen = client.onOpen(() => {
      return this.#handleOpen()
    })

    this.#disposeClose = client.onClose(() => {
      return this.#handleClose()
    })
  }

  close(): void {
    this.#rejectPending(new RelayClientDisconnectedError())
    this.#observers.clear()
    this.#disconnectListeners.clear()
    this.#reconnectListeners.clear()
    this.#disposeData()
    this.#disposeOpen()
    this.#disposeClose()
  }

  onDisconnect(listener: () => void): Unsubscribe {
    this.#disconnectListeners.add(listener)

    return () => {
      return this.#disconnectListeners.delete(listener)
    }
  }

  onReconnect(listener: () => void): Unsubscribe {
    this.#reconnectListeners.add(listener)

    return () => {
      return this.#reconnectListeners.delete(listener)
    }
  }

  async request<TContent = unknown>(
    path: string = LcuPaths.gameflow.session,
    method: LcuHttpMethodValue = LcuHttpMethod.GET,
    body?: unknown,
  ): Promise<LcuResult<TContent>> {
    if (!this.#client.isConnected) {
      throw new RelayClientDisconnectedError()
    }

    const id = this.#requestId

    this.#requestId += 1
    debugLog('[Mimic] LCU request:', { body, id, method, path })

    return new Promise<LcuResult<TContent>>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.#pendingRequests.delete(id)
        debugError('[Mimic] LCU request timeout:', { id, path })
        reject(new LcuTransportTimeoutError(path, this.#requestTimeoutMs))
      }, this.#requestTimeoutMs)

      const pendingRequest: PendingRequest<TContent> = {
        path,
        reject(error) {
          reject(error)
        },
        resolve(value) {
          resolve(value)
        },
        timeout,
      }

      this.#pendingRequests.set(id, pendingRequest)

      const frame =
        body !== undefined ? [MobileOpcode.REQUEST, id, path, method, body] : [MobileOpcode.REQUEST, id, path, method]

      debugLog('[Mimic] LCU frame:', { frame: JSON.stringify(frame), id })

      this.#client.send(JSON.stringify(frame)).catch((error: unknown) => {
        this.#pendingRequests.delete(id)
        clearTimeout(timeout)
        debugError('[Mimic] LCU request send error:', { error, id, path })
        reject(error instanceof Error ? error : new LcuTransportError('Failed to send LCU request.'))
      })
    })
  }

  async observe<TContent = unknown>(path: string, handler: LcuObserver<TContent>): Promise<Unsubscribe> {
    const pattern = pathToObservePattern(path)
    const entry = this.#observers.get(path) ?? { handlers: new Set<ObserverSubscription<TContent>>(), pattern }
    const subscription: ObserverSubscription<TContent> = {
      notify(result) {
        return handler(result)
      },
    }

    entry.handlers.add(subscription)
    this.#observers.set(path, entry)

    const isFirstHandler = entry.handlers.size === 1

    if (this.#client.isConnected && isFirstHandler) {
      await this.#sendSubscribe(pattern)
    }

    if (isFirstHandler) {
      this.request<TContent>(path)
        .then((result) => {
          entry.handlers.forEach((handlerEntry) => {
            Promise.resolve(handlerEntry.notify(result)).catch(() => {})
          })
        })
        .catch(() => {
          // Initial snapshots are opportunistic; live updates continue once subscribed.
        })
    }

    return () => {
      this.#unobserve(path, subscription).catch(() => {
        // Unsubscribe cleanup cannot be surfaced safely from React effect disposal.
      })
    }
  }

  async unobserve(path: string): Promise<void> {
    const entry = this.#observers.get(path)

    if (!entry) {
      return
    }

    this.#observers.delete(path)

    if (this.#client.isConnected) {
      await this.#sendUnsubscribe(entry.pattern)
    }
  }

  #handlePayload(payload: string): void {
    const frame = parseMobileFrame(payload)

    if (!frame) {
      return
    }

    if (frame[0] === MobileOpcode.RESPONSE) {
      this.#handleResponse(frame)

      return
    }

    if (frame[0] === MobileOpcode.UPDATE) {
      this.#handleUpdate(frame)
    }
  }

  #handleOpen(): void {
    this.#resubscribe().catch(() => {
      this.#handleClose()
    })

    this.#reconnectListeners.forEach((listener) => {
      return listener()
    })
  }

  #handleClose(): void {
    this.#rejectPending(new RelayClientDisconnectedError())

    this.#disconnectListeners.forEach((listener) => {
      return listener()
    })
  }

  #handleResponse(frame: MobileFrame): void {
    const [, id, status, content] = frame

    if (typeof id !== 'number') {
      return
    }

    const pending = this.#pendingRequests.get(id)

    if (!pending) {
      debugError('[Mimic] LCU response for unknown request:', { content, id, status })

      return
    }

    this.#pendingRequests.delete(id)
    clearTimeout(pending.timeout)

    if (typeof status !== 'number') {
      debugError('[Mimic] LCU malformed response:', { content, id, status })
      pending.reject(new LcuTransportMalformedResponseError())

      return
    }

    if (status < 200 || status >= 300) {
      debugError('[Mimic] LCU non-2xx response:', { content, id, path: pending.path, status })
    }

    debugLog('[Mimic] LCU response:', { content, id, path: pending.path, status })
    pending.resolve({ content, status })
  }

  #handleUpdate(frame: MobileFrame): void {
    const [, path, status, content] = frame

    if (typeof path !== 'string' || typeof status !== 'number') {
      return
    }

    this.#observers.forEach((entry) => {
      if (!matchesPattern(entry.pattern, path)) {
        return
      }

      entry.handlers.forEach((handler) => {
        Promise.resolve(handler.notify({ content, status })).catch(() => {
          // Observer failures stay isolated from transport dispatch.
        })
      })
    })
  }

  async #resubscribe(): Promise<void> {
    for (const entry of this.#observers.values()) {
      // eslint-disable-next-line react-doctor/async-await-in-loop -- subscriptions must be sent sequentially to avoid race conditions on the LCU
      await this.#sendSubscribe(entry.pattern)
    }
  }

  async #unobserve(path: string, handler: ObserverSubscription): Promise<void> {
    const entry = this.#observers.get(path)

    if (!entry) {
      return
    }

    entry.handlers.delete(handler)

    if (entry.handlers.size > 0) {
      return
    }

    this.#observers.delete(path)

    if (this.#client.isConnected) {
      await this.#sendUnsubscribe(entry.pattern)
    }
  }

  async #sendSubscribe(pattern: string): Promise<void> {
    await this.#client.send(JSON.stringify([MobileOpcode.SUBSCRIBE, pattern]))
  }

  async #sendUnsubscribe(pattern: string): Promise<void> {
    await this.#client.send(JSON.stringify([MobileOpcode.UNSUBSCRIBE, pattern]))
  }

  #rejectPending(error: Error): void {
    this.#pendingRequests.forEach((pending) => {
      clearTimeout(pending.timeout)
      pending.reject(error)
    })

    this.#pendingRequests.clear()
  }
}

export function createLCUTransport(client: RelayClientLike, options?: LcuTransportOptions): LcuTransport {
  return new LcuTransport(client, options)
}

// @knip
export type LcuTransportClient = LcuTransport
