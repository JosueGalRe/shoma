import { LcuHttpMethod, LcuPaths, MobileOpcode, type LcuHttpMethodValue, type LcuResult } from '@mimic/protocol-contract'

const DEFAULT_WS_URL = 'ws://localhost:51001/mobile'
const DEFAULT_REQUEST_TIMEOUT_MS = 10_000
const DEFAULT_RECONNECT_BASE_DELAY_MS = 1_000
const DEFAULT_MAX_RECONNECT_ATTEMPTS = 5

type WebSocketConstructor = new (url: string) => WebSocket
type Unsubscribe = () => void

type PendingRequest<TContent = unknown> = {
  resolve: (value: LcuResult<TContent>) => void
  reject: (error: Error) => void
  timeout: ReturnType<typeof setTimeout>
}

type Observer<TContent = unknown> = {
  path: string
  pattern: string
  handler: (data: TContent) => void | Promise<void>
}

type LcuTransportOptions = {
  url?: string
  WebSocketImpl?: WebSocketConstructor
  requestTimeoutMs?: number
  reconnectBaseDelayMs?: number
  maxReconnectAttempts?: number
  connectOnCreate?: boolean
}

export class LcuTransportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LcuTransportError'
  }
}

export class LcuTransportDisconnectedError extends LcuTransportError {
  constructor() {
    super('LCU transport is disconnected.')
    this.name = 'LcuTransportDisconnectedError'
  }
}

