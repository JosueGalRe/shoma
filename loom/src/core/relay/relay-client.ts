import { MobileOpcode, RelayOpcode } from '@shoma/protocol-contract'
import { safeParse } from 'valibot'

import { RelayClientDisconnectedError, RelayHandshakeError } from './relay-client-errors'
import { RelayClientState } from './relay-client-types'
import { resolveMobileWsBaseUrl, resolveWebSocketConstructor } from './relay-connection-utils'
import {
  base64ToBuffer,
  bufferToBase64,
  bufferToUtf8,
  encryptWithPublicKeyPem,
  parseEncryptedPayload,
  utf8ToBuffer,
} from './relay-crypto-utils'
import { getDeviceDescription, getDeviceId } from './relay-device-utils'
import { parseFrame, RelayErrorPayloadSchema } from './relay-frame-utils'

import type { RelayClientOptions, RelayFrame, Unsubscribe, WebSocketConstructor, WebSocketLike } from './relay-client-types'

const DEFAULT_CONNECT_TIMEOUT_MS = 10_000
const DEFAULT_HEARTBEAT_INTERVAL_MS = 25_000
const DEFAULT_RECONNECT_BASE_DELAY_MS = 750
const DEFAULT_RECONNECT_MAX_DELAY_MS = 15_000

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
      onClose: options.onClose,
      onData: options.onData,
      onOpen: options.onOpen,
      onStateChange: options.onStateChange,
      reconnectBaseDelayMs: options.reconnectBaseDelayMs ?? DEFAULT_RECONNECT_BASE_DELAY_MS,
      reconnectMaxDelayMs: options.reconnectMaxDelayMs ?? DEFAULT_RECONNECT_MAX_DELAY_MS,
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

    globalThis.crypto.getRandomValues(iv)

    const encrypted = await globalThis.crypto.subtle.encrypt({ iv, name: 'AES-CBC' }, this.#sharedKey, utf8ToBuffer(payload))

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

  readonly #handleOpen = (): void => {
    this.#socket?.send(JSON.stringify([RelayOpcode.CONNECT, this.#options.code]))
  }

  readonly #handleClose = (): void => {
    this.#setState(RelayClientState.DISCONNECTED)
  }

  readonly #handleError = (): void => {
    if (this.#state === RelayClientState.CONNECTING || this.#state === RelayClientState.HANDSHAKING) {
      this.#setState(RelayClientState.FAILED_NO_DESKTOP)
    }
  }

  readonly #handleMessage = (event: MessageEvent): void => {
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
      const [payload] = args
      const parsedPayload = safeParse(RelayErrorPayloadSchema, payload)

      if (!parsedPayload.success) {
        throw new RelayHandshakeError('Relay error frame was invalid.')
      }

      const { code } = parsedPayload.output

      this.#clearConnectTimer()
      this.#resetHandshake()

      switch (code) {
        case 'invalid_code': {
          this.#setState(RelayClientState.FAILED_INVALID_CODE)
          break
        }
        case 'desktop_denied': {
          this.#setState(RelayClientState.FAILED_DESKTOP_DENIED)
          break
        }
        case 'relay_unreachable': {
          this.#setState(RelayClientState.FAILED_RELAY_UNREACHABLE)
          break
        }
        case 'invalid_token': {
          this.#setState(RelayClientState.FAILED_INVALID_TOKEN)
          break
        }
        case 'missing_pubkey': {
          this.#setState(RelayClientState.FAILED_MISSING_PUBKEY)
          break
        }
        case 'session_expired': {
          this.#setState(RelayClientState.FAILED_SESSION_EXPIRED)
          break
        }
        case 'malformed_message': {
          this.#setState(RelayClientState.FAILED_MALFORMED_MESSAGE)
          break
        }
        case 'server_error': {
          this.#setState(RelayClientState.FAILED_SERVER_ERROR)
          break
        }
        default: {
          this.#setState(RelayClientState.FAILED_UNKNOWN)
          break
        }
      }

      this.#socket?.close()

      return
    }

    if (opcode === RelayOpcode.CONNECT_PUBKEY) {
      const [publicKey] = args

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

    globalThis.crypto.getRandomValues(secret)

    this.#sharedKey = await globalThis.crypto.subtle.importKey('raw', secret.buffer, { name: 'AES-CBC' }, false, [
      'encrypt',
      'decrypt',
    ])

    const description = getDeviceDescription()
    const identity = {
      browser: description.browser,
      device: description.device,
      identity: getDeviceId(),
      secret: bufferToBase64(secret.buffer),
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

    const decrypted = await globalThis.crypto.subtle.decrypt(
      { iv: new Uint8Array(base64ToBuffer(parsed.iv)), name: 'AES-CBC' },
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

export { RelayClientDisconnectedError, RelayClientError } from './relay-client-errors'
export { RelayClientState } from './relay-client-types'
export type { RelayClientOptions } from './relay-client-types'
