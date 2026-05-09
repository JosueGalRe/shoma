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

// @knip
export const initialReadyCheckState: ReadyCheckStoreState = {
  status: 'pending',
  timer: 0,
}

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
