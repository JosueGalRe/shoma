import * as v from 'valibot'
import { MobileOpcode, RiftOpcode } from '@mimic/protocol-contract'

const DEFAULT_RIFT_WS_BASE_URL = 'ws://localhost:51001'
const DEFAULT_CONNECT_TIMEOUT_MS = 10_000
const DEFAULT_HEARTBEAT_INTERVAL_MS = 25_000
const DEFAULT_RECONNECT_BASE_DELAY_MS = 750
const DEFAULT_RECONNECT_MAX_DELAY_MS = 15_000

type WebSocketConstructor = new (url: string) => WebSocket
type Unsubscribe = () => void
type RiftFrame = [number, ...unknown[]]

export const RiftClientState = {
  CONNECTING: 'CONNECTING',
  FAILED_NO_DESKTOP: 'FAILED_NO_DESKTOP',
  FAILED_DESKTOP_DENY: 'FAILED_DESKTOP_DENY',
  HANDSHAKING: 'HANDSHAKING',
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
} as const

export type RiftClientState = (typeof RiftClientState)[keyof typeof RiftClientState]

export type RiftClientOptions = {
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
  onStateChange?: (state: RiftClientState) => void
}

export class RiftClientError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RiftClientError'
  }
}

export class RiftClientDisconnectedError extends RiftClientError {
  constructor() {
    super('Rift client is not connected.')
    this.name = 'RiftClientDisconnectedError'
  }
}

export class RiftHandshakeError extends RiftClientError {
  constructor(message: string) {
    super(message)
    this.name = 'RiftHandshakeError'
  }
}

function resolveMobileWsBaseUrl(configured?: string): string {
  if (configured) {
    return configured
  }

  const envUrl = import.meta.env.VITE_RIFT_WS_BASE_URL
  if (envUrl) {
    return envUrl
  }

  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return `ws://${window.location.hostname}:51001`
  }

  return DEFAULT_RIFT_WS_BASE_URL
}

function resolveWebSocketConstructor(provided?: WebSocketConstructor): WebSocketConstructor {
  if (provided) {
    return provided
  }

  if (typeof WebSocket !== 'undefined') {
    return WebSocket
  }

  throw new RiftClientError('WebSocket is not available in this runtime.')
}

const RiftFrameSchema = v.array(v.unknown())

