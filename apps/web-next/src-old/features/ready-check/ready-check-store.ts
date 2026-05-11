import { LcuPaths } from '@mimic/protocol-contract'
import { create } from 'zustand'

import { useGameflowStore } from '@core/state/gameflow-store'

export type ReadyCheckResponse = 'None' | 'Accepted' | 'Declined' | string

export type ReadyCheckPhase = 'Invalid' | 'InProgress' | 'Expired' | string

export type ReadyCheckState = {
  timer: number
  state: ReadyCheckPhase
  playerResponse: ReadyCheckResponse
}

export type ReadyCheckStoreState = {
  timer: number
  state: ReadyCheckPhase
  playerResponse: ReadyCheckResponse
  isActive: boolean
  readyCheckState: ReadyCheckState | null
  error: Error | null
}

export type ReadyCheckStoreActions = {
  accept: (requestAccept?: () => Promise<void>) => Promise<boolean>
  decline: (requestDecline?: () => Promise<void>) => Promise<boolean>
  decrementTimer: () => void
  reset: () => void
  setError: (error: unknown) => void
  setReadyCheckState: (state: ReadyCheckState | null | undefined) => void
}

export type ReadyCheckStore = ReadyCheckStoreState & ReadyCheckStoreActions

export const initialReadyCheckState: ReadyCheckStoreState = {
  error: null,
  isActive: false,
  playerResponse: 'None',
  readyCheckState: null,
  state: 'Invalid',
  timer: 0,
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error
  }

  if (typeof error === 'string') {
    return new Error(error)
  }

  return new Error('Ready check operation failed.')
}

function normalizeTimer(timer: number | null | undefined): number {
  return Math.max(0, Math.ceil(timer ?? 0))
}

function isReadyCheckActive(state: ReadyCheckState | null | undefined): boolean {
  return state?.state === 'InProgress' && normalizeTimer(state.timer) > 0
}

async function defaultAcceptReadyCheck(): Promise<void> {
  await useGameflowStore.getState().acceptReadyCheck()
}

async function defaultDeclineReadyCheck(): Promise<void> {
  await useGameflowStore.getState().declineReadyCheck()
}

export function createReadyCheckStore() {
  return create<ReadyCheckStore>()((set, get) => ({
    ...initialReadyCheckState,
    async accept(requestAccept = defaultAcceptReadyCheck) {
      const current = get()
      if (!current.isActive || current.playerResponse === 'Accepted' || current.playerResponse === 'Declined') {
        return false
      }

      try {
        await requestAccept()
        set((state) => ({
          error: null,
          isActive: false,
          playerResponse: 'Accepted',
          readyCheckState: state.readyCheckState
            ? { ...state.readyCheckState, playerResponse: 'Accepted' }
            : { playerResponse: 'Accepted', state: 'InProgress', timer: state.timer },
        }))
        useGameflowStore.getState().setPhase('champSelect')
        return true
      } catch (error) {
        set({ error: normalizeError(error) })
        return false
      }
    },
    async decline(requestDecline = defaultDeclineReadyCheck) {
      const current = get()
      if (!current.isActive || current.playerResponse === 'Accepted' || current.playerResponse === 'Declined') {
        return false
      }

      try {
        await requestDecline()
        set((state) => ({
          error: null,
          isActive: false,
          playerResponse: 'Declined',
          readyCheckState: state.readyCheckState
            ? { ...state.readyCheckState, playerResponse: 'Declined' }
            : { playerResponse: 'Declined', state: 'InProgress', timer: state.timer },
        }))
        useGameflowStore.getState().setPhase('queue')
        return true
      } catch (error) {
        set({ error: normalizeError(error) })
        return false
      }
    },
    decrementTimer() {
      const current = get()
      if (!current.isActive || current.timer <= 0) {
        return
      }

      const timer = normalizeTimer(current.timer - 1)
      const expired = timer === 0
      set((state) => ({
        isActive: !expired,
        readyCheckState: state.readyCheckState
          ? { ...state.readyCheckState, state: expired ? 'Expired' : state.readyCheckState.state, timer }
          : null,
        state: expired ? 'Expired' : state.state,
        timer,
      }))

      if (expired) {
        useGameflowStore.getState().setPhase('queue')
      }
    },
    reset() {
      set({ ...initialReadyCheckState })
    },
    setError(error) {
      set({ error: normalizeError(error) })
    },
    setReadyCheckState(readyCheckState) {
      const timer = normalizeTimer(readyCheckState?.timer)
      const state = readyCheckState?.state ?? 'Invalid'
      const playerResponse = readyCheckState?.playerResponse ?? 'None'
      const isActive = isReadyCheckActive(readyCheckState)

      set({
        error: null,
        isActive,
        playerResponse,
        readyCheckState: readyCheckState ? { ...readyCheckState, timer } : null,
        state: isActive ? state : timer === 0 && state === 'InProgress' ? 'Expired' : state,
        timer,
      })

      if (isActive) {
        useGameflowStore.getState().setPhase('readyCheck')
      } else if (state === 'Invalid' || timer === 0) {
        useGameflowStore.getState().setPhase('queue')
      }
    },
  }))
}

export const readyCheckRequestPaths = {
  accept: LcuPaths.matchmaking.readyCheckAccept,
  decline: LcuPaths.matchmaking.readyCheckDecline,
  observer: LcuPaths.matchmaking.readyCheck,
} as const

export const useReadyCheckStore = createReadyCheckStore()
