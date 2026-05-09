import { useSyncExternalStore } from 'react'

import { createPersistedStore } from './create-persisted-store'

const LEGACY_DEVICE_ID_KEY = 'deviceID'
const LEGACY_CONNECTION_CODE_KEY = 'conduitID'
const LEGACY_SESSION_CODE_KEY = 'mimicSessionCode'
const LEGACY_RETURN_URL_KEY = 'mimicReturnUrl'

export type SessionStoreState = {
  deviceId: string
  connectionCode: string
  sessionCode: string
  returnUrl: string
}

export type SessionStoreActions = {
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

type SessionStoreHook = {
  (): SessionStore
  <T>(selector: (state: SessionStore) => T): T
  getState: () => SessionStore
  subscribe: (
    listener: (state: SessionStore, previousState: SessionStore) => void,
  ) => () => void
}

function hasLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function hasSessionStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

function readLocalStorage(key: string): string | null {
  return hasLocalStorage() ? window.localStorage.getItem(key) : null
}

function readSessionStorage(key: string): string | null {
  return hasSessionStorage() ? window.sessionStorage.getItem(key) : null
}

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

function readInitialDeviceId(): string {
  return readLocalStorage(LEGACY_DEVICE_ID_KEY) ?? createDeviceId()
}

const useConnectionSessionStore = createPersistedStore<ConnectionSessionStore>(
  (set) => ({
    connectionCode: readLocalStorage(LEGACY_CONNECTION_CODE_KEY) ?? '',
    deviceId: readInitialDeviceId(),
    setConnectionCode(connectionCode) {
      set({ connectionCode })
    },
    setDeviceId(deviceId) {
      set({ deviceId })
    },
  }),
  {
    name: 'mimic:connection',
    partialize: ({ connectionCode, deviceId }) => ({ connectionCode, deviceId }),
    storage: 'localStorage',
    version: 1,
  },
)

if (hasLocalStorage()) {
  const { connectionCode, deviceId } = useConnectionSessionStore.getState()
  useConnectionSessionStore.setState({ connectionCode, deviceId })
}

const useRuntimeSessionStore = createPersistedStore<RuntimeSessionStore>(
  (set) => ({
    returnUrl: readSessionStorage(LEGACY_RETURN_URL_KEY) ?? '',
    sessionCode: readSessionStorage(LEGACY_SESSION_CODE_KEY) ?? '',
    logout() {
      set({ returnUrl: '', sessionCode: '' })
    },
    setReturnUrl(returnUrl) {
      set({ returnUrl })
    },
    setSessionCode(sessionCode) {
      set({ sessionCode })
    },
  }),
  {
    name: 'mimic:session',
    partialize: ({ returnUrl, sessionCode }) => ({ returnUrl, sessionCode }),
    storage: 'sessionStorage',
    version: 1,
  },
)

if (hasSessionStorage()) {
  const { returnUrl, sessionCode } = useRuntimeSessionStore.getState()
  useRuntimeSessionStore.setState({ returnUrl, sessionCode })
}

function getSessionStoreState(): SessionStore {
  return {
    ...useConnectionSessionStore.getState(),
    ...useRuntimeSessionStore.getState(),
  }
}

function subscribeSessionStore(
  listener: (state: SessionStore, previousState: SessionStore) => void,
): () => void {
  let previousState = getSessionStoreState()

  const notify = () => {
    const nextState = getSessionStoreState()
    listener(nextState, previousState)
    previousState = nextState
  }

  const unsubscribeConnection = useConnectionSessionStore.subscribe(notify)
  const unsubscribeRuntime = useRuntimeSessionStore.subscribe(notify)

  return () => {
    unsubscribeConnection()
    unsubscribeRuntime()
  }
}

export const useSessionStore: SessionStoreHook = Object.assign(
  <T>(selector?: (state: SessionStore) => T) => {
    const state = useSyncExternalStore(
      subscribeSessionStore,
      getSessionStoreState,
      getSessionStoreState,
    )
    return selector ? selector(state) : state
  },
  {
    getState: getSessionStoreState,
    subscribe: subscribeSessionStore,
  },
)
