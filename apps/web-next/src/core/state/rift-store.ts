import { create } from 'zustand'

import { useSessionStore } from './session-store'

// @knip
export const riftStatuses = ['idle', 'connecting', 'connected', 'disconnected', 'error'] as const
// @knip
export type RiftStatus = (typeof riftStatuses)[number]

export type RiftStoreState = {
  status: RiftStatus
  code: string
  error: string | null
}

// @knip
export type RiftStoreActions = {
  connect: (code: string) => void
  disconnect: () => void
  reconnect: () => void
  setConnected: () => void
  setError: (error: string | Error | null) => void
}

export type RiftStore = RiftStoreState & RiftStoreActions

type RiftStoreSelector<T> = (state: RiftStore) => T

// @knip
export const riftStoreSelectors = {
  code: (state: RiftStore) => state.code,
  connect: (state: RiftStore) => state.connect,
  disconnect: (state: RiftStore) => state.disconnect,
  error: (state: RiftStore) => state.error,
  setConnected: (state: RiftStore) => state.setConnected,
  setError: (state: RiftStore) => state.setError,
  status: (state: RiftStore) => state.status,
} satisfies Record<string, RiftStoreSelector<unknown>>

function readConnectionCode(): string {
  return useSessionStore.getState().connectionCode
}

const initialCode = readConnectionCode()

// @knip
export const initialRiftStoreState: RiftStoreState = {
  code: initialCode,
  error: null,
  status: initialCode.length > 0 ? 'disconnected' : 'idle',
}

function normalizeCode(code: string): string {
  return code.trim()
}

function normalizeError(error: string | Error | null): string | null {
  if (error === null) {
    return null
  }

  return error instanceof Error ? error.message : error
}

export function createInitialRiftStoreState(): RiftStoreState {
  const code = readConnectionCode()

  return {
    ...initialRiftStoreState,
    code,
    status: code.length > 0 ? 'disconnected' : 'idle',
  }
}

export function reduceConnect(state: RiftStoreState, code: string): RiftStoreState {
  const nextCode = normalizeCode(code)

  if (nextCode.length === 0) {
    return {
      ...state,
      error: 'Connection code is required.',
      status: 'error',
    }
  }

  return {
    code: nextCode,
    error: null,
    status: 'connecting',
  }
}

export function reduceDisconnect(state: RiftStoreState): RiftStoreState {
  return {
    ...state,
    error: null,
    status: 'disconnected',
  }
}

export function reduceReconnect(state: RiftStoreState): RiftStoreState {
  const nextCode = normalizeCode(state.code || readConnectionCode())

  if (nextCode.length === 0) {
    return {
      ...state,
      error: 'Connection code is required.',
      status: 'error',
    }
  }

  return {
    code: nextCode,
    error: null,
    status: 'connecting',
  }
}

// @knip
export function reduceConnected(state: RiftStoreState): RiftStoreState {
  return {
    ...state,
    error: null,
    status: 'connected',
  }
}

export function reduceSetError(state: RiftStoreState, error: string | Error | null): RiftStoreState {
  return {
    ...state,
    error: normalizeError(error),
    status: error === null ? state.status : 'error',
  }
}

export const useRiftStore = create<RiftStore>()((set) => ({
  ...createInitialRiftStoreState(),
  connect(code) {
    set((state) => {
      const nextState = reduceConnect(state, code)
      if (nextState.status === 'connecting') {
        useSessionStore.getState().setConnectionCode(nextState.code)
      }
      return nextState
    })
  },
  disconnect() {
    useSessionStore.getState().logout()
    set((state) => reduceDisconnect(state))
  },
  reconnect() {
    set((state) => {
      const nextState = reduceReconnect(state)
      if (nextState.status === 'connecting') {
        useSessionStore.getState().setConnectionCode(nextState.code)
      }
      return nextState
    })
  },
  setConnected() {
    set((state) => reduceConnected(state))
  },
  setError(error) {
    set((state) => reduceSetError(state, error))
  },
}))
