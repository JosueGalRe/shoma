import React from 'react'

import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { RelayClientState } from '@/core/relay/relay-client'

import { DEFAULT_CONNECTED_PATH, getReconnectErrorKey, isReconnectDevRoute } from './reconnect-utils-utils'

const mocks = vi.hoisted(() => {
  return {
    clearPersistedReturnUrl: vi.fn(),
    clientState: 'DISCONNECTED',
    code: '123456',
    connect: vi.fn(),
    disconnect: vi.fn(),
    navigate: vi.fn(),
    pathname: '/connected/lobby',
    readPersistedReturnUrl: vi.fn<() => string | null>(),
    relayStatus: 'idle',
    setConnected: vi.fn(),
    setError: vi.fn(),
  }
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

vi.mock('@/core/relay/relay-client-provider', () => {
  return {
    useSharedRelayClient: () => {
      return { state: mocks.clientState }
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
        setConnected: typeof mocks.setConnected
        setError: typeof mocks.setError
        status: string
      }) => T,
    ) => {
      return selector({
        code: mocks.code,
        connect: mocks.connect,
        disconnect: mocks.disconnect,
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

function renderHook(): void {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)

  act(() => {
    root?.render(
      React.createElement(function TestHarness() {
        useGlobalSessionReconnect()

        return null
      }),
    )
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

  test('auto reconnects once for a disconnected six-digit code', () => {
    mocks.relayStatus = 'disconnected'

    renderHook()

    expect(mocks.connect).toHaveBeenCalledWith('123456')
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

  test('disconnects and returns to root when the relay drops while connected', () => {
    mocks.clientState = RelayClientState.DISCONNECTED
    mocks.relayStatus = 'connected'

    renderHook()

    expect(mocks.disconnect).toHaveBeenCalledTimes(1)
    expect(mocks.navigate).toHaveBeenCalledWith({ replace: true, search: { code: undefined }, to: '/' })
  })

  test('sets a reconnect error for failed relay states', () => {
    mocks.clientState = RelayClientState.FAILED_SESSION_EXPIRED

    renderHook()

    expect(mocks.disconnect).toHaveBeenCalledTimes(1)
    expect(mocks.setError).toHaveBeenCalledWith('connection.errors.sessionExpired')
  })
})
