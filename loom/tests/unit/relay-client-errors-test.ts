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

let client: RelayClient
let stateChanges: RelayClientState[]

class MockWebSocketConstructor extends MockWebSocket {
  static instance: MockWebSocketConstructor | null = null

  constructor(url: string) {
    super()
    void url
    MockWebSocketConstructor.instance = this
  }
}

function getMessageHandler(): MessageHandler {
  const instance = MockWebSocketConstructor.instance

  if (!instance?.messageHandler) {
    throw new Error('Expected message handler to be registered.')
  }

  return instance.messageHandler
}

function getMockWebSocket(): MockWebSocketConstructor {
  const instance = MockWebSocketConstructor.instance

  if (!instance) {
    throw new Error('Expected websocket instance to be registered.')
  }

  return instance
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
    MockWebSocketConstructor.instance = null
  })

  it('should map INVALID_CODE to FAILED_INVALID_CODE', () => {
    client.connect()
    const messageHandler = getMessageHandler()

    messageHandler({ data: JSON.stringify([RelayOpcode.ERROR, { code: RelayErrorCode.INVALID_CODE }]) })

    expect(stateChanges).toContain(RelayClientState.FAILED_INVALID_CODE)
    expect(getMockWebSocket().close).toHaveBeenCalled()
  })

  it('should map DESKTOP_DENIED to FAILED_DESKTOP_DENIED', () => {
    client.connect()
    const messageHandler = getMessageHandler()

    messageHandler({ data: JSON.stringify([RelayOpcode.ERROR, { code: RelayErrorCode.DESKTOP_DENIED }]) })

    expect(stateChanges).toContain(RelayClientState.FAILED_DESKTOP_DENIED)
    expect(getMockWebSocket().close).toHaveBeenCalled()
  })

  it('should map RELAY_UNREACHABLE to FAILED_RELAY_UNREACHABLE', () => {
    client.connect()
    const messageHandler = getMessageHandler()

    messageHandler({ data: JSON.stringify([RelayOpcode.ERROR, { code: RelayErrorCode.RELAY_UNREACHABLE }]) })

    expect(stateChanges).toContain(RelayClientState.FAILED_RELAY_UNREACHABLE)
    expect(getMockWebSocket().close).toHaveBeenCalled()
  })

  it('should map INVALID_TOKEN to FAILED_INVALID_TOKEN', () => {
    client.connect()
    const messageHandler = getMessageHandler()

    messageHandler({ data: JSON.stringify([RelayOpcode.ERROR, { code: RelayErrorCode.INVALID_TOKEN }]) })

    expect(stateChanges).toContain(RelayClientState.FAILED_INVALID_TOKEN)
    expect(getMockWebSocket().close).toHaveBeenCalled()
  })

  it('should map MISSING_PUBKEY to FAILED_MISSING_PUBKEY', () => {
    client.connect()
    const messageHandler = getMessageHandler()

    messageHandler({ data: JSON.stringify([RelayOpcode.ERROR, { code: RelayErrorCode.MISSING_PUBKEY }]) })

    expect(stateChanges).toContain(RelayClientState.FAILED_MISSING_PUBKEY)
    expect(getMockWebSocket().close).toHaveBeenCalled()
  })

  it('should map SESSION_EXPIRED to FAILED_SESSION_EXPIRED', () => {
    client.connect()
    const messageHandler = getMessageHandler()

    messageHandler({ data: JSON.stringify([RelayOpcode.ERROR, { code: RelayErrorCode.SESSION_EXPIRED }]) })

    expect(stateChanges).toContain(RelayClientState.FAILED_SESSION_EXPIRED)
    expect(getMockWebSocket().close).toHaveBeenCalled()
  })

  it('should map MALFORMED_MESSAGE to FAILED_MALFORMED_MESSAGE', () => {
    client.connect()
    const messageHandler = getMessageHandler()

    messageHandler({ data: JSON.stringify([RelayOpcode.ERROR, { code: RelayErrorCode.MALFORMED_MESSAGE }]) })

    expect(stateChanges).toContain(RelayClientState.FAILED_MALFORMED_MESSAGE)
    expect(getMockWebSocket().close).toHaveBeenCalled()
  })

  it('should map SERVER_ERROR to FAILED_SERVER_ERROR', () => {
    client.connect()
    const messageHandler = getMessageHandler()

    messageHandler({ data: JSON.stringify([RelayOpcode.ERROR, { code: RelayErrorCode.SERVER_ERROR }]) })

    expect(stateChanges).toContain(RelayClientState.FAILED_SERVER_ERROR)
    expect(getMockWebSocket().close).toHaveBeenCalled()
  })

  it('should map UNKNOWN to FAILED_UNKNOWN', () => {
    client.connect()
    const messageHandler = getMessageHandler()

    messageHandler({ data: JSON.stringify([RelayOpcode.ERROR, { code: RelayErrorCode.UNKNOWN }]) })

    expect(stateChanges).toContain(RelayClientState.FAILED_UNKNOWN)
    expect(getMockWebSocket().close).toHaveBeenCalled()
  })

  it('should map unrecognized error codes to FAILED_UNKNOWN', () => {
    client.connect()
    const messageHandler = getMessageHandler()

    messageHandler({ data: JSON.stringify([RelayOpcode.ERROR, { code: 'some_random_error' }]) })

    expect(stateChanges).toContain(RelayClientState.FAILED_UNKNOWN)
    expect(getMockWebSocket().close).toHaveBeenCalled()
  })
})
