import { describe, expect, test } from 'bun:test'

import { reduceDisconnect, reduceSetError, type RiftStoreState } from '../rift-store'

describe('rift store disconnect reducer', () => {
  test('preserves an existing error when disconnecting from error state', () => {
    const state: RiftStoreState = {
      code: '123456',
      error: 'connection.errors.riftUnreachable',
      status: 'error',
    }

    expect(reduceDisconnect(state)).toEqual({
      code: '123456',
      error: 'connection.errors.riftUnreachable',
      status: 'disconnected',
    })
  })

  test('clears the error when disconnecting from a non-error state', () => {
    const state: RiftStoreState = {
      code: '123456',
      error: 'connection.errors.riftUnreachable',
      status: 'connected',
    }

    expect(reduceDisconnect(state)).toEqual({
      code: '123456',
      error: null,
      status: 'disconnected',
    })
  })

  test('still marks setError(null) as a no-op for status', () => {
    const state: RiftStoreState = {
      code: '123456',
      error: 'connection.errors.riftUnreachable',
      status: 'error',
    }

    expect(reduceSetError(state, null)).toEqual({
      code: '123456',
      error: null,
      status: 'error',
    })
  })
})
