import { LcuHttpMethod, LcuPaths, MobileOpcode, type LcuHttpMethodValue, type LcuResult } from '@mimic/protocol-contract'

import { RiftClient, RiftClientDisconnectedError } from '@/core/rift/rift-client'

const DEFAULT_REQUEST_TIMEOUT_MS = 10_000

type Unsubscribe = () => void
type MobileFrame = [number, ...unknown[]]

type PendingRequest<TContent = unknown> = {
  path: string
  reject: (error: Error) => void
  resolve: (value: LcuResult<TContent>) => void
  timeout: ReturnType<typeof setTimeout>
}

type ObserverEntry<TContent = unknown> = {
  handlers: Set<(result: LcuResult<TContent>) => void | Promise<void>>
  pattern: string
}

export type LcuTransportOptions = {
  requestTimeoutMs?: number
}

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

export class LcuTransportMalformedResponseError extends LcuTransportError {
  constructor() {
    super('LCU transport received a malformed response frame.')
    this.name = 'LcuTransportMalformedResponseError'
  }
}

function parseMobileFrame(payload: string): MobileFrame | null {
  try {
    const parsed: unknown = JSON.parse(payload)
    return Array.isArray(parsed) && typeof parsed[0] === 'number' ? (parsed as MobileFrame) : null
  } catch {
    return null
  }
}

function escapeRegexCharacter(character: string): string {
  return /[\\^$+?.()|[\]{}]/.test(character) ? `\\${character}` : character
}

export function pathToObservePattern(path: string): string {
  const source = Array.from(path).map((character) => (character === '*' ? '.*' : escapeRegexCharacter(character))).join('')
  return `^${source}$`
}

function matchesPattern(pattern: string, path: string): boolean {
  try {
    return new RegExp(pattern).test(path)
  } catch {
    return false
  }
}

function normalizeBody(body: unknown): string | undefined {
  if (body === undefined || typeof body === 'string') {
    return body
  }

  return JSON.stringify(body)
}

export class LcuTransport {
  readonly #client: RiftClient
  readonly #requestTimeoutMs: number
  readonly #pendingRequests = new Map<number, PendingRequest>()
  readonly #observers = new Map<string, ObserverEntry>()
  readonly #disconnectListeners = new Set<() => void>()
  readonly #reconnectListeners = new Set<() => void>()
  readonly #disposeData: Unsubscribe
  readonly #disposeOpen: Unsubscribe
  readonly #disposeClose: Unsubscribe

  #requestId = 0

  constructor(client: RiftClient, options: LcuTransportOptions = {}) {
    this.#client = client
    this.#requestTimeoutMs = options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS
    this.#disposeData = client.onData((payload) => this.#handlePayload(payload))
    this.#disposeOpen = client.onOpen(() => this.#handleOpen())
    this.#disposeClose = client.onClose(() => this.#handleClose())
  }

  close(): void {
    this.#rejectPending(new RiftClientDisconnectedError())
    this.#observers.clear()
    this.#disconnectListeners.clear()
    this.#reconnectListeners.clear()
    this.#disposeData()
    this.#disposeOpen()
    this.#disposeClose()
  }

  onDisconnect(listener: () => void): Unsubscribe {
    this.#disconnectListeners.add(listener)
    return () => this.#disconnectListeners.delete(listener)
  }

  onReconnect(listener: () => void): Unsubscribe {
    this.#reconnectListeners.add(listener)
    return () => this.#reconnectListeners.delete(listener)
  }

  async request<TContent = unknown>(
    path: string = LcuPaths.gameflow.session,
    method: LcuHttpMethodValue = LcuHttpMethod.GET,
    body?: unknown,
  ): Promise<LcuResult<TContent>> {
    if (!this.#client.isConnected) {
      throw new RiftClientDisconnectedError()
    }

    const id = this.#requestId
    this.#requestId += 1

    return new Promise<LcuResult<TContent>>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.#pendingRequests.delete(id)
        reject(new LcuTransportTimeoutError(path, this.#requestTimeoutMs))
      }, this.#requestTimeoutMs)

      this.#pendingRequests.set(id, { path, reject, resolve: resolve as (value: LcuResult<unknown>) => void, timeout })
      this.#client.send(JSON.stringify([MobileOpcode.REQUEST, id, path, method, normalizeBody(body)])).catch((error: unknown) => {
        this.#pendingRequests.delete(id)
        clearTimeout(timeout)
        reject(error instanceof Error ? error : new LcuTransportError('Failed to send LCU request.'))
      })
    })
  }

  async observe<TContent = unknown>(path: string, handler: (result: LcuResult<TContent>) => void | Promise<void>): Promise<Unsubscribe> {
    const pattern = pathToObservePattern(path)
    const entry = this.#observers.get(path) ?? { handlers: new Set(), pattern }
    entry.handlers.add(handler as (result: LcuResult<unknown>) => void | Promise<void>)
    this.#observers.set(path, entry)

    if (this.#client.isConnected && entry.handlers.size === 1) {
      await this.#sendSubscribe(pattern)
    }

    this.request(path)
      .then((result) => handler(result as LcuResult<TContent>))
      .catch(() => {
        // Initial snapshots are opportunistic; live updates continue once subscribed.
      })

    return () => {
      this.#unobserve(path, handler as (result: LcuResult<unknown>) => void | Promise<void>).catch(() => {
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
    this.#reconnectListeners.forEach((listener) => listener())
  }

  #handleClose(): void {
    this.#rejectPending(new RiftClientDisconnectedError())
    this.#disconnectListeners.forEach((listener) => listener())
  }

  #handleResponse(frame: MobileFrame): void {
    const [, id, status, content] = frame
    if (typeof id !== 'number') {
      return
    }

    const pending = this.#pendingRequests.get(id)
    if (!pending) {
      return
    }

    this.#pendingRequests.delete(id)
    clearTimeout(pending.timeout)

    if (typeof status !== 'number') {
      pending.reject(new LcuTransportMalformedResponseError())
      return
    }

    pending.resolve({ status, content })
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
        Promise.resolve(handler({ status, content })).catch(() => {
          // Observer failures stay isolated from transport dispatch.
        })
      })
    })
  }

  async #resubscribe(): Promise<void> {
    for (const entry of this.#observers.values()) {
      await this.#sendSubscribe(entry.pattern)
    }
  }

  async #unobserve(path: string, handler: (result: LcuResult<unknown>) => void | Promise<void>): Promise<void> {
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

export function createLCUTransport(client: RiftClient, options?: LcuTransportOptions): LcuTransport {
  return new LcuTransport(client, options)
}

export type LcuTransportClient = LcuTransport
