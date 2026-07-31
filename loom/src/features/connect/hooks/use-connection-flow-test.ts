import React, { act } from 'react'

import { MobileOpcode } from '@shoma/protocol-contract'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RelayClientState } from '@/core/relay/relay-client'

import type { RecentSession } from '../recent-sessions-store'
import type { RelayClientState as RelayClientStateValue } from '@/core/relay/relay-client'

interface FakeRelayClient {
  emit: (payload: string) => void
  onData: ReturnType<typeof vi.fn>
  send: ReturnType<typeof vi.fn>
}

interface ConnectionFlowResult {
  code: string
  handleConnect: (code: string) => void
  onReconnectRecent: (code: string) => void
  onRemoveRecent: (code: string) => void
  recentSessions: RecentSession[]
}

interface ConnectionFlowMocks {
  addRecentSession: (code: string) => void
  client: FakeRelayClient | null
  clientState: RelayClientStateValue
  code: string
  connect: (code: string) => void
  disconnect: () => void
  error: string | null
  navigate: (options: unknown) => void
  recentSessions: RecentSession[]
  removeRecentSession: (code: string) => void
  requestNotificationPermission: () => void
  searchCode: string | undefined
  setConnected: () => void
  setError: (error: string | null) => void
  setRecentSessionDeviceName: (code: string, deviceName: string) => void
  status: string
}

const mocks = vi.hoisted<ConnectionFlowMocks>(() => {
  return {
    addRecentSession: vi.fn(),
    client: null,
    clientState: 'DISCONNECTED',
    code: '',
    connect: vi.fn(),
    disconnect: vi.fn(),
    error: null,
    navigate: vi.fn(),
    recentSessions: [{ code: '111111', deviceName: null }],
    removeRecentSession: vi.fn(),
    requestNotificationPermission: vi.fn(),
    searchCode: undefined,
    setConnected: vi.fn(),
    setError: vi.fn(),
    setRecentSessionDeviceName: vi.fn(),
    status: 'idle',
  }
})

vi.mock('@tanstack/react-router', () => {
  return {
    useNavigate: () => {
      return mocks.navigate
    },
    useSearch: () => {
      return { code: mocks.searchCode }
    },
  }
})

vi.mock('@/core/relay/use-relay-client', () => {
  return {
    useSharedRelayClient: () => {
      return { client: mocks.client, state: mocks.clientState }
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
      error: (state: { error: string | null }) => {
        return state.error
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
        error: string | null
        setConnected: typeof mocks.setConnected
        setError: typeof mocks.setError
        status: string
      }) => T,
    ) => {
      return selector({
        code: mocks.code,
        connect: mocks.connect,
        disconnect: mocks.disconnect,
        error: mocks.error,
        setConnected: mocks.setConnected,
        setError: mocks.setError,
        status: mocks.status,
      })
    },
  }
})

vi.mock('@/features/notifications/notification-manager', () => {
  return {
    requestNotificationPermission: () => {
      return mocks.requestNotificationPermission()
    },
  }
})

vi.mock('../recent-sessions-store', () => {
  return {
    addRecentSession: (code: string) => {
      mocks.addRecentSession(code)
    },
    removeRecentSession: (code: string) => {
      mocks.removeRecentSession(code)
    },
    setRecentSessionDeviceName: (code: string, deviceName: string) => {
      mocks.setRecentSessionDeviceName(code, deviceName)
    },
    useRecentSessionsStore: <T>(selector: (state: { recentSessions: RecentSession[] }) => T) => {
      return selector({ recentSessions: mocks.recentSessions })
    },
  }
})

const { useConnectionFlow } = await import('./use-connection-flow')

let container: HTMLDivElement | null = null
let root: ReturnType<typeof createRoot> | null = null
let result: ConnectionFlowResult | null = null

function TestHarness() {
  result = useConnectionFlow()

  return null
}

function renderHook(): void {
  if (!container) {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  }

  act(() => {
    root?.render(React.createElement(TestHarness))
  })
}

function cleanup(): void {
  act(() => {
    root?.unmount()
  })

  root = null
  container?.remove()
  container = null
  result = null
}

