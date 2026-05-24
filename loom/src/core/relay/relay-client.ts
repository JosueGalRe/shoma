import * as v from 'valibot'

import { env } from '@/core/config/env-config'
import { useSessionStore } from '@/core/state/session-store'
import { MobileOpcode, RelayOpcode } from '@shoma/protocol-contract'

const DEFAULT_RELAY_WS_BASE_URL = 'ws://localhost:51001'
const DEFAULT_CONNECT_TIMEOUT_MS = 10_000
const DEFAULT_HEARTBEAT_INTERVAL_MS = 25_000
const DEFAULT_RECONNECT_BASE_DELAY_MS = 750
const DEFAULT_RECONNECT_MAX_DELAY_MS = 15_000

type WebSocketLike = {
  addEventListener(type: 'message', listener: (event: MessageEvent<string>) => void): void
  addEventListener(type: 'open' | 'close' | 'error', listener: () => void): void
  close(): void
  readyState: number
  removeEventListener(type: 'message', listener: (event: MessageEvent<string>) => void): void
  removeEventListener(type: 'open' | 'close' | 'error', listener: () => void): void
  send(data: string): void
}
type WebSocketConstructor = new (url: string) => WebSocketLike
type Unsubscribe = () => void
type RelayFrame = [number, ...unknown[]]

export const RelayClientState = {
  CONNECTING: 'CONNECTING',
  FAILED_NO_DESKTOP: 'FAILED_NO_DESKTOP',
  FAILED_DESKTOP_DENIED: 'FAILED_DESKTOP_DENIED',
  FAILED_INVALID_CODE: 'FAILED_INVALID_CODE',
  FAILED_RELAY_UNREACHABLE: 'FAILED_RELAY_UNREACHABLE',
  FAILED_INVALID_TOKEN: 'FAILED_INVALID_TOKEN',
  FAILED_MISSING_PUBKEY: 'FAILED_MISSING_PUBKEY',
  FAILED_SESSION_EXPIRED: 'FAILED_SESSION_EXPIRED',
  FAILED_MALFORMED_MESSAGE: 'FAILED_MALFORMED_MESSAGE',
  FAILED_SERVER_ERROR: 'FAILED_SERVER_ERROR',
  FAILED_UNKNOWN: 'FAILED_UNKNOWN',
  HANDSHAKING: 'HANDSHAKING',
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
} as const

export type RelayClientState = (typeof RelayClientState)[keyof typeof RelayClientState]

export type RelayClientOptions = {
  code: string
  wsBaseUrl?: string
  WebSocketImpl?: WebSocketConstructor
  autoConnect?: boolean
  autoReconnect?: boolean
  connectTimeoutMs?: number
  heartbeatIntervalMs?: number
  reconnectBaseDelayMs?: number
  reconnectMaxDelayMs?: number
  onClose?: () => void
  onData?: (payload: string) => void
  onOpen?: () => void
  onStateChange?: (state: RelayClientState) => void
}

// @knip
export class RelayClientError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RelayClientError'
  }
}

export class RelayClientDisconnectedError extends RelayClientError {
  constructor() {
    super('Relay client is not connected.')
    this.name = 'RelayClientDisconnectedError'
  }
}

// @knip
export class RelayHandshakeError extends RelayClientError {
  constructor(message: string) {
    super(message)
    this.name = 'RelayHandshakeError'
  }
}

function resolveMobileWsBaseUrl(configured?: string): string {
  if (configured) {
    return configured
  }

  const envUrl = env.VITE_LEYLINE_WS_BASE_URL
  if (envUrl) {
    return envUrl
  }

  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    return `${protocol}://${window.location.hostname}:51001`
  }

  return DEFAULT_RELAY_WS_BASE_URL
}

function resolveWebSocketConstructor(provided?: WebSocketConstructor): WebSocketConstructor {
  if (provided) {
    return provided
  }

  if (typeof WebSocket !== 'undefined') {
    return WebSocket
  }

  throw new RelayClientError('WebSocket is not available in this runtime.')
}

const RelayFrameSchema = v.array(v.unknown())
const RelayErrorPayloadSchema = v.object({
  code: v.string(),
})

function parseFrame(raw: unknown): RelayFrame | null {
  if (typeof raw !== 'string') {
    return null
  }

  try {
    const parsed = v.safeParse(RelayFrameSchema, JSON.parse(raw))
    if (!parsed.success) {
      return null
    }

    const [opcode, ...args] = parsed.output
    return typeof opcode === 'number' ? [opcode, ...args] : null
  } catch {
    return null
  }
}

function utf8ToBuffer(value: string): ArrayBuffer {
  const bytes = new TextEncoder().encode(value)
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
}

function bufferToUtf8(buffer: ArrayBuffer): string {
  return new TextDecoder('utf-8').decode(new Uint8Array(buffer))
}

