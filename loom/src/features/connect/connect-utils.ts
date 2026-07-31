import { MobileOpcode } from '@shoma/protocol-contract'
import { array, safeParse, unknown } from 'valibot'

import { RelayClientState } from '@/core/relay/relay-client'

import type { ConnectionErrorKey, ConnectionState, ConnectionTone } from './connect-types'

export const CONNECT_CODE_LENGTH = 6

export function isCompleteConnectCode(code: string): boolean {
  return code.length === CONNECT_CODE_LENGTH
}

export function getConnectionTone({ clientState, error, status }: ConnectionState): ConnectionTone {
  if (error) {
    return 'error'
  }

  if (clientState === RelayClientState.CONNECTING || status === 'connecting') {
    return 'connecting'
  }

  if (clientState === RelayClientState.HANDSHAKING) {
    return 'handshaking'
  }

  if (clientState === RelayClientState.CONNECTED || status === 'connected') {
    return 'connected'
  }

  return 'idle'
}

export function getConnectionStatusMessage(state: ConnectionState, translate: (key: string) => string): string {
  if (state.error) {
    return 'Connection failed'
  }

  if (state.clientState === RelayClientState.CONNECTING || state.status === 'connecting') {
    return translate('connection.connectingToRelay')
  }

  if (state.clientState === RelayClientState.HANDSHAKING) {
    return translate('connection.securingConnection')
  }

  if (state.clientState === RelayClientState.CONNECTED || state.status === 'connected') {
    return 'Connected'
  }

  return 'Ready'
}

export function getConnectionErrorKey(clientState: RelayClientState): ConnectionErrorKey | null {
  switch (clientState) {
    case RelayClientState.FAILED_NO_DESKTOP:
    case RelayClientState.FAILED_RELAY_UNREACHABLE: {
      return 'connection.errors.relayUnreachable'
    }
    case RelayClientState.FAILED_DESKTOP_DENIED: {
      return 'connection.errors.denied'
    }
    case RelayClientState.FAILED_INVALID_CODE: {
      return 'connection.errors.invalidCode'
    }
    case RelayClientState.FAILED_INVALID_TOKEN: {
      return 'connection.errors.invalidToken'
    }
    case RelayClientState.FAILED_MISSING_PUBKEY: {
      return 'connection.errors.missingPubkey'
    }
    case RelayClientState.FAILED_SESSION_EXPIRED: {
      return 'connection.errors.sessionExpired'
    }
    case RelayClientState.FAILED_MALFORMED_MESSAGE: {
      return 'connection.errors.malformedMessage'
    }
    case RelayClientState.FAILED_SERVER_ERROR: {
      return 'connection.errors.serverError'
    }
    case RelayClientState.FAILED_UNKNOWN: {
      return 'connection.errors.unknown'
    }
    default: {
      return null
    }
  }
}

const MobileFrameSchema = array(unknown())

export function readDeviceNameFrame(payload: string): string | null {
  try {
    const parsed = safeParse(MobileFrameSchema, JSON.parse(payload))

    if (!parsed.success) {
      return null
    }

    const [opcode, , deviceName] = parsed.output

    if (opcode !== MobileOpcode.VERSION_RESPONSE || typeof deviceName !== 'string') {
      return null
    }

    const trimmedName = deviceName.trim()

    return trimmedName.length > 0 ? trimmedName : null
  } catch {
    return null
  }
}