function requireResult(): ConnectionFlowResult {
  if (!result) {
    throw new Error('Connection flow hook did not render')
  }

  return result
}

function createFakeRelayClient(): FakeRelayClient {
  const listeners = new Set<(payload: string) => void>()

  return {
    emit(payload: string) {
      listeners.forEach((listener) => {
        listener(payload)
      })
    },
    onData: vi.fn((listener: (payload: string) => void) => {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    }),
    send: vi.fn(() => {
      return Promise.resolve()
    }),
  }
}

describe('useConnectionFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.client = null
    mocks.clientState = RelayClientState.DISCONNECTED
    mocks.code = ''
    mocks.error = null
    mocks.recentSessions = [{ code: '111111', deviceName: null }]
    mocks.searchCode = undefined
    mocks.status = 'idle'
  })

  afterEach(() => {
    cleanup()
  })

  it('prefills the URL code without auto-connecting', () => {
    mocks.code = '123456'
    mocks.searchCode = '336077'

    renderHook()

    expect(requireResult().code).toBe('336077')
    expect(mocks.connect).not.toHaveBeenCalled()
  })

  it('does not prefill the persisted relay code', () => {
    mocks.code = '123456'

    renderHook()

    expect(requireResult().code).toBe('')
    expect(mocks.connect).not.toHaveBeenCalled()
  })

  it('adds a manual connection code to recents only after the client connects', () => {
    renderHook()
    vi.clearAllMocks()

    act(() => {
      requireResult().handleConnect('336077')
    })

    expect(mocks.connect).toHaveBeenCalledWith('336077')
    expect(mocks.addRecentSession).not.toHaveBeenCalled()

    mocks.clientState = RelayClientState.CONNECTED
    renderHook()

    expect(mocks.addRecentSession).toHaveBeenCalledWith('336077')
  })

  it('connects from recent sessions through the exposed reconnect handler', () => {
    renderHook()
    vi.clearAllMocks()

    act(() => {
      requireResult().onReconnectRecent('111111')
    })

    expect(requireResult().code).toBe('111111')
    expect(mocks.connect).toHaveBeenCalledWith('111111')
    expect(requireResult().recentSessions).toEqual([{ code: '111111', deviceName: null }])
  })

  it('removes a recent session through the exposed remove handler', () => {
    renderHook()
    vi.clearAllMocks()

    act(() => {
      requireResult().onRemoveRecent('111111')
    })

    expect(mocks.removeRecentSession).toHaveBeenCalledWith('111111')
  })

  it('removes the pending session when the code no longer exists on the relay', () => {
    renderHook()

    act(() => {
      requireResult().onReconnectRecent('111111')
    })

    mocks.clientState = RelayClientState.FAILED_INVALID_CODE
    renderHook()

    expect(mocks.removeRecentSession).toHaveBeenCalledWith('111111')
    expect(mocks.addRecentSession).not.toHaveBeenCalled()
  })

  it('removes the pending session when the session expired on the relay', () => {
    renderHook()

    act(() => {
      requireResult().onReconnectRecent('111111')
    })

    mocks.clientState = RelayClientState.FAILED_SESSION_EXPIRED
    renderHook()

    expect(mocks.removeRecentSession).toHaveBeenCalledWith('111111')
  })

  it('stores the desktop device name once the version response arrives', () => {
    const client = createFakeRelayClient()

    mocks.client = client

    renderHook()

    act(() => {
      requireResult().handleConnect('336077')
    })

    mocks.clientState = RelayClientState.CONNECTED
    renderHook()

    expect(client.send).toHaveBeenCalledWith(JSON.stringify([MobileOpcode.VERSION]))

    act(() => {
      client.emit(JSON.stringify([MobileOpcode.VERSION_RESPONSE, '0.1.0', 'GAMING-PC']))
    })

    expect(mocks.setRecentSessionDeviceName).toHaveBeenCalledWith('336077', 'GAMING-PC')

    act(() => {
      client.emit(JSON.stringify([MobileOpcode.VERSION_RESPONSE, '0.1.0', 'OTHER-PC']))
    })

    expect(mocks.setRecentSessionDeviceName).toHaveBeenCalledTimes(1)
  })
})
