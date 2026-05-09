import { beforeEach, describe, expect, test } from 'bun:test'

import {
  initialReadyCheckState,
  selectIsReadyCheckAccepted,
  selectIsReadyCheckPending,
  selectIsReadyCheckStatus,
  selectReadyCheckStatus,
  useReadyCheckStore,
} from '../../src/features/ready-check/ready-check-store'

beforeEach(() => {
  useReadyCheckStore.setState(initialReadyCheckState)
})

describe('ready-check store', () => {
  test('does not use persist middleware', () => {
    expect((useReadyCheckStore as typeof useReadyCheckStore & { persist?: unknown }).persist).toBeUndefined()
  })

  test('exposes memoized status selectors', () => {
    expect(selectIsReadyCheckPending).toBe(selectIsReadyCheckStatus('pending'))
    expect(selectIsReadyCheckAccepted).toBe(selectIsReadyCheckStatus('accepted'))
    expect(selectReadyCheckStatus(useReadyCheckStore.getState())).toBe('pending')
  })

  test('handles ready-check transitions', () => {
    useReadyCheckStore.getState().setTimer(3.2)
    expect(useReadyCheckStore.getState().timer).toBe(4)

    useReadyCheckStore.getState().accept()
    expect(useReadyCheckStore.getState().status).toBe('accepted')

    useReadyCheckStore.getState().expire()
    expect(useReadyCheckStore.getState()).toMatchObject({ status: 'expired', timer: 0 })
    expect(selectIsReadyCheckPending(useReadyCheckStore.getState())).toBe(false)
  })
})
