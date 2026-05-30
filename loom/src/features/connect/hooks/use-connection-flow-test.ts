import React, { act } from 'react'

import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RelayClientState } from '@/core/relay/relay-client'

import type { RelayClientState as RelayClientStateValue } from '@/core/relay/relay-client'

interface ConnectionFlowResult {
  code: string
  handleConnect: (code: string) => void
  onReconnectRecent: (code: string) => void
  recentSessions: string[]
}

interface ConnectionFlowMocks {
  addRecentSession: (code: string) => void
  clientState: RelayClientStateValue
  code: string
  connect: (code: string) => void
  disconnect: () => void
  error: string | null
  navigate: (options: unknown) => void
  recentCodes: string[]
  requestNotificationPermission: () => void
  searchCode: string | undefined
  setConnected: () => void
  setError: (error: string | null) => void
  status: string
}

const mocks = vi.hoisted<ConnectionFlowMocks>(() => {
  return {
    addRecentSession: vi.fn(),
    clientState: 'DISCONNECTED',
    code: '',
    connect: vi.fn(),
    disconnect: vi.fn(),
    error: null,
    navigate: vi.fn(),
    recentCodes: ['111111'],
    requestNotificationPermission: vi.fn(),
    searchCode: undefined,
    setConnected: vi.fn(),
    setError: vi.fn(),
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
    useRecentSessionsStore: <T>(selector: (state: { recentCodes: string[] }) => T) => {
      return selector({ recentCodes: mocks.recentCodes })
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

describe('useConnectionFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.clientState = RelayClientState.DISCONNECTED
    mocks.code = ''
    mocks.error = null
    mocks.recentCodes = ['111111']
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
    expect(requireResult().recentSessions).toEqual(['111111'])
  })
})
