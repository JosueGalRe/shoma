import { describe, expect, test } from 'vitest'

import { RelayClientState } from '@/core/relay/relay-client'

import {
  CONNECT_CODE_LENGTH,
  getConnectionErrorKey,
  getConnectionStatusMessage,
  getConnectionTone,
  isCompleteConnectCode,
} from './connect-utils'

describe('connect utils', () => {
  test('treats only six-character codes as complete', () => {
    expect(isCompleteConnectCode('12345')).toBe(false)
    expect(isCompleteConnectCode('123456')).toBe(true)
    expect(CONNECT_CODE_LENGTH).toBe(6)
  })

  test('derives connection tone from error, client state, and relay status', () => {
    expect(getConnectionTone({ clientState: RelayClientState.CONNECTED, error: 'boom', status: 'connected' })).toBe('error')
    expect(getConnectionTone({ clientState: RelayClientState.CONNECTING, error: null, status: 'idle' })).toBe('connecting')
    expect(getConnectionTone({ clientState: RelayClientState.HANDSHAKING, error: null, status: 'idle' })).toBe('handshaking')
    expect(getConnectionTone({ clientState: RelayClientState.DISCONNECTED, error: null, status: 'connected' })).toBe(
      'connected',
    )
    expect(getConnectionTone({ clientState: RelayClientState.DISCONNECTED, error: null, status: 'idle' })).toBe('idle')
  })

  test('derives the connection status message with translation fallbacks', () => {
    const translate = (key: string) => {
      return `translated:${key}`
    }

    expect(
      getConnectionStatusMessage({ clientState: RelayClientState.CONNECTED, error: null, status: 'connected' }, translate),
    ).toBe('Connected')
    expect(
      getConnectionStatusMessage({ clientState: RelayClientState.CONNECTING, error: null, status: 'idle' }, translate),
    ).toBe('translated:connection.connectingToRelay')
    expect(
      getConnectionStatusMessage({ clientState: RelayClientState.HANDSHAKING, error: null, status: 'idle' }, translate),
    ).toBe('translated:connection.securingConnection')
    expect(
      getConnectionStatusMessage({ clientState: RelayClientState.DISCONNECTED, error: null, status: 'idle' }, translate),
    ).toBe('Ready')
    expect(
      getConnectionStatusMessage({ clientState: RelayClientState.DISCONNECTED, error: 'boom', status: 'idle' }, translate),
    ).toBe('Connection failed')
  })

  test.each([
    [RelayClientState.FAILED_NO_DESKTOP, 'connection.errors.relayUnreachable'],
    [RelayClientState.FAILED_RELAY_UNREACHABLE, 'connection.errors.relayUnreachable'],
    [RelayClientState.FAILED_DESKTOP_DENIED, 'connection.errors.denied'],
    [RelayClientState.FAILED_INVALID_CODE, 'connection.errors.invalidCode'],
    [RelayClientState.FAILED_INVALID_TOKEN, 'connection.errors.invalidToken'],
    [RelayClientState.FAILED_MISSING_PUBKEY, 'connection.errors.missingPubkey'],
    [RelayClientState.FAILED_SESSION_EXPIRED, 'connection.errors.sessionExpired'],
    [RelayClientState.FAILED_MALFORMED_MESSAGE, 'connection.errors.malformedMessage'],
    [RelayClientState.FAILED_SERVER_ERROR, 'connection.errors.serverError'],
    [RelayClientState.FAILED_UNKNOWN, 'connection.errors.unknown'],
    [RelayClientState.CONNECTED, null],
  ])('maps %s to %s', (clientState, expected) => {
    expect(getConnectionErrorKey(clientState)).toBe(expected)
  })
})