export class LcuTransportTimeoutError extends LcuTransportError {
  constructor(path: string, timeoutMs: number = DEFAULT_REQUEST_TIMEOUT_MS) {
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

function resolveWebSocketConstructor(provided?: WebSocketConstructor): WebSocketConstructor {
  if (provided) {
    return provided
  }

  if (typeof WebSocket !== 'undefined') {
    return WebSocket
  }

  throw new LcuTransportError('WebSocket is not available in this runtime.')
}

function buildObservePattern(path: string): string {
  return `^${path}$`
}

function parseFrame(data: unknown): [number, ...unknown[]] | null {
  const raw = typeof data === 'string' ? data : String(data)

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  if (!Array.isArray(parsed) || typeof parsed[0] !== 'number') {
    return null
  }

  return parsed as [number, ...unknown[]]
}

function matchesPattern(pattern: string, path: string): boolean {
  try {
    return new RegExp(pattern).test(path)
  } catch {
    return false
  }
}

function normalizeBody(body: unknown): unknown {
  if (body === undefined || typeof body === 'string') {
    return body
  }

  return JSON.stringify(body)
}

function isOpen(socket: WebSocket | null): boolean {
  return socket?.readyState === WebSocket.OPEN
}

export function createLCUClient(options: LcuTransportOptions = {}) {
  const WebSocketImpl = resolveWebSocketConstructor(options.WebSocketImpl)
  const url = options.url ?? DEFAULT_WS_URL
  const requestTimeoutMs = options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS
  const reconnectBaseDelayMs = options.reconnectBaseDelayMs ?? DEFAULT_RECONNECT_BASE_DELAY_MS
  const maxReconnectAttempts = options.maxReconnectAttempts ?? DEFAULT_MAX_RECONNECT_ATTEMPTS

  let socket: WebSocket | null = null
  let closedByClient = false
  let reconnectAttempts = 0
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let requestId = 0

  const pendingRequests = new Map<number, PendingRequest>()
  const observers = new Map<string, Observer>()
  const disconnectCallbacks = new Set<() => void>()
  const reconnectCallbacks = new Set<() => void>()

  function clearReconnectTimer(): void {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  function rejectPending(error: Error): void {
    pendingRequests.forEach((pending) => {
      clearTimeout(pending.timeout)
      pending.reject(error)
    })
    pendingRequests.clear()
  }

  function sendFrame(frame: unknown[]): void {
    const currentSocket = socket
    if (currentSocket === null || currentSocket.readyState !== WebSocket.OPEN) {
      throw new LcuTransportDisconnectedError()
    }

    currentSocket.send(JSON.stringify(frame))
  }

  function resubscribeObservers(): void {
    observers.forEach((observer) => {
      sendFrame([MobileOpcode.SUBSCRIBE, observer.pattern])
    })
  }

  function scheduleReconnect(): void {
    if (closedByClient || reconnectTimer || reconnectAttempts >= maxReconnectAttempts) {
      return
    }

    const delay = reconnectBaseDelayMs * 2 ** reconnectAttempts
    reconnectAttempts += 1
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      connect()
    }, delay)
  }

  function handleResponse(frame: [number, ...unknown[]]): void {
    const [, id, status, content] = frame
    if (typeof id !== 'number') {
      throw new LcuTransportMalformedResponseError()
    }

    const pending = pendingRequests.get(id)
    if (!pending) {
      return
    }

    if (typeof status !== 'number') {
      pendingRequests.delete(id)
      clearTimeout(pending.timeout)
      pending.reject(new LcuTransportMalformedResponseError())
      return
    }

    pendingRequests.delete(id)
    clearTimeout(pending.timeout)
    pending.resolve({ status, content })
  }

  function handleUpdate(frame: [number, ...unknown[]]): void {
    const [, path, , content] = frame
    if (typeof path !== 'string') {
      return
    }

    observers.forEach((observer) => {
      if (!matchesPattern(observer.pattern, path)) {
        return
      }

      Promise.resolve(observer.handler(content)).catch(() => {
        // Observer failures are isolated so one subscriber cannot break transport dispatch.
      })
    })
  }

  function handleMessage(event: MessageEvent): void {
    const frame = parseFrame(event.data)
    if (!frame) {
      return
    }

    if (frame[0] === MobileOpcode.RESPONSE) {
      handleResponse(frame)
      return
    }

    if (frame[0] === MobileOpcode.UPDATE) {
      handleUpdate(frame)
    }
  }

  function handleOpen(): void {
    const wasReconnect = reconnectAttempts > 0
    reconnectAttempts = 0

    if (observers.size > 0) {
      resubscribeObservers()
    }

    if (wasReconnect) {
      reconnectCallbacks.forEach((callback) => callback())
    }
  }

  function handleDisconnect(): void {
    if (!closedByClient) {
      disconnectCallbacks.forEach((callback) => callback())
      rejectPending(new LcuTransportDisconnectedError())
      scheduleReconnect()
    }
  }

  function connect(): void {
    clearReconnectTimer()
    socket = new WebSocketImpl(url)
    socket.addEventListener('open', handleOpen)
    socket.addEventListener('message', handleMessage)
    socket.addEventListener('close', handleDisconnect)
    socket.addEventListener('error', handleDisconnect)
  }

  function close(): void {
    closedByClient = true
    clearReconnectTimer()
    rejectPending(new LcuTransportDisconnectedError())
    socket?.close()
    socket = null
  }

  function onDisconnect(callback: () => void): Unsubscribe {
    disconnectCallbacks.add(callback)
    return () => disconnectCallbacks.delete(callback)
  }

  function onReconnect(callback: () => void): Unsubscribe {
    reconnectCallbacks.add(callback)
    return () => reconnectCallbacks.delete(callback)
  }

  function observe<TContent = unknown>(path: string, handler: (data: TContent) => void | Promise<void>): Unsubscribe {
    const pattern = buildObservePattern(path)
    observers.set(path, { path, pattern, handler: handler as (data: unknown) => void | Promise<void> })

    if (isOpen(socket)) {
      sendFrame([MobileOpcode.SUBSCRIBE, pattern])
    }

    return () => {
      observers.delete(path)
      if (isOpen(socket)) {
        sendFrame([MobileOpcode.UNSUBSCRIBE, pattern])
      }
    }
  }

  function request<TContent = unknown>(
    path: string = LcuPaths.gameflow.session,
    method: LcuHttpMethodValue | string = LcuHttpMethod.GET,
    body?: unknown,
  ): Promise<LcuResult<TContent>> {
    if (!isOpen(socket)) {
      return Promise.reject(new LcuTransportDisconnectedError())
    }

    const id = requestId
    requestId += 1

    return new Promise<LcuResult<TContent>>((resolve, reject) => {
      const timeout = setTimeout(() => {
        pendingRequests.delete(id)
        reject(new LcuTransportTimeoutError(path, requestTimeoutMs))
      }, requestTimeoutMs)

      pendingRequests.set(id, { resolve, reject, timeout } as PendingRequest)

      try {
        sendFrame([MobileOpcode.REQUEST, id, path, method, normalizeBody(body)])
      } catch (error) {
        pendingRequests.delete(id)
        clearTimeout(timeout)
        reject(error instanceof Error ? error : new LcuTransportError('Failed to send LCU request.'))
      }
    })
  }

  if (options.connectOnCreate !== false) {
    connect()
  }

  return {
    close,
    connect,
    observe,
    onDisconnect,
    onReconnect,
    request,
  }
}

export type LcuTransportClient = ReturnType<typeof createLCUClient>
