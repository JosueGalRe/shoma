import { LcuPaths } from '@mimic/protocol-contract'
import { create } from 'zustand'

import { useGameflowStore } from '@core/state/gameflow-store'

export type QueueError = {
  errorType: string
  penaltyTimeRemaining: number
}

export type QueueSearchState = {
  isCurrentlyInQueue?: boolean
  estimatedQueueTime?: number
  timeInQueue?: number
  searchState?: string
  errors?: Array<{
    errorType?: string
    penaltyTimeRemaining?: number
  }>
}

export type QueueStoreState = {
  dodgeTimer: number | null
  errors: QueueError[]
  estimatedTime: number | null
  isInQueue: boolean
  queueState: QueueSearchState | null
}

export type QueueStoreActions = {
  cancelQueue: (requestCancel?: () => Promise<void>) => Promise<boolean>
  clearErrors: () => void
  reset: () => void
  setError: (error: unknown) => void
  setQueueState: (state: QueueSearchState | null | undefined) => void
  startQueue: (requestStart?: () => Promise<void>) => Promise<boolean>
}

export type QueueStore = QueueStoreState & QueueStoreActions

export const initialQueueState: QueueStoreState = {
  dodgeTimer: null,
  errors: [],
  estimatedTime: null,
  isInQueue: false,
  queueState: null,
}

function normalizeQueueErrors(state: QueueSearchState | null | undefined): QueueError[] {
  return (state?.errors ?? [])
    .map((error) => ({
      errorType: error.errorType ?? 'UnknownError',
      penaltyTimeRemaining: Math.max(0, error.penaltyTimeRemaining ?? 0),
    }))
    .filter((error) => error.errorType.length > 0 || error.penaltyTimeRemaining > 0)
}

function readDodgeTimer(errors: QueueError[]): number | null {
  const penaltyTimeRemaining = Math.max(0, ...errors.map((error) => error.penaltyTimeRemaining))
  return penaltyTimeRemaining > 0 ? penaltyTimeRemaining : null
}

function normalizeError(error: unknown): QueueError {
  if (error instanceof Error) {
    return { errorType: error.message, penaltyTimeRemaining: 0 }
  }

  if (typeof error === 'string') {
    return { errorType: error, penaltyTimeRemaining: 0 }
  }

  return { errorType: 'Queue operation failed.', penaltyTimeRemaining: 0 }
}

async function defaultStartQueue(): Promise<void> {
  await useGameflowStore.getState().startQueue()
}

async function defaultCancelQueue(): Promise<void> {
  useGameflowStore.getState().setPhase('lobby')
}

export function createQueueStore() {
  return create<QueueStore>()((set, get) => ({
    ...initialQueueState,
    async cancelQueue(requestCancel = defaultCancelQueue) {
      try {
        await requestCancel()
        set({ ...initialQueueState })
        useGameflowStore.getState().setPhase('lobby')
        return true
      } catch (error) {
        set((state) => ({ errors: [normalizeError(error), ...state.errors] }))
        return false
      }
    },
    clearErrors() {
      set({ errors: [], dodgeTimer: null })
    },
    reset() {
      set({ ...initialQueueState })
    },
    setError(error) {
      set((state) => ({ errors: [normalizeError(error), ...state.errors] }))
    },
    setQueueState(queueState) {
      const errors = normalizeQueueErrors(queueState)
      const dodgeTimer = readDodgeTimer(errors)
      const isInQueue = Boolean(queueState?.isCurrentlyInQueue)

      set({
        dodgeTimer,
        errors,
        estimatedTime: queueState?.estimatedQueueTime ?? null,
        isInQueue,
        queueState: isInQueue ? queueState ?? null : null,
      })

      useGameflowStore.getState().setPhase(isInQueue ? 'queue' : 'lobby')
    },
    async startQueue(requestStart = defaultStartQueue) {
      if ((get().dodgeTimer ?? 0) > 0) {
        set((state) => ({
          errors: [
            {
              errorType: 'DodgePenaltyActive',
              penaltyTimeRemaining: state.dodgeTimer ?? 0,
            },
            ...state.errors,
          ],
          isInQueue: false,
        }))
        return false
      }

      try {
        await requestStart()
        set((state) => ({
          errors: [],
          isInQueue: true,
          queueState: {
            ...state.queueState,
            isCurrentlyInQueue: true,
            searchState: state.queueState?.searchState ?? 'Searching',
          },
        }))
        useGameflowStore.getState().setPhase('queue')
        return true
      } catch (error) {
        set((state) => ({ errors: [normalizeError(error), ...state.errors], isInQueue: false }))
        return false
      }
    },
  }))
}

export const queueRequestPaths = {
  cancel: LcuPaths.lobby.matchmakingSearch,
  observer: LcuPaths.matchmaking.search,
  start: LcuPaths.lobby.matchmakingSearch,
} as const

export const useQueueStore = createQueueStore()