function bufferToBase64(buffer: ArrayBuffer): string {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

function base64ToBuffer(value: string): ArrayBuffer {
  const decoded = atob(value)
  const bytes = new Uint8Array(decoded.length)
  for (let index = 0; index < decoded.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index)
  }
  return bytes.buffer
}

function pemToSpkiBuffer(publicKeyPem: string): ArrayBuffer {
  const normalized = publicKeyPem
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\s+/g, '')

  return base64ToBuffer(normalized)
}

async function encryptWithPublicKeyPem(publicKeyPem: string, payload: string): Promise<string> {
  const publicKey = await window.crypto.subtle.importKey(
    'spki',
    pemToSpkiBuffer(publicKeyPem),
    { name: 'RSA-OAEP', hash: 'SHA-1' },
    false,
    ['encrypt'],
  )
  const encrypted = await window.crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, utf8ToBuffer(payload))
  return bufferToBase64(encrypted)
}

function parseEncryptedPayload(payload: string): { encrypted: string; iv: string } | null {
  const separator = payload.indexOf(':')
  if (separator <= 0 || separator === payload.length - 1) {
    return null
  }

  return {
    iv: payload.slice(0, separator),
    encrypted: payload.slice(separator + 1),
  }
}

function getDeviceDescription(): { browser: string; device: string } {
  const userAgent = navigator.userAgent
  const devices = [
    ['Windows Phone', 'Windows Phone'],
    ['Windows computer', 'Win'],
    ['iPhone', 'iPhone'],
    ['iPad', 'iPad'],
    ['Kindle device', 'Silk'],
    ['Android device', 'Android'],
    ['PlayBook', 'PlayBook'],
    ['BlackBerry', 'BlackBerry'],
    ['macOS computer', 'Mac'],
    ['Linux computer', 'Linux'],
    ['Palm device', 'Palm'],
  ] as const
  const browsers = [
    ['Edge', 'Edge'],
    ['Chrome', 'Chrome'],
    ['Firefox', 'Firefox'],
    ['Safari', 'Safari'],
    ['Internet Explorer', 'MSIE'],
    ['Opera', 'Opera'],
    ['BlackBerry', 'CLDC'],
    ['Mozilla', 'Mozilla'],
  ] as const

  return {
    browser:
      browsers.find(([, marker]) => {
        return userAgent.includes(marker)
      })?.[0] ?? 'Unknown Browser',
    device:
      devices.find(([, marker]) => {
        return userAgent.includes(marker)
      })?.[0] ?? 'Unknown Device',
  }
}

function createDeviceId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16)
    const value = character === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

function getDeviceId(): string {
  const existing = useSessionStore.getState().deviceId
  if (existing) {
    return existing
  }

  const next = createDeviceId()
  useSessionStore.getState().setDeviceId(next)
  return next
}

export class RelayClient {
  readonly #options: Required<
    Omit<RelayClientOptions, 'WebSocketImpl' | 'onClose' | 'onData' | 'onOpen' | 'onStateChange' | 'wsBaseUrl'>
  > &
    Pick<RelayClientOptions, 'onClose' | 'onData' | 'onOpen' | 'onStateChange'>
  readonly #socketConstructor: WebSocketConstructor
  readonly #url: string
  readonly #dataListeners = new Set<(payload: string) => void>()
  readonly #openListeners = new Set<() => void>()
  readonly #closeListeners = new Set<() => void>()
  readonly #stateListeners = new Set<(state: RelayClientState) => void>()

  #socket: WebSocketLike | null = null
  #state: RelayClientState = RelayClientState.DISCONNECTED
  #sharedKey: CryptoKey | null = null
  #isEncrypted = false
  #connectTimer: ReturnType<typeof setTimeout> | null = null
  #heartbeatTimer: ReturnType<typeof setInterval> | null = null
  #reconnectTimer: ReturnType<typeof setTimeout> | null = null

  constructor(options: RelayClientOptions) {
    this.#socketConstructor = resolveWebSocketConstructor(options.WebSocketImpl)
    this.#url = `${resolveMobileWsBaseUrl(options.wsBaseUrl)}/mobile`
    this.#options = {
      autoConnect: options.autoConnect ?? false,
      autoReconnect: options.autoReconnect ?? true,
      code: options.code,
      connectTimeoutMs: options.connectTimeoutMs ?? DEFAULT_CONNECT_TIMEOUT_MS,
      heartbeatIntervalMs: options.heartbeatIntervalMs ?? DEFAULT_HEARTBEAT_INTERVAL_MS,
      reconnectBaseDelayMs: options.reconnectBaseDelayMs ?? DEFAULT_RECONNECT_BASE_DELAY_MS,
      reconnectMaxDelayMs: options.reconnectMaxDelayMs ?? DEFAULT_RECONNECT_MAX_DELAY_MS,
      onClose: options.onClose,
      onData: options.onData,
      onOpen: options.onOpen,
      onStateChange: options.onStateChange,
    }

