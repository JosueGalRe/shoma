import { env } from '@/core/config/env-config'

import { RelayClientError } from './relay-client-errors'

import type { WebSocketConstructor } from './relay-client-types'

const DEFAULT_RELAY_WS_BASE_URL = 'ws://localhost:51001'

export function resolveMobileWsBaseUrl(configured?: string): string {
  if (configured) {
    return configured
  }

  const envUrl = env.VITE_LEYLINE_WS_BASE_URL

  if (envUrl) {
    return envUrl
  }

  if (typeof globalThis !== 'undefined' && globalThis.location.hostname !== 'localhost') {
    const protocol = globalThis.location.protocol === 'https:' ? 'wss' : 'ws'

    return `${protocol}://${globalThis.location.hostname}:51001`
  }

  return DEFAULT_RELAY_WS_BASE_URL
}

export function resolveWebSocketConstructor(provided?: WebSocketConstructor): WebSocketConstructor {
  if (provided) {
    return provided
  }

  if (typeof WebSocket !== 'undefined') {
    return WebSocket
  }

  throw new RelayClientError('WebSocket is not available in this runtime.')
}
