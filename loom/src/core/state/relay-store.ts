import { create } from 'zustand'

import { useSessionStore } from './session-store'

// @knip
export const relayStatuses = ['idle', 'connecting', 'connected', 'disconnected', 'error'] as const
// @knip
export type RelayStatus = (typeof relayStatuses)[number]

export type RelayStoreState = {
  status: RelayStatus
  code: string
  error: string | null
}

// @knip
export type RelayStoreActions = {
  connect: (code: string) => void
  disconnect: () => void
  reconnect: () => void
  setConnected: () => void
  setError: (error: string | Error | null) => void
}

export type RelayStore = RelayStoreState & RelayStoreActions

type RelayStoreSelector<T> = (state: RelayStore) => T

// @knip
export const relayStoreSelectors = {
  code: (state: RelayStore) => state.code,
  connect: (state: RelayStore) => state.connect,
  disconnect: (state: RelayStore) => state.disconnect,
  error: (state: RelayStore) => state.error,
  setConnected: (state: RelayStore) => state.setConnected,
  setError: (state: RelayStore) => state.setError,
  status: (state: RelayStore) => state.status,
} satisfies Record<string, RelayStoreSelector<unknown>>

function readConnectionCode(): string {
  return useSessionStore.getState().connectionCode
}

const initialCode = readConnectionCode()

// @knip
export const initialRelayStoreState: RelayStoreState = {
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

export function createInitialRelayStoreState(): RelayStoreState {
  const code = readConnectionCode()

  return {
    ...initialRelayStoreState,
    code,
    status: code.length > 0 ? 'disconnected' : 'idle',
  }
}

export function reduceConnect(state: RelayStoreState, code: string): RelayStoreState {
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

export function reduceDisconnect(state: RelayStoreState): RelayStoreState {
  return {
    ...state,
    error: state.status === 'error' ? state.error : null,
    status: 'disconnected',
  }
}

export function reduceReconnect(state: RelayStoreState): RelayStoreState {
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
export function reduceConnected(state: RelayStoreState): RelayStoreState {
  return {
    ...state,
    error: null,
    status: 'connected',
  }
}

export function reduceSetError(state: RelayStoreState, error: string | Error | null): RelayStoreState {
  return {
    ...state,
    error: normalizeError(error),
    status: error === null ? state.status : 'error',
  }
}

export const useRelayStore = create<RelayStore>()((set) => ({
  ...createInitialRelayStoreState(),
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
