export interface WebSocketLike {
  addEventListener(type: 'message', listener: (event: MessageEvent<string>) => void): void
  addEventListener(type: 'open' | 'close' | 'error', listener: () => void): void
  close(): void
  readyState: number
  removeEventListener(type: 'message', listener: (event: MessageEvent<string>) => void): void
  removeEventListener(type: 'open' | 'close' | 'error', listener: () => void): void
  send(data: string): void
}

export type WebSocketConstructor = new (url: string) => WebSocketLike

export type Unsubscribe = () => void

export type RelayFrame = [number, ...unknown[]]

export const RelayClientState = {
  CONNECTED: 'CONNECTED',
  CONNECTING: 'CONNECTING',
  DISCONNECTED: 'DISCONNECTED',
  FAILED_DESKTOP_DENIED: 'FAILED_DESKTOP_DENIED',
  FAILED_INVALID_CODE: 'FAILED_INVALID_CODE',
  FAILED_INVALID_TOKEN: 'FAILED_INVALID_TOKEN',
  FAILED_MALFORMED_MESSAGE: 'FAILED_MALFORMED_MESSAGE',
  FAILED_MISSING_PUBKEY: 'FAILED_MISSING_PUBKEY',
  FAILED_NO_DESKTOP: 'FAILED_NO_DESKTOP',
  FAILED_RELAY_UNREACHABLE: 'FAILED_RELAY_UNREACHABLE',
  FAILED_SERVER_ERROR: 'FAILED_SERVER_ERROR',
  FAILED_SESSION_EXPIRED: 'FAILED_SESSION_EXPIRED',
  FAILED_UNKNOWN: 'FAILED_UNKNOWN',
  HANDSHAKING: 'HANDSHAKING',
} as const

export type RelayClientState = (typeof RelayClientState)[keyof typeof RelayClientState]

export interface RelayClientOptions {
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
