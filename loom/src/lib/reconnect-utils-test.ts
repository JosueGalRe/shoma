import React, { act } from 'react'

import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { RelayClientState } from '@/core/relay/relay-client'

import { DEFAULT_CONNECTED_PATH, getReconnectErrorKey, isReconnectDevRoute } from './reconnect-utils'

const mocks = vi.hoisted(() => {
  return {
    clearPersistedReturnUrl: vi.fn(),
    clientState: 'DISCONNECTED',
    code: '123456',
    connect: vi.fn(),
    disconnect: vi.fn(),
    lose: vi.fn(),
    navigate: vi.fn(),
    pathname: '/connected/lobby',
    readPersistedReturnUrl: vi.fn<() => string | null>(),
    relayStatus: 'idle',
    setConnected: vi.fn(),
    setError: vi.fn(),
  }
})

// What the hook subscribed to the transport's notice that the client closed
const clientClosed = vi.hoisted((): { listener: (() => void) | null } => {
  return { listener: null }
})

vi.mock('@tanstack/react-router', () => {
  return {
    useNavigate: () => {
      return mocks.navigate
    },
    useRouterState: ({ select }: { select: (state: { location: { pathname: string } }) => string }) => {
      return select({ location: { pathname: mocks.pathname } })
    },
  }
})

vi.mock('@/core/relay/use-relay-client', () => {
  return {
    useSharedRelayClient: () => {
      return { state: mocks.clientState }
    },
  }
})

vi.mock('@/core/relay/use-relay-state', () => {
  return {
    useSharedLCUTransport: () => {
      return {
        onClientClosed: (listener: () => void) => {
          clientClosed.listener = listener

          return () => {
            clientClosed.listener = null
          }
        },
      }
    },
  }
})

vi.mock('@/core/state/relay-store', () => {
  return {
    relayStoreSelectors: {
      code: (state: { code: string }) => {
        return state.code
      },
      connect: (state: { connect: typeof mocks.connect }) => {
        return state.connect
      },
      disconnect: (state: { disconnect: typeof mocks.disconnect }) => {
        return state.disconnect
      },
      lose: (state: { lose: typeof mocks.lose }) => {
        return state.lose
      },
      setConnected: (state: { setConnected: typeof mocks.setConnected }) => {
        return state.setConnected
      },
      setError: (state: { setError: typeof mocks.setError }) => {
        return state.setError
      },
      status: (state: { status: string }) => {
        return state.status
      },
    },
    useRelayStore: <T>(
      selector: (state: {
        code: string
        connect: typeof mocks.connect
        disconnect: typeof mocks.disconnect
        lose: typeof mocks.lose
        setConnected: typeof mocks.setConnected
        setError: typeof mocks.setError
        status: string
      }) => T,
    ) => {
      return selector({
        code: mocks.code,
        connect: mocks.connect,
        disconnect: mocks.disconnect,
        lose: mocks.lose,
        setConnected: mocks.setConnected,
        setError: mocks.setError,
        status: mocks.relayStatus,
      })
    },
  }
})

vi.mock('@/lib/session-utils', () => {
  return {
    clearPersistedReturnUrl: () => {
      return mocks.clearPersistedReturnUrl()
    },
    readPersistedReturnUrl: () => {
      return mocks.readPersistedReturnUrl()
    },
  }
})

const { useGlobalSessionReconnect } = await import('./reconnect-utils')

let container: HTMLDivElement | null = null
let root: ReturnType<typeof createRoot> | null = null

function HookHost(): null {
  useGlobalSessionReconnect()

  return null
}

function renderHook(): void {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)

  act(() => {
    root?.render(React.createElement(HookHost))
  })
}

// The mocks are read on render, so rendering again picks up their new values
function rerenderHook(): void {
  act(() => {
    root?.render(React.createElement(HookHost))
  })
}

function cleanup(): void {
  act(() => {
    root?.unmount()
  })

  root = null
  container?.remove()
  container = null
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.clientState = 'DISCONNECTED'
  mocks.code = '123456'
  mocks.pathname = '/connected/lobby'
  mocks.readPersistedReturnUrl.mockReturnValue('/connected/champ-select')
  mocks.relayStatus = 'idle'
})

afterEach(() => {
  cleanup()
})

