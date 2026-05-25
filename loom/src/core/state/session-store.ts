import { useSyncExternalStore } from 'react'

import {
  createPersistedStore,
  hasLocalStorage,
  hasSessionStorage,
  readLegacyLocalStorageValue,
  readLegacySessionStorageValue,
} from './create-persisted-store'

const LEGACY_DEVICE_ID_KEY = 'deviceID'
const LEGACY_CONNECTION_CODE_KEY = 'conduitID'
const LEGACY_SESSION_CODE_KEY = 'mimicSessionCode'
const LEGACY_RETURN_URL_KEY = 'mimicReturnUrl'

export interface SessionStoreState {
  deviceId: string
  connectionCode: string
  sessionCode: string
  returnUrl: string
}

export interface SessionStoreActions {
  setDeviceId: (deviceId: string) => void
  setConnectionCode: (connectionCode: string) => void
  setSessionCode: (sessionCode: string) => void
  setReturnUrl: (returnUrl: string) => void
  logout: () => void
}

export type SessionStore = SessionStoreState & SessionStoreActions

type ConnectionSessionStore = Pick<SessionStoreState, 'connectionCode' | 'deviceId'> &
  Pick<SessionStoreActions, 'setConnectionCode' | 'setDeviceId'>

type RuntimeSessionStore = Pick<SessionStoreState, 'returnUrl' | 'sessionCode'> &
  Pick<SessionStoreActions, 'logout' | 'setReturnUrl' | 'setSessionCode'>

interface SessionStoreHook {
  (): SessionStore
  <T>(selector: (state: SessionStore) => T): T
  getState: () => SessionStore
  subscribe: (listener: (state: SessionStore, previousState: SessionStore) => void) => () => void
}

type SessionStoreListener = (state: SessionStore, previousState: SessionStore) => void

function createDeviceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16)
    const value = character === 'x' ? random : (random & 0x3) | 0x8

    return value.toString(16)
  })
}

function migrateConnectionSessionStore(persistedState: unknown): Pick<ConnectionSessionStore, 'connectionCode' | 'deviceId'> {
  const state = isRecord(persistedState) ? persistedState : undefined

  return {
    connectionCode:
      typeof state?.connectionCode === 'string'
        ? state.connectionCode
        : (readLegacyLocalStorageValue(LEGACY_CONNECTION_CODE_KEY) ?? ''),
    deviceId:
      typeof state?.deviceId === 'string'
        ? state.deviceId
        : (readLegacyLocalStorageValue(LEGACY_DEVICE_ID_KEY) ?? createDeviceId()),
  }
}

function migrateRuntimeSessionStore(persistedState: unknown): Pick<RuntimeSessionStore, 'returnUrl' | 'sessionCode'> {
  const state = isRecord(persistedState) ? persistedState : undefined

  return {
    returnUrl:
      typeof state?.returnUrl === 'string' ? state.returnUrl : (readLegacySessionStorageValue(LEGACY_RETURN_URL_KEY) ?? ''),
    sessionCode:
      typeof state?.sessionCode === 'string'
        ? state.sessionCode
        : (readLegacySessionStorageValue(LEGACY_SESSION_CODE_KEY) ?? ''),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

const useConnectionSessionStore = createPersistedStore<ConnectionSessionStore>(
  (set) => {
    return {
      connectionCode: '',
      deviceId: createDeviceId(),
      setConnectionCode(connectionCode) {
        set({ connectionCode })
      },
      setDeviceId(deviceId) {
        set({ deviceId })
      },
    }
  },
  {
    migrate: migrateConnectionSessionStore,
    name: 'shoma:connection',
    partialize: ({ connectionCode, deviceId }) => {
      return { connectionCode, deviceId }
    },
    storage: 'localStorage',
    version: 1,
  },
)

if (hasLocalStorage()) {
  const { connectionCode, deviceId } = useConnectionSessionStore.getState()

  useConnectionSessionStore.setState({ connectionCode, deviceId })
}

const useRuntimeSessionStore = createPersistedStore<RuntimeSessionStore>(
  (set) => {
    return {
      logout() {
        set({ returnUrl: '', sessionCode: '' })
        useConnectionSessionStore.setState({ connectionCode: '' })
      },
      returnUrl: '',
      sessionCode: '',
      setReturnUrl(returnUrl) {
        set({ returnUrl })
      },
      setSessionCode(sessionCode) {
        set({ sessionCode })
      },
    }
  },
  {
    migrate: migrateRuntimeSessionStore,
    name: 'shoma:session',
    partialize: ({ returnUrl, sessionCode }) => {
      return { returnUrl, sessionCode }
    },
    storage: 'sessionStorage',
    version: 1,
  },
)

if (hasSessionStorage()) {
  const { returnUrl, sessionCode } = useRuntimeSessionStore.getState()

  useRuntimeSessionStore.setState({ returnUrl, sessionCode })
}

function createSessionStoreState(): SessionStore {
  return {
    ...useConnectionSessionStore.getState(),
    ...useRuntimeSessionStore.getState(),
  }
}

function areSessionStoreStatesEqual(left: SessionStore, right: SessionStore): boolean {
  return (
    left.connectionCode === right.connectionCode &&
    left.deviceId === right.deviceId &&
    left.returnUrl === right.returnUrl &&
    left.sessionCode === right.sessionCode &&
    left.logout === right.logout &&
    left.setConnectionCode === right.setConnectionCode &&
    left.setDeviceId === right.setDeviceId &&
    left.setReturnUrl === right.setReturnUrl &&
    left.setSessionCode === right.setSessionCode
  )
}

let cachedSessionStoreState = createSessionStoreState()
const sessionStoreListeners = new Set<SessionStoreListener>()

function refreshSessionStoreState(): { nextState: SessionStore; previousState: SessionStore } | null {
  const previousState = cachedSessionStoreState
  const nextState = createSessionStoreState()

  if (areSessionStoreStatesEqual(previousState, nextState)) {
    return null
  }

  cachedSessionStoreState = nextState

  return { nextState, previousState }
}

function getSessionStoreState(): SessionStore {
  return cachedSessionStoreState
}

function emitSessionStoreChange() {
  const change = refreshSessionStoreState()

  if (!change) {
    return
  }

  for (const listener of sessionStoreListeners) {
    listener(change.nextState, change.previousState)
  }
}

useConnectionSessionStore.subscribe(emitSessionStoreChange)
useRuntimeSessionStore.subscribe(emitSessionStoreChange)

function subscribeSessionStore(listener: SessionStoreListener): () => void {
  sessionStoreListeners.add(listener)

  return () => {
    sessionStoreListeners.delete(listener)
  }
}

export const useSessionStore: SessionStoreHook = Object.assign(
  <T>(selector?: (state: SessionStore) => T) => {
    const state = useSyncExternalStore(subscribeSessionStore, getSessionStoreState, getSessionStoreState)

    return selector ? selector(state) : state
  },
  {
    getState: getSessionStoreState,
    subscribe: subscribeSessionStore,
  },
)
