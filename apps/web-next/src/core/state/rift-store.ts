import { create } from 'zustand'

const CONNECTION_CODE_KEY = 'conduitID'
const SESSION_CODE_KEY = 'mimicSessionCode'
const RETURN_URL_KEY = 'mimicReturnUrl'

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

const initialCode = readPersistedConnectionCode()

// @knip
export const initialRiftStoreState: RiftStoreState = {
  code: initialCode,
  error: null,
  status: initialCode.length > 0 ? 'disconnected' : 'idle',
}

function hasStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined' && typeof window.sessionStorage !== 'undefined'
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

export function readPersistedConnectionCode(): string {
  if (!hasStorage()) {
    return ''
  }

  const sessionCode = window.sessionStorage.getItem(SESSION_CODE_KEY)
  if (sessionCode && sessionCode.length > 0) {
    return sessionCode
  }

  const storedCode = window.localStorage.getItem(CONNECTION_CODE_KEY)
  return storedCode ?? ''
}

// @knip
export function persistConnectionCode(code: string): void {
  if (!hasStorage()) {
    return
  }

  window.localStorage.setItem(CONNECTION_CODE_KEY, code)
  window.sessionStorage.setItem(SESSION_CODE_KEY, code)
}

export function clearPersistedConnectionCode(): void {
  if (!hasStorage()) {
    return
  }

  window.localStorage.removeItem(CONNECTION_CODE_KEY)
  window.sessionStorage.removeItem(SESSION_CODE_KEY)
}

export function persistReturnUrl(returnUrl: string): void {
  if (!hasStorage()) {
    return
  }

  window.sessionStorage.setItem(RETURN_URL_KEY, returnUrl)
}

export function readPersistedReturnUrl(): string | null {
  if (!hasStorage()) {
    return null
  }

  return window.sessionStorage.getItem(RETURN_URL_KEY)
}

export function clearPersistedReturnUrl(): void {
  if (!hasStorage()) {
    return
  }

  window.sessionStorage.removeItem(RETURN_URL_KEY)
}

export function createInitialRiftStoreState(): RiftStoreState {
  return {
    ...initialRiftStoreState,
    code: readPersistedConnectionCode(),
    status: readPersistedConnectionCode().length > 0 ? 'disconnected' : 'idle',
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

  persistConnectionCode(nextCode)

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
  const nextCode = normalizeCode(state.code || readPersistedConnectionCode())

  if (nextCode.length === 0) {
    return {
      ...state,
      error: 'Connection code is required.',
      status: 'error',
    }
  }

  persistConnectionCode(nextCode)

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
    set((state) => reduceConnect(state, code))
  },
  disconnect() {
    set((state) => reduceDisconnect(state))
  },
  reconnect() {
    set((state) => reduceReconnect(state))
  },
  setConnected() {
    set((state) => reduceConnected(state))
  },
  setError(error) {
    set((state) => reduceSetError(state, error))
  },
}))