describe('reconnect utils', () => {
  test('exposes the default connected path and dev-route detection', () => {
    expect(DEFAULT_CONNECTED_PATH).toBe('/connected/lobby')
    expect(isReconnectDevRoute('/prototype')).toBe(true)
    expect(isReconnectDevRoute('/prototype-header/foo')).toBe(true)
    expect(isReconnectDevRoute('/connected/lobby')).toBe(false)
  })

  test('maps reconnect failures to connection error keys', () => {
    expect(getReconnectErrorKey(RelayClientState.CONNECTED)).toBeNull()
    expect(getReconnectErrorKey(RelayClientState.FAILED_RELAY_UNREACHABLE)).toBe('connection.errors.relayUnreachable')
    expect(getReconnectErrorKey(RelayClientState.FAILED_SESSION_EXPIRED)).toBe('connection.errors.sessionExpired')
  })

  test('does not auto reconnect for a disconnected six-digit code', () => {
    mocks.relayStatus = 'disconnected'

    renderHook()

    expect(mocks.connect).not.toHaveBeenCalled()
  })

  test('does not auto reconnect on the home route', () => {
    mocks.relayStatus = 'disconnected'
    mocks.pathname = '/'

    renderHook()

    expect(mocks.connect).not.toHaveBeenCalled()
  })

  test('redirects to the persisted return url after connecting', () => {
    mocks.clientState = RelayClientState.CONNECTED

    renderHook()

    expect(mocks.setConnected).toHaveBeenCalledTimes(1)
    expect(mocks.readPersistedReturnUrl).toHaveBeenCalledTimes(1)
    expect(mocks.clearPersistedReturnUrl).toHaveBeenCalledTimes(1)
    expect(mocks.navigate).toHaveBeenCalledWith({ replace: true, to: '/connected/champ-select' })
  })

  test('skips redirect on reconnect dev routes', () => {
    mocks.clientState = RelayClientState.CONNECTED
    mocks.pathname = '/prototype'

    renderHook()

    expect(mocks.setConnected).toHaveBeenCalledTimes(1)
    expect(mocks.clearPersistedReturnUrl).not.toHaveBeenCalled()
    expect(mocks.navigate).not.toHaveBeenCalled()
  })

  test('keeps the session lost when the relay drops while connected', () => {
    mocks.clientState = RelayClientState.DISCONNECTED
    mocks.relayStatus = 'connected'

    renderHook()

    expect(mocks.lose).toHaveBeenCalledWith('pc')
    expect(mocks.disconnect).not.toHaveBeenCalled()
    expect(mocks.navigate).not.toHaveBeenCalled()
  })

  test('keeps a lost session while its retries find no desktop', () => {
    mocks.clientState = RelayClientState.FAILED_RELAY_UNREACHABLE
    mocks.relayStatus = 'lost'

    renderHook()

    expect(mocks.lose).not.toHaveBeenCalled()
    expect(mocks.disconnect).not.toHaveBeenCalled()
  })

  test('ends a lost session the relay refuses for good and returns to root', () => {
    mocks.clientState = RelayClientState.FAILED_SESSION_EXPIRED
    mocks.relayStatus = 'lost'

    renderHook()

    expect(mocks.disconnect).toHaveBeenCalledTimes(1)
    expect(mocks.setError).toHaveBeenCalledWith('connection.errors.sessionExpired')

    expect(mocks.navigate).toHaveBeenCalledWith({
      replace: true,
      search: expect.any(Function),
      to: '/',
    })
  })

  test("loses the session on Conduit's notice and stays lost while the socket is still up", () => {
    mocks.clientState = RelayClientState.CONNECTED
    mocks.relayStatus = 'connected'

    renderHook()

    act(() => {
      clientClosed.listener?.()
    })

    expect(mocks.lose).toHaveBeenCalledWith('client-closed')

    mocks.relayStatus = 'lost'
    rerenderHook()

    expect(mocks.setConnected).toHaveBeenCalledTimes(1)

    mocks.clientState = RelayClientState.DISCONNECTED
    rerenderHook()
    mocks.clientState = RelayClientState.CONNECTED
    rerenderHook()

    expect(mocks.setConnected).toHaveBeenCalledTimes(2)
  })

  test('sets a reconnect error for failed relay states', () => {
    mocks.clientState = RelayClientState.FAILED_SESSION_EXPIRED

    renderHook()

    expect(mocks.disconnect).toHaveBeenCalledTimes(1)
    expect(mocks.setError).toHaveBeenCalledWith('connection.errors.sessionExpired')
  })
})
