import type { RelayClientState } from '@/core/relay/relay-client'
import type { RelayStatus } from '@/core/state/relay-store'

export type ConnectSearch = {
  code?: string
}

export type ConnectScreenProps = {
  installButtonLabel?: string
  onInstallClick?: () => void
  title: string
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

export type ConnectionState = {
  clientState: RelayClientState
  error: string | null
  status: RelayStatus
}
