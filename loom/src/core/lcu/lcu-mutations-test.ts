import { afterEach, describe, expect, vi, test } from 'vitest'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'

let lastRequestMethod: string | undefined
let lastRequestPath: string | undefined
let container: HTMLDivElement | null = null
let root: ReturnType<typeof createRoot> | null = null

vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react')>()),
  useRef: <T>(initialValue: T) => ({ current: initialValue }),
}))

vi.mock('@tanstack/react-query', () => ({
  useMutation: (config: { mutationFn: () => Promise<unknown> }) => ({
    mutateAsync: config.mutationFn,
  }),
  useQueryClient: () => ({
    invalidateQueries: async () => undefined,
  }),
}))

vi.mock('@/core/debug', () => ({
  debugError: () => undefined,
  debugLog: () => undefined,
}))

vi.mock('@/core/relay/relay-client-provider', () => ({
  useSharedLCUTransport: () => createTransport(),
}))

vi.mock('@shoma/protocol-contract', () => ({
  LcuHttpMethod: { POST: 'POST' },
  LcuPaths: {
    matchmaking: {
      readyCheckAccept: '/lol-matchmaking/v1/ready-check/accept',
      readyCheckDecline: '/lol-matchmaking/v1/ready-check/decline',
    },
  },
}))

vi.mock('./lcu-queries', () => ({
  gameflowPhaseDescriptor: { queryKey: ['gameflow'] },
  invitesDescriptor: { queryKey: ['invites'] },
  lobbyDescriptor: { queryKey: ['lobby'] },
  queueDescriptor: { queryKey: ['queue'] },
  queueSearchDescriptor: { queryKey: ['queue-search'] },
  readyCheckDescriptor: { queryKey: ['ready-check'] },
  sentInvitesDescriptor: { queryKey: ['sent-invites'] },
}))

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

    await renderHookResult(() => useAcceptReadyCheck()).mutateAsync()

    expect(lastRequestMethod).toBe('POST')
    expect(lastRequestPath).toBe('/lol-matchmaking/v1/ready-check/accept')
  })

  test('useDeclineReadyCheck sends POST', async () => {
    lastRequestMethod = undefined
    lastRequestPath = undefined

    await renderHookResult(() => useDeclineReadyCheck()).mutateAsync()

    expect(lastRequestMethod).toBe('POST')
    expect(lastRequestPath).toBe('/lol-matchmaking/v1/ready-check/decline')
  })
})
