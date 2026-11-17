import { describe, expect, test } from 'vitest'

import { reduceDisconnect, reduceSetError, type RelayStoreState } from '../relay-store'

describe('relay store disconnect reducer', () => {
  test('preserves an existing error when disconnecting from error state', () => {
    const state: RelayStoreState = {
      code: '123456',
      error: 'connection.errors.relayUnreachable',
      lostReason: null,
      status: 'error',
    }

    expect(reduceDisconnect(state)).toEqual({
      code: '123456',
      error: 'connection.errors.relayUnreachable',
      lostReason: null,
      status: 'disconnected',
    })
  })

  test('keeps the error when a failed attempt disconnects again', () => {
    const failed = reduceDisconnect(
      reduceSetError({ code: '123456', error: null, lostReason: null, status: 'connecting' }, 'invalid'),
    )

    expect(reduceDisconnect(failed)).toEqual({ code: '123456', error: 'invalid', lostReason: null, status: 'disconnected' })
  })

  test('clears the error when disconnecting from a non-error state', () => {
    const state: RelayStoreState = {
      code: '123456',
      error: 'connection.errors.relayUnreachable',
      lostReason: null,
      status: 'connected',
    }

    expect(reduceDisconnect(state)).toEqual({
      code: '123456',
      error: null,
      lostReason: null,
      status: 'disconnected',
    })
  })

  test('still marks setError(null) as a no-op for status', () => {
    const state: RelayStoreState = {
      code: '123456',
      error: 'connection.errors.relayUnreachable',
      lostReason: null,
      status: 'error',
    }

    expect(reduceSetError(state, null)).toEqual({
      code: '123456',
      error: null,
      lostReason: null,
      status: 'error',
    })
  })
})
