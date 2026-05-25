import { expect, test } from 'bun:test'

import { defaultConduitState, stateFromConnectionEvent } from './app-utils'

test('keeps relay and LCU status dimensions independent', () => {
  const state = stateFromConnectionEvent({
    state: {
      error: 'lcu_unavailable',
      lcu: 'waiting',
      relay: 'paired',
    },
  })

  expect(state.relay).toBe('paired')
  expect(state.lcu).toBe('waiting')
  expect(state.error).toBe('lcu_unavailable')
})

test('defaults both status dimensions to waiting without an error', () => {
  expect(defaultConduitState).toEqual({
    error: null,
    lcu: 'waiting',
    relay: 'waiting',
  })
})
