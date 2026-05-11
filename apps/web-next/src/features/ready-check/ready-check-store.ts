import { create } from 'zustand'

// @knip
export const readyCheckStatuses = ['pending', 'accepted', 'declined', 'expired'] as const
// @knip
export type ReadyCheckStatus = (typeof readyCheckStatuses)[number]

// @knip
export type ReadyCheckStoreState = {
  status: ReadyCheckStatus
  timer: number
}

// @knip
export type ReadyCheckStoreActions = {
  accept: () => void
  decline: () => void
  expire: () => void
  setTimer: (timer: number) => void
}

export type ReadyCheckStore = ReadyCheckStoreState & ReadyCheckStoreActions

type ReadyCheckStoreSelector<T> = (state: ReadyCheckStore) => T

const readyCheckStatusSelectorCache = new Map<ReadyCheckStatus, ReadyCheckStoreSelector<boolean>>()

// @knip
export const initialReadyCheckState: ReadyCheckStoreState = {
  status: 'pending',
  timer: 0,
}

export const selectReadyCheckStatus: ReadyCheckStoreSelector<ReadyCheckStatus> = (state) => state.status

export const selectReadyCheckTimer: ReadyCheckStoreSelector<number> = (state) => state.timer

export function selectIsReadyCheckStatus(status: ReadyCheckStatus): ReadyCheckStoreSelector<boolean> {
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

function normalizeTimer(timer: number): number {
  return Math.max(0, Math.ceil(timer))
}

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
}))
