import { create } from 'zustand'

import { useSessionStore } from './session-store'

// Lost: the session dropped but stays, and its client tries again until Conduit is back
const relayStatuses = ['idle', 'connecting', 'connected', 'lost', 'disconnected', 'error'] as const

export type RelayStatus = (typeof relayStatuses)[number]

// Client-closed: Conduit said the League client closed before it left; pc: the relay just dropped. The last one stays
// After reconnecting, so the modal's text holds while it fades out
export type RelayLostReason = 'client-closed' | 'pc'

export interface RelayStoreState {
  status: RelayStatus
  code: string
  error: string | null
  lostReason: RelayLostReason | null
}

interface RelayStoreActions {
  connect: (code: string) => void
  disconnect: () => void
  lose: (reason: RelayLostReason) => void
  reconnect: () => void
  setConnected: () => void
  setError: (error: string | Error | null) => void
}

export type RelayStore = RelayStoreState & RelayStoreActions

type RelayStoreSelector<T> = (state: RelayStore) => T

function selectRelayCode(state: RelayStore): string {
  return state.code
}

export function selectRelayConnect(state: RelayStore): RelayStoreActions['connect'] {
  return state.connect
}

export function selectRelayDisconnect(state: RelayStore): RelayStoreActions['disconnect'] {
  return state.disconnect
}

export function selectRelayError(state: RelayStore): string | null {
  return state.error
}

export function selectRelayLose(state: RelayStore): RelayStoreActions['lose'] {
  return state.lose
}

export function selectRelayLostReason(state: RelayStore): RelayLostReason | null {
  return state.lostReason
}

export function selectRelaySetConnected(state: RelayStore): RelayStoreActions['setConnected'] {
  return state.setConnected
}

export function selectRelaySetError(state: RelayStore): RelayStoreActions['setError'] {
  return state.setError
}

export function selectRelayStatus(state: RelayStore): RelayStatus {
  return state.status
}

export const relayStoreSelectors = {
  code: selectRelayCode,
  connect: selectRelayConnect,
  disconnect: selectRelayDisconnect,
  error: selectRelayError,
  lose: selectRelayLose,
  lostReason: selectRelayLostReason,
  setConnected: selectRelaySetConnected,
  setError: selectRelaySetError,
  status: selectRelayStatus,
} satisfies Record<string, RelayStoreSelector<unknown>>

function readConnectionCode(): string {
  return useSessionStore.getState().connectionCode
}

const initialCode = readConnectionCode()

const initialRelayStoreState: RelayStoreState = {
  code: initialCode,
  error: null,
  lostReason: null,
  status: 'idle',
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
    status: code.length > 0 ? 'connecting' : 'idle',
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
    lostReason: null,
    status: 'connecting',
  }
}

// A failed attempt disconnects more than once, so a repeat disconnect keeps the error too
export function reduceDisconnect(state: RelayStoreState): RelayStoreState {
  return {
    ...state,
    error: state.status === 'error' || state.status === 'disconnected' ? state.error : null,
    lostReason: null,
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
    lostReason: null,
    status: 'connecting',
  }
}

function reduceConnected(state: RelayStoreState): RelayStoreState {
  return {
    ...state,
    error: null,
    status: 'connected',
  }
}

export function reduceLose(state: RelayStoreState, reason: RelayLostReason): RelayStoreState {
  return {
    ...state,
    lostReason: reason,
    status: 'lost',
  }
}

export function reduceSetError(state: RelayStoreState, error: string | Error | null): RelayStoreState {
  return {
    ...state,
    error: normalizeError(error),
    status: error === null ? state.status : 'error',
  }
}

export const useRelayStore = create<RelayStore>()((set) => {
  return {
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

      set((state) => {
        return reduceDisconnect(state)
      })
    },
    lose(reason) {
      set((state) => {
        return reduceLose(state, reason)
      })
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
      set((state) => {
        return reduceConnected(state)
      })
    },
    setError(error) {
      set((state) => {
        return reduceSetError(state, error)
      })
    },
  }
})
