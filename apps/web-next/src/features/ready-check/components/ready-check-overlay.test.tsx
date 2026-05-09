/// <reference types="bun-types" />

import { describe, expect, mock, test } from 'bun:test'

type MockResult = { data: string | null }

let currentPhase: string | null = 'Lobby'
let currentStatus: 'pending' | 'accepted' | 'declined' | 'expired' = 'pending'

mock.module('@tanstack/react-query', () => ({
  useQuery: () => ({ data: currentPhase } satisfies MockResult),
}))

mock.module('../../../core/lcu/lcu-queries', () => ({
  createLcuQueryOptions: () => ({}),
  gameflowPhaseDescriptor: {},
  readyCheckDescriptor: {},
}))

mock.module('../index', () => ({
  useReadyCheck: () => ({
    accept: async () => false,
    decline: async () => false,
    error: null,
    isLoading: false,
    status: currentStatus,
    timer: 12,
  }),
}))

mock.module('../../../core/rift/rift-client-provider', () => ({
  useSharedLCUTransport: () => ({}),
}))

const { ReadyCheckOverlay } = await import('./ready-check-overlay')

describe('ReadyCheckOverlay', () => {
  test('hides outside ReadyCheck phase', () => {
    currentPhase = 'Lobby'

    expect(ReadyCheckOverlay()).toBeNull()
  })

  test('shows during ReadyCheck phase', () => {
    currentPhase = 'ReadyCheck'
    currentStatus = 'pending'

    expect(ReadyCheckOverlay()).not.toBeNull()
  })

  test('hides after non-pending statuses', () => {
    currentPhase = 'ReadyCheck'

    for (const status of ['accepted', 'declined', 'expired'] as const) {
      currentStatus = status
      expect(ReadyCheckOverlay()).toBeNull()
    }
  })
})
