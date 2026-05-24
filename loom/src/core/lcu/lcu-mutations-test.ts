import { afterEach, describe, expect, vi, test } from 'vitest'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'

let lastRequestMethod: string | undefined
let lastRequestPath: string | undefined
let container: HTMLDivElement | null = null
let root: ReturnType<typeof createRoot> | null = null

vi.mock('react', async (importOriginal) => {return {
  ...(await importOriginal()),
  useRef: <T>(initialValue: T) => {return { current: initialValue }},
}})

vi.mock('@tanstack/react-query', () => {return {
  useMutation: (config: { mutationFn: () => Promise<unknown> }) => {return {
    mutateAsync: config.mutationFn,
  }},
  useQueryClient: () => {return {
    invalidateQueries: async () => {
      return undefined
    },
  }},
}})

vi.mock('@/core/debug', () => {return {
  debugError: () => {return undefined},
  debugLog: () => {return undefined},
}})

vi.mock('@/core/relay/relay-client-provider', () => {return {
  useSharedLCUTransport: () => { return createTransport(); },
}})

vi.mock('@shoma/protocol-contract', () => {return {
  LcuHttpMethod: { POST: 'POST' },
  LcuPaths: {
    matchmaking: {
      readyCheckAccept: '/lol-matchmaking/v1/ready-check/accept',
      readyCheckDecline: '/lol-matchmaking/v1/ready-check/decline',
    },
  },
}})

vi.mock('./lcu-queries', () => {return {
  gameflowPhaseDescriptor: { queryKey: ['gameflow'] },
  invitesDescriptor: { queryKey: ['invites'] },
  lobbyDescriptor: { queryKey: ['lobby'] },
  queueDescriptor: { queryKey: ['queue'] },
  queueSearchDescriptor: { queryKey: ['queue-search'] },
  readyCheckDescriptor: { queryKey: ['ready-check'] },
  sentInvitesDescriptor: { queryKey: ['sent-invites'] },
}})

const { useAcceptReadyCheck, useDeclineReadyCheck } = await import('./lcu-mutations')

function renderHookResult<T>(hook: () => T): T {
  let result: T | undefined

  function TestComponent() {
    result = hook()
    return null
  }

  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)

  act(() => {
    root?.render(React.createElement(TestComponent))
  })

  if (result === undefined) {
    throw new Error('Hook did not render')
  }

  return result
}

function cleanupHarness() {
  act(() => {
    root?.unmount()
  })

  root = null
  container?.remove()
  container = null
}

function createTransport() {
  return {
    request: async (path: string, method: string) => {
      lastRequestPath = path
      lastRequestMethod = method

      return { status: 204, content: null }
    },
  }
}

describe('lcu-mutations ready check', () => {
  afterEach(() => {
    cleanupHarness()
  })

  test('useAcceptReadyCheck sends POST', async () => {
    lastRequestMethod = undefined
    lastRequestPath = undefined

    await renderHookResult(() => { return useAcceptReadyCheck(); }).mutateAsync()

    expect(lastRequestMethod).toBe('POST')
    expect(lastRequestPath).toBe('/lol-matchmaking/v1/ready-check/accept')
  })

  test('useDeclineReadyCheck sends POST', async () => {
    lastRequestMethod = undefined
    lastRequestPath = undefined

    await renderHookResult(() => { return useDeclineReadyCheck(); }).mutateAsync()

    expect(lastRequestMethod).toBe('POST')
    expect(lastRequestPath).toBe('/lol-matchmaking/v1/ready-check/decline')
  })
})
