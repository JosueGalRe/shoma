import { describe, expect, mock, test } from 'bun:test'

type MockResult = { data: string | null }

let currentPhase: string | null = 'Lobby'

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
    status: 'pending' as const,
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

    expect(ReadyCheckOverlay()).not.toBeNull()
  })
})
