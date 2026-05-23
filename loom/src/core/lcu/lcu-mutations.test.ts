import { describe, expect, mock, test } from 'bun:test'

import * as ReactActual from 'react'

let lastRequestMethod: string | undefined
let lastRequestPath: string | undefined

mock.module('react', () => ({
  ...ReactActual,
  useRef: <T>(initialValue: T) => ({ current: initialValue }),
}))

mock.module('@tanstack/react-query', () => ({
  useMutation: (config: { mutationFn: () => Promise<unknown> }) => ({
    mutateAsync: config.mutationFn,
  }),
  useQueryClient: () => ({
    invalidateQueries: async () => undefined,
  }),
}))

mock.module('@/core/debug', () => ({
  debugError: () => undefined,
  debugLog: () => undefined,
}))

mock.module('@/core/relay/relay-client-provider', () => ({
  useSharedLCUTransport: () => createTransport(),
}))

mock.module('@shoma/protocol-contract', () => ({
  LcuHttpMethod: { POST: 'POST' },
  LcuPaths: {
    matchmaking: {
      readyCheckAccept: '/lol-matchmaking/v1/ready-check/accept',
      readyCheckDecline: '/lol-matchmaking/v1/ready-check/decline',
    },
  },
}))

mock.module('./lcu-queries', () => ({
  gameflowPhaseDescriptor: { queryKey: ['gameflow'] },
  invitesDescriptor: { queryKey: ['invites'] },
  lobbyDescriptor: { queryKey: ['lobby'] },
  queueDescriptor: { queryKey: ['queue'] },
  queueSearchDescriptor: { queryKey: ['queue-search'] },
  readyCheckDescriptor: { queryKey: ['ready-check'] },
  sentInvitesDescriptor: { queryKey: ['sent-invites'] },
}))

const { useAcceptReadyCheck, useDeclineReadyCheck } = await import('./lcu-mutations')

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
  test('useAcceptReadyCheck sends POST', async () => {
    lastRequestMethod = undefined
    lastRequestPath = undefined

    await useAcceptReadyCheck().mutateAsync()

    expect(lastRequestMethod).toBe('POST')
    expect(lastRequestPath).toBe('/lol-matchmaking/v1/ready-check/accept')
  })

  test('useDeclineReadyCheck sends POST', async () => {
    lastRequestMethod = undefined
    lastRequestPath = undefined

    await useDeclineReadyCheck().mutateAsync()

    expect(lastRequestMethod).toBe('POST')
    expect(lastRequestPath).toBe('/lol-matchmaking/v1/ready-check/decline')
  })
})