    if (this.#options.autoConnect) {
      this.connect()
    }
  }

  get state(): RelayClientState {
    return this.#state
  }

  get isConnected(): boolean {
    return this.#state === RelayClientState.CONNECTED && this.#isEncrypted && this.#socket?.readyState === WebSocket.OPEN
  }

  connect(): void {
    if (this.#socket?.readyState === WebSocket.OPEN || this.#socket?.readyState === WebSocket.CONNECTING) {
      return
    }

    this.#clearReconnectTimer()
    this.#resetHandshake()
    this.#setState(RelayClientState.CONNECTING)

    const socket = new this.#socketConstructor(this.#url)
    this.#socket = socket
    socket.addEventListener('open', this.#handleOpen)
    socket.addEventListener('message', this.#handleMessage)
    socket.addEventListener('close', this.#handleClose)
    socket.addEventListener('error', this.#handleError)
    this.#armConnectTimeout()
  }

  close(): void {
    this.#clearConnectTimer()
    this.#clearHeartbeat()
    this.#clearReconnectTimer()
    this.#resetHandshake()
    this.#detachSocket()
    this.#socket?.close()
    this.#socket = null
    this.#setState(RelayClientState.DISCONNECTED)
  }

  onData(listener: (payload: string) => void): Unsubscribe {
    this.#dataListeners.add(listener)
    return () => {
      return this.#dataListeners.delete(listener)
    }
  }

  onOpen(listener: () => void): Unsubscribe {
    this.#openListeners.add(listener)
    return () => {
      return this.#openListeners.delete(listener)
    }
  }

  onClose(listener: () => void): Unsubscribe {
    this.#closeListeners.add(listener)
    return () => {
      return this.#closeListeners.delete(listener)
    }
  }

  onStateChange(listener: (state: RelayClientState) => void): Unsubscribe {
    this.#stateListeners.add(listener)
    return () => {
      return this.#stateListeners.delete(listener)
    }
  }

  async send(payload: string): Promise<void> {
    if (!this.isConnected || !this.#sharedKey || !this.#socket) {
      throw new RelayClientDisconnectedError()
    }

    const iv = new Uint8Array(16)
    window.crypto.getRandomValues(iv)
    const encrypted = await window.crypto.subtle.encrypt({ name: 'AES-CBC', iv }, this.#sharedKey, utf8ToBuffer(payload))
    this.#socket.send(JSON.stringify([RelayOpcode.SEND, `${bufferToBase64(iv.buffer)}:${bufferToBase64(encrypted)}`]))
  }

  #setState(state: RelayClientState): void {
    if (this.#state === state) {
      return
    }

    this.#state = state
    this.#options.onStateChange?.(state)
    this.#stateListeners.forEach((listener) => {
      return listener(state)
    })
  }

  #armConnectTimeout(): void {
    this.#clearConnectTimer()
    this.#connectTimer = setTimeout(() => {
      if (this.#state !== RelayClientState.CONNECTING && this.#state !== RelayClientState.HANDSHAKING) {
        return
      }

      this.#setState(RelayClientState.FAILED_NO_DESKTOP)
      this.#socket?.close()
    }, this.#options.connectTimeoutMs)
  }

  #clearConnectTimer(): void {
    if (this.#connectTimer) {
      clearTimeout(this.#connectTimer)
      this.#connectTimer = null
    }
  }

  #clearHeartbeat(): void {
    if (this.#heartbeatTimer) {
      clearInterval(this.#heartbeatTimer)
      this.#heartbeatTimer = null
    }
  }

  #clearReconnectTimer(): void {
    if (this.#reconnectTimer) {
      clearTimeout(this.#reconnectTimer)
      this.#reconnectTimer = null
    }
  }

  #detachSocket(): void {
    this.#socket?.removeEventListener('open', this.#handleOpen)
    this.#socket?.removeEventListener('message', this.#handleMessage)
    this.#socket?.removeEventListener('close', this.#handleClose)
    this.#socket?.removeEventListener('error', this.#handleError)
  }

  #resetHandshake(): void {
    this.#sharedKey = null
    this.#isEncrypted = false
  }

  #startHeartbeat(): void {
    this.#clearHeartbeat()
    this.#heartbeatTimer = setInterval(() => {
      if (!this.isConnected) {
        return
      }

      this.send(JSON.stringify([MobileOpcode.VERSION])).catch(() => {
        this.#socket?.close()
      })
    }, this.#options.heartbeatIntervalMs)
  }

  #handleOpen = (): void => {
    this.#socket?.send(JSON.stringify([RelayOpcode.CONNECT, this.#options.code]))
  }

  #handleClose = (): void => {
    this.#setState(RelayClientState.DISCONNECTED)
  }

  #handleError = (): void => {
    if (this.#state === RelayClientState.CONNECTING || this.#state === RelayClientState.HANDSHAKING) {
      this.#setState(RelayClientState.FAILED_NO_DESKTOP)
    }
  }

  #handleMessage = (event: MessageEvent): void => {
    const frame = parseFrame(event.data)
    if (!frame) {
      return
    }

    this.#processFrame(frame).catch(() => {
      this.#setState(RelayClientState.FAILED_NO_DESKTOP)
      this.#socket?.close()
    })
  }

  async #processFrame([opcode, ...args]: RelayFrame): Promise<void> {
    if (opcode === RelayOpcode.ERROR) {
      const payload = args[0]
      const parsedPayload = v.safeParse(RelayErrorPayloadSchema, payload)
      if (!parsedPayload.success) {
        throw new RelayHandshakeError('Relay error frame was invalid.')
      }

      const { code } = parsedPayload.output

      this.#clearConnectTimer()
      this.#resetHandshake()

      switch (code) {
        case 'invalid_code':
          this.#setState(RelayClientState.FAILED_INVALID_CODE)
          break
        case 'desktop_denied':
          this.#setState(RelayClientState.FAILED_DESKTOP_DENIED)
          break
        case 'relay_unreachable':
          this.#setState(RelayClientState.FAILED_RELAY_UNREACHABLE)
          break
        case 'invalid_token':
          this.#setState(RelayClientState.FAILED_INVALID_TOKEN)
          break
        case 'missing_pubkey':
          this.#setState(RelayClientState.FAILED_MISSING_PUBKEY)
          break
        case 'session_expired':
          this.#setState(RelayClientState.FAILED_SESSION_EXPIRED)
          break
        case 'malformed_message':
          this.#setState(RelayClientState.FAILED_MALFORMED_MESSAGE)
          break
        case 'server_error':
          this.#setState(RelayClientState.FAILED_SERVER_ERROR)
          break
        default:
          this.#setState(RelayClientState.FAILED_UNKNOWN)
          break
      }
      this.#socket?.close()
      return
    }

    if (opcode === RelayOpcode.CONNECT_PUBKEY) {
      const publicKey = args[0]
      if (typeof publicKey !== 'string') {
        throw new RelayHandshakeError('Relay public key frame was invalid.')
      }

      this.#clearConnectTimer()
      this.#setState(RelayClientState.HANDSHAKING)
      await this.#sendIdentity(publicKey)
      return
    }

    if (opcode === RelayOpcode.RECEIVE) {
      await this.#handleRelayPayload(args[0])
    }
  }

  async #sendIdentity(publicKey: string): Promise<void> {
    const secret = new Uint8Array(32)
    window.crypto.getRandomValues(secret)
    this.#sharedKey = await window.crypto.subtle.importKey('raw', secret.buffer, { name: 'AES-CBC' }, false, [
      'encrypt',
      'decrypt',
    ])

    const description = getDeviceDescription()
    const identity = {
      secret: bufferToBase64(secret.buffer),
      identity: getDeviceId(),
      device: description.device,
      browser: description.browser,
    }
    const encryptedIdentity = await encryptWithPublicKeyPem(publicKey, JSON.stringify(identity))
    this.#socket?.send(JSON.stringify([RelayOpcode.SEND, [MobileOpcode.SECRET, encryptedIdentity]]))
  }

  async #handleRelayPayload(payload: unknown): Promise<void> {
    if (!this.#isEncrypted) {
      if (Array.isArray(payload) && payload[0] === MobileOpcode.SECRET_RESPONSE) {
        this.#handleSecretResponse(payload[1])
      }
      return
    }

    if (typeof payload !== 'string' || !this.#sharedKey) {
      return
    }

    const parsed = parseEncryptedPayload(payload)
    if (!parsed) {
      return
    }

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-CBC', iv: new Uint8Array(base64ToBuffer(parsed.iv)) },
      this.#sharedKey,
      base64ToBuffer(parsed.encrypted),
    )
    const text = bufferToUtf8(decrypted)
    this.#options.onData?.(text)
    this.#dataListeners.forEach((listener) => {
      return listener(text)
    })
  }

  #handleSecretResponse(value: unknown): void {
    this.#clearConnectTimer()

    if (!value) {
      this.#resetHandshake()
      this.#setState(RelayClientState.FAILED_DESKTOP_DENIED)
      this.#socket?.close()
      return
    }

    this.#isEncrypted = true
    this.#setState(RelayClientState.CONNECTED)
    this.#startHeartbeat()
    this.#options.onOpen?.()
    this.#openListeners.forEach((listener) => {
      return listener()
    })
  }
}
