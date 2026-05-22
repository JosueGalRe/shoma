import { describe, expect, mock, test } from 'bun:test'

import * as ReactActual from 'react'

let lastRequestMethod: string | undefined
let lastRequestPath: string | undefined

mock.module('react', () => ({
  ...ReactActual,
  useRef: <T>(initialValue: T) => ({ current: initialValue }),
}))

mock.module(
  '/home/josuegalre/projects/mimic/node_modules/.bun/@tanstack+react-query@5.100.8+3f10a4be4e334a9b/node_modules/@tanstack/react-query/build/modern/index.js',
  () => ({
    __esModule: true,
    default: {},
    useMutation: (config: { mutationFn: () => Promise<unknown> }) => ({
      mutateAsync: config.mutationFn,
    }),
  }),
)

mock.module('@/core/debug', () => ({
  debugError: () => undefined,
  debugLog: () => undefined,
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

    await useAcceptReadyCheck(createTransport() as never, { invalidateQueries: async () => undefined } as never).mutateAsync()

    expect(lastRequestMethod).toBe('POST')
    expect(lastRequestPath).toBe('/lol-matchmaking/v1/ready-check/accept')
  })

  test('useDeclineReadyCheck sends POST', async () => {
    lastRequestMethod = undefined
    lastRequestPath = undefined

    await useDeclineReadyCheck(createTransport() as never, { invalidateQueries: async () => undefined } as never).mutateAsync()

    expect(lastRequestMethod).toBe('POST')
    expect(lastRequestPath).toBe('/lol-matchmaking/v1/ready-check/decline')
  })
})
