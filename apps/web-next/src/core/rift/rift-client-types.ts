export const RiftClientState = {
  CONNECTING: 'CONNECTING',
  FAILED_NO_DESKTOP: 'FAILED_NO_DESKTOP',
  FAILED_DESKTOP_DENY: 'FAILED_DESKTOP_DENY',
  HANDSHAKING: 'HANDSHAKING',
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
} as const

export type RiftClientState = (typeof RiftClientState)[keyof typeof RiftClientState]

export type RiftClientCallbacks = {
  onStateChange?: (state: RiftClientState) => void
  onOpen?: () => void
  onClose?: () => void
  onData?: (payload: string) => void
}

export type RiftClientOptions = RiftClientCallbacks & {
  code: string
  wsBaseUrl?: string
}
