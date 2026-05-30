import type { RelayClientState } from '@/core/relay/relay-client'
import type { RelayStatus } from '@/core/state/relay-store'

export interface ConnectSearch {
  code?: string
}

export interface ConnectScreenProps {
  installButtonLabel?: string
  onInstallClick?: () => void
  onReconnect?: (code: string) => void
  recentSessions?: string[]
  title: string
  variant?: string
}

export type ConnectionTone = 'error' | 'connecting' | 'handshaking' | 'connected' | 'idle'

export type ConnectionErrorKey =
  | 'connection.errors.denied'
  | 'connection.errors.invalidCode'
  | 'connection.errors.invalidToken'
  | 'connection.errors.malformedMessage'
  | 'connection.errors.missingPubkey'
  | 'connection.errors.relayUnreachable'
  | 'connection.errors.serverError'
  | 'connection.errors.sessionExpired'
  | 'connection.errors.unknown'

export interface InstallVariantProps {
  label: string
  onClick: () => void
}

export interface ConnectionState {
  clientState: RelayClientState
  error: string | null
  status: RelayStatus
}
