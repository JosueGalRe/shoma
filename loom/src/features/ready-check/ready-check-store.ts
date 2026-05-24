import { create } from 'zustand'

import type { ReadyCheckStore, ReadyCheckStoreState } from './ready-check-types'
import { normalizeTimer } from './ready-check-utils'

type ReadyCheckStoreSelector<T> = (state: ReadyCheckStore) => T

const readyCheckStatusSelectorCache = new Map<ReadyCheckStoreState['status'], ReadyCheckStoreSelector<boolean>>()

export const initialReadyCheckState: ReadyCheckStoreState = {
  status: 'pending',
  timer: 0,
  premade: {
    isActive: false,
    members: [],
  },
}

export const selectReadyCheckStatus: ReadyCheckStoreSelector<ReadyCheckStoreState['status']> = (state) => state.status

export const selectReadyCheckTimer: ReadyCheckStoreSelector<number> = (state) => state.timer

export function selectIsReadyCheckStatus(status: ReadyCheckStoreState['status']): ReadyCheckStoreSelector<boolean> {
  const cachedSelector = readyCheckStatusSelectorCache.get(status)

  if (cachedSelector) {
    return cachedSelector
  }

  const selector: ReadyCheckStoreSelector<boolean> = (state) => state.status === status
  readyCheckStatusSelectorCache.set(status, selector)
  return selector
}

export const selectIsReadyCheckPending = selectIsReadyCheckStatus('pending')
export const selectIsReadyCheckAccepted = selectIsReadyCheckStatus('accepted')
export const selectIsReadyCheckDeclined = selectIsReadyCheckStatus('declined')
export const selectIsReadyCheckExpired = selectIsReadyCheckStatus('expired')

export const useReadyCheckStore = create<ReadyCheckStore>()((set, get) => ({
  ...initialReadyCheckState,
  accept() {
    if (get().status !== 'pending') {
      return
    }

    set({ status: 'accepted' })
  },
  decline() {
    if (get().status !== 'pending') {
      return
    }

    set({ status: 'declined' })
  },
  expire() {
    set({ status: 'expired', timer: 0 })
  },
  reset() {
    set(initialReadyCheckState)
  },
  setTimer(timer) {
    const nextTimer = normalizeTimer(timer)

    set((state) => {
      if (state.status !== 'pending') {
        return state
      }

      if (state.timer === nextTimer) {
        return state
      }

      if (nextTimer === 0) {
        return { status: 'expired', timer: 0 }
      }

      return { ...state, timer: nextTimer }
    })
  },
  setPremadeReadyCheck(data) {
    set({ premade: data })
  },
}))
