import { create } from 'zustand'

import { normalizeTimer } from './ready-check-utils'

import type { ReadyCheckStore, ReadyCheckStoreState } from './ready-check-types'

type ReadyCheckStoreSelector<T> = (state: ReadyCheckStore) => T

const readyCheckStatusSelectorCache = new Map<ReadyCheckStoreState['status'], ReadyCheckStoreSelector<boolean>>()

export const initialReadyCheckState: ReadyCheckStoreState = {
  premade: {
    isActive: false,
    members: [],
  },
  status: 'pending',
  timer: 0,
}

export function selectReadyCheckStatus(state: ReadyCheckStore): ReadyCheckStoreState['status'] {
  return state.status
}

export function selectReadyCheckTimer(state: ReadyCheckStore): number {
  return state.timer
}

export function selectIsReadyCheckStatus(status: ReadyCheckStoreState['status']): ReadyCheckStoreSelector<boolean> {
  const cachedSelector = readyCheckStatusSelectorCache.get(status)

  if (cachedSelector) {
    return cachedSelector
  }

  function selector(state: ReadyCheckStore): boolean {
    return state.status === status
  }

  readyCheckStatusSelectorCache.set(status, selector)

  return selector
}

export const selectIsReadyCheckPending = selectIsReadyCheckStatus('pending')
export const selectIsReadyCheckAccepted = selectIsReadyCheckStatus('accepted')
export const selectIsReadyCheckDeclined = selectIsReadyCheckStatus('declined')
export const selectIsReadyCheckExpired = selectIsReadyCheckStatus('expired')

export const useReadyCheckStore = create<ReadyCheckStore>()((set, get) => {
  return {
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
    setPremadeReadyCheck(data) {
      set({ premade: data })
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
  }
})