function parseFrame(raw: unknown): RiftFrame | null {
  if (typeof raw !== 'string') {
    return null
  }

  try {
    const parsed = v.safeParse(RiftFrameSchema, JSON.parse(raw))
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
    browser: browsers.find(([, marker]) => userAgent.includes(marker))?.[0] ?? 'Unknown Browser',
    device: devices.find(([, marker]) => userAgent.includes(marker))?.[0] ?? 'Unknown Device',
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
  if (typeof window === 'undefined' || !window.localStorage) {
    return createDeviceId()
  }

  const existing = window.localStorage.getItem('deviceID')
  if (existing) {
    return existing
  }

  const next = createDeviceId()
  window.localStorage.setItem('deviceID', next)
  return next
}

export class RiftClient {
  readonly #options: Required<Omit<RiftClientOptions, 'WebSocketImpl' | 'onClose' | 'onData' | 'onOpen' | 'onStateChange' | 'wsBaseUrl'>> &
    Pick<RiftClientOptions, 'onClose' | 'onData' | 'onOpen' | 'onStateChange'>
  readonly #socketConstructor: WebSocketConstructor
  readonly #url: string
  readonly #dataListeners = new Set<(payload: string) => void>()
  readonly #openListeners = new Set<() => void>()
  readonly #closeListeners = new Set<() => void>()
  readonly #stateListeners = new Set<(state: RiftClientState) => void>()

  #socket: WebSocket | null = null
  #state: RiftClientState = RiftClientState.DISCONNECTED
  #sharedKey: CryptoKey | null = null
  #isEncrypted = false
  #closedByClient = false
  #reconnectAttempt = 0
  #connectTimer: ReturnType<typeof setTimeout> | null = null
  #heartbeatTimer: ReturnType<typeof setInterval> | null = null
  #reconnectTimer: ReturnType<typeof setTimeout> | null = null

  constructor(options: RiftClientOptions) {
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

  get state(): RiftClientState {
    return this.#state
  }

  get isConnected(): boolean {
    return this.#state === RiftClientState.CONNECTED && this.#isEncrypted && this.#socket?.readyState === WebSocket.OPEN
  }

  connect(): void {
    if (this.#socket?.readyState === WebSocket.OPEN || this.#socket?.readyState === WebSocket.CONNECTING) {
      return
    }

    this.#closedByClient = false
    this.#clearReconnectTimer()
    this.#resetHandshake()
    this.#setState(RiftClientState.CONNECTING)

    const socket = new this.#socketConstructor(this.#url)
    this.#socket = socket
    socket.addEventListener('open', this.#handleOpen)
    socket.addEventListener('message', this.#handleMessage)
    socket.addEventListener('close', this.#handleClose)
    socket.addEventListener('error', this.#handleError)
    this.#armConnectTimeout()
  }

  close(): void {
    this.#closedByClient = true
    this.#clearConnectTimer()
    this.#clearHeartbeat()
    this.#clearReconnectTimer()
    this.#resetHandshake()
    this.#detachSocket()
    this.#socket?.close()
    this.#socket = null
    this.#setState(RiftClientState.DISCONNECTED)
  }

  onData(listener: (payload: string) => void): Unsubscribe {
    this.#dataListeners.add(listener)
    return () => this.#dataListeners.delete(listener)
  }

  onOpen(listener: () => void): Unsubscribe {
    this.#openListeners.add(listener)
    return () => this.#openListeners.delete(listener)
  }

  onClose(listener: () => void): Unsubscribe {
    this.#closeListeners.add(listener)
    return () => this.#closeListeners.delete(listener)
  }

  onStateChange(listener: (state: RiftClientState) => void): Unsubscribe {
    this.#stateListeners.add(listener)
    return () => this.#stateListeners.delete(listener)
  }

  async send(payload: string): Promise<void> {
    if (!this.isConnected || !this.#sharedKey || !this.#socket) {
      throw new RiftClientDisconnectedError()
    }

    const iv = new Uint8Array(16)
    window.crypto.getRandomValues(iv)
    const encrypted = await window.crypto.subtle.encrypt({ name: 'AES-CBC', iv }, this.#sharedKey, utf8ToBuffer(payload))
    this.#socket.send(JSON.stringify([RiftOpcode.SEND, `${bufferToBase64(iv.buffer)}:${bufferToBase64(encrypted)}`]))
  }

  #setState(state: RiftClientState): void {
    if (this.#state === state) {
      return
    }

    this.#state = state
    this.#options.onStateChange?.(state)
    this.#stateListeners.forEach((listener) => listener(state))
  }

  #armConnectTimeout(): void {
    this.#clearConnectTimer()
    this.#connectTimer = setTimeout(() => {
      if (this.#state !== RiftClientState.CONNECTING && this.#state !== RiftClientState.HANDSHAKING) {
        return
      }

      this.#setState(RiftClientState.FAILED_NO_DESKTOP)
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

  #scheduleReconnect(): void {
    if (this.#closedByClient || !this.#options.autoReconnect || this.#reconnectTimer) {
      return
    }

    const delay = Math.min(
      this.#options.reconnectMaxDelayMs,
      this.#options.reconnectBaseDelayMs * 2 ** this.#reconnectAttempt,
    )
    this.#reconnectAttempt += 1
    this.#reconnectTimer = setTimeout(() => {
      this.#reconnectTimer = null
      this.connect()
    }, delay)
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
    this.#socket?.send(JSON.stringify([RiftOpcode.CONNECT, this.#options.code]))
  }

  #handleClose = (): void => {
    this.#clearConnectTimer()
    this.#clearHeartbeat()
    this.#detachSocket()
    this.#socket = null
    this.#resetHandshake()
    this.#setState(RiftClientState.DISCONNECTED)
    this.#options.onClose?.()
    this.#closeListeners.forEach((listener) => listener())
    this.#scheduleReconnect()
  }

  #handleError = (): void => {
    if (this.#state === RiftClientState.CONNECTING || this.#state === RiftClientState.HANDSHAKING) {
      this.#setState(RiftClientState.FAILED_NO_DESKTOP)
    }
  }

  #handleMessage = (event: MessageEvent): void => {
    const frame = parseFrame(event.data)
    if (!frame) {
      return
    }

    this.#processFrame(frame).catch(() => {
      this.#setState(RiftClientState.FAILED_NO_DESKTOP)
      this.#socket?.close()
    })
  }

  async #processFrame([opcode, ...args]: RiftFrame): Promise<void> {
    if (opcode === RiftOpcode.CONNECT_PUBKEY) {
      const publicKey = args[0]
      if (typeof publicKey !== 'string') {
        throw new RiftHandshakeError('Rift public key frame was invalid.')
      }

      this.#clearConnectTimer()
      this.#setState(RiftClientState.HANDSHAKING)
      await this.#sendIdentity(publicKey)
      return
    }

    if (opcode === RiftOpcode.RECEIVE) {
      await this.#handleRelayPayload(args[0])
    }
  }

  async #sendIdentity(publicKey: string): Promise<void> {
    const secret = new Uint8Array(32)
    window.crypto.getRandomValues(secret)
    this.#sharedKey = await window.crypto.subtle.importKey('raw', secret.buffer, { name: 'AES-CBC' }, false, ['encrypt', 'decrypt'])

    const description = getDeviceDescription()
    const identity = {
      secret: bufferToBase64(secret.buffer),
      identity: getDeviceId(),
      device: description.device,
      browser: description.browser,
    }
    const encryptedIdentity = await encryptWithPublicKeyPem(publicKey, JSON.stringify(identity))
    this.#socket?.send(JSON.stringify([RiftOpcode.SEND, [MobileOpcode.SECRET, encryptedIdentity]]))
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
    this.#dataListeners.forEach((listener) => listener(text))
  }

  #handleSecretResponse(value: unknown): void {
    this.#clearConnectTimer()

    if (!value) {
      this.#resetHandshake()
      this.#closedByClient = true
      this.#setState(RiftClientState.FAILED_DESKTOP_DENY)
      this.#socket?.close()
      return
    }

    this.#isEncrypted = true
    this.#reconnectAttempt = 0
    this.#setState(RiftClientState.CONNECTED)
    this.#startHeartbeat()
    this.#options.onOpen?.()
    this.#openListeners.forEach((listener) => listener())
  }
}
