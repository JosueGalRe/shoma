import { expect, test } from 'bun:test'

import { defaultConduitState, stateFromConnectionEvent } from './App'

test('keeps relay and LCU status dimensions independent', () => {
  const state = stateFromConnectionEvent({
    state: {
      relay: 'connected',
      lcu: 'waiting',
      error: 'lcu_unavailable',
    },
  })

  expect(state.relay).toBe('connected')
  expect(state.lcu).toBe('waiting')
  expect(state.error).toBe('lcu_unavailable')
})

test('defaults both status dimensions to waiting without an error', () => {
  expect(defaultConduitState).toEqual({
    relay: 'waiting',
    lcu: 'waiting',
    error: null,
  })
})
