import { describe, expect, mock, test } from 'bun:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient } from '@tanstack/react-query'

let currentElapsedTimer = 0

mock.module('/home/josuegalre/projects/mimic/node_modules/.bun/@tanstack+react-query@5.100.8+3f10a4be4e334a9b/node_modules/@tanstack/react-query/build/modern/index.js', () => ({
  __esModule: true,
  default: {},
  QueryClient: class QueryClient {},
  useQuery: () => ({
    data: { state: 'InProgress', timer: currentElapsedTimer },
    error: null,
    isLoading: false,
  }),
  useQueryClient: () => ({}),
}))

mock.module('@/core/lcu/lcu-queries', () => ({
  createLcuQueryOptions: () => ({}),
  readyCheckDescriptor: {},
}))

mock.module('@/core/lcu/lcu-observer-sync', () => ({
  useLcuObserverSync: () => undefined,
}))

mock.module('@/core/rift/rift-client-provider', () => ({
  useSharedLCUTransport: () => ({}),
}))

mock.module('@/features/notifications/notification-manager', () => ({
  notify: () => undefined,
}))

mock.module('@/core/lcu/lcu-mutations', () => ({
  useAcceptReadyCheck: () => ({ mutateAsync: async () => undefined }),
  useDeclineReadyCheck: () => ({ mutateAsync: async () => undefined }),
}))

mock.module('@/hooks/useCountdown', () => ({
  useCountdown: (remaining: number) => ({ remaining }),
}))

mock.module('../ready-check-store', () => ({
  useReadyCheckStore: (selector: (state: { accept: () => void; decline: () => void; status: 'pending'; timer: number }) => unknown) =>
    selector({
      accept: () => undefined,
      decline: () => undefined,
      status: 'pending',
      timer: 0,
    }),
}))

// Ensure QueryClient is resolved through the mock
void QueryClient

const { useReadyCheck } = await import('./use-ready-check')

function TestComponent() {
  const { timer } = useReadyCheck()

  return React.createElement('span', null, timer)
}

describe('useReadyCheck', () => {
  test('converts elapsed timer 0 to remaining timer 12', () => {
    currentElapsedTimer = 0

    const markup = renderToStaticMarkup(React.createElement(TestComponent))

    expect(markup).toContain('12')
  })

  test('converts elapsed timer 6 to remaining timer 6', () => {
    currentElapsedTimer = 6

    const markup = renderToStaticMarkup(React.createElement(TestComponent))

    expect(markup).toContain('6')
  })

  test('converts elapsed timer 12 to remaining timer 0', () => {
    currentElapsedTimer = 12

    const markup = renderToStaticMarkup(React.createElement(TestComponent))

    expect(markup).toContain('0')
  })
})
