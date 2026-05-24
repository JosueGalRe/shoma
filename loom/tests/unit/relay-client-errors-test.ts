import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RelayClient, RelayClientState } from '@/core/relay/relay-client'
import { RelayErrorCode, RelayOpcode } from '@shoma/protocol-contract'

type MessageHandler = (event: { data: string }) => void

class MockWebSocket {
  addEventListener = vi.fn((type: string, listener: (...args: unknown[]) => void) => {
    if (type === 'message') {
      this.messageHandler = listener
    }
  })

  close = vi.fn()
  messageHandler: MessageHandler | null = null
  readyState = WebSocket.OPEN
  removeEventListener = vi.fn()
  send = vi.fn()
}

let mockWebSocket: MockWebSocket
let client: RelayClient
let stateChanges: RelayClientState[]

class MockWebSocketConstructor extends MockWebSocket {
  constructor(url: string) {
    super()
    void url
    mockWebSocket = this
  }
}

function getMessageHandler(): MessageHandler {
  if (!mockWebSocket.messageHandler) {
    throw new Error('Expected message handler to be registered.')
  }

  return mockWebSocket.messageHandler
}

describe('RelayClient Error Handling', () => {
  beforeEach(() => {
    stateChanges = []

    client = new RelayClient({
      code: '123456',
      wsBaseUrl: 'ws://localhost:51001',
      WebSocketImpl: MockWebSocketConstructor,
      onStateChange: (state) => {
        return stateChanges.push(state)
      },
    })
  })

  afterEach(() => {
    client.close()
  })

  it('should map INVALID_CODE to FAILED_INVALID_CODE', () => {
    client.connect()
    const messageHandler = getMessageHandler()

    messageHandler({ data: JSON.stringify([RelayOpcode.ERROR, { code: RelayErrorCode.INVALID_CODE }]) })

    expect(stateChanges).toContain(RelayClientState.FAILED_INVALID_CODE)
    expect(mockWebSocket.close).toHaveBeenCalled()
  })

  it('should map DESKTOP_DENIED to FAILED_DESKTOP_DENIED', () => {
    client.connect()
    const messageHandler = getMessageHandler()

    messageHandler({ data: JSON.stringify([RelayOpcode.ERROR, { code: RelayErrorCode.DESKTOP_DENIED }]) })

    expect(stateChanges).toContain(RelayClientState.FAILED_DESKTOP_DENIED)
    expect(mockWebSocket.close).toHaveBeenCalled()
  })

  it('should map RELAY_UNREACHABLE to FAILED_RELAY_UNREACHABLE', () => {
    client.connect()
    const messageHandler = getMessageHandler()

    messageHandler({ data: JSON.stringify([RelayOpcode.ERROR, { code: RelayErrorCode.RELAY_UNREACHABLE }]) })

    expect(stateChanges).toContain(RelayClientState.FAILED_RELAY_UNREACHABLE)
    expect(mockWebSocket.close).toHaveBeenCalled()
  })

  it('should map INVALID_TOKEN to FAILED_INVALID_TOKEN', () => {
    client.connect()
    const messageHandler = getMessageHandler()

    messageHandler({ data: JSON.stringify([RelayOpcode.ERROR, { code: RelayErrorCode.INVALID_TOKEN }]) })

    expect(stateChanges).toContain(RelayClientState.FAILED_INVALID_TOKEN)
    expect(mockWebSocket.close).toHaveBeenCalled()
  })

  it('should map MISSING_PUBKEY to FAILED_MISSING_PUBKEY', () => {
    client.connect()
    const messageHandler = getMessageHandler()

    messageHandler({ data: JSON.stringify([RelayOpcode.ERROR, { code: RelayErrorCode.MISSING_PUBKEY }]) })

    expect(stateChanges).toContain(RelayClientState.FAILED_MISSING_PUBKEY)
    expect(mockWebSocket.close).toHaveBeenCalled()
  })

  it('should map SESSION_EXPIRED to FAILED_SESSION_EXPIRED', () => {
    client.connect()
    const messageHandler = getMessageHandler()

    messageHandler({ data: JSON.stringify([RelayOpcode.ERROR, { code: RelayErrorCode.SESSION_EXPIRED }]) })

    expect(stateChanges).toContain(RelayClientState.FAILED_SESSION_EXPIRED)
    expect(mockWebSocket.close).toHaveBeenCalled()
  })

  it('should map MALFORMED_MESSAGE to FAILED_MALFORMED_MESSAGE', () => {
    client.connect()
    const messageHandler = getMessageHandler()

    messageHandler({ data: JSON.stringify([RelayOpcode.ERROR, { code: RelayErrorCode.MALFORMED_MESSAGE }]) })

    expect(stateChanges).toContain(RelayClientState.FAILED_MALFORMED_MESSAGE)
    expect(mockWebSocket.close).toHaveBeenCalled()
  })

  it('should map SERVER_ERROR to FAILED_SERVER_ERROR', () => {
    client.connect()
    const messageHandler = getMessageHandler()

    messageHandler({ data: JSON.stringify([RelayOpcode.ERROR, { code: RelayErrorCode.SERVER_ERROR }]) })

    expect(stateChanges).toContain(RelayClientState.FAILED_SERVER_ERROR)
    expect(mockWebSocket.close).toHaveBeenCalled()
  })

  it('should map UNKNOWN to FAILED_UNKNOWN', () => {
    client.connect()
    const messageHandler = getMessageHandler()

    messageHandler({ data: JSON.stringify([RelayOpcode.ERROR, { code: RelayErrorCode.UNKNOWN }]) })

    expect(stateChanges).toContain(RelayClientState.FAILED_UNKNOWN)
    expect(mockWebSocket.close).toHaveBeenCalled()
  })

  it('should map unrecognized error codes to FAILED_UNKNOWN', () => {
    client.connect()
    const messageHandler = getMessageHandler()

    messageHandler({ data: JSON.stringify([RelayOpcode.ERROR, { code: 'some_random_error' }]) })

    expect(stateChanges).toContain(RelayClientState.FAILED_UNKNOWN)
    expect(mockWebSocket.close).toHaveBeenCalled()
  })
})
