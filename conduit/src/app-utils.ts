import type {
  AppAction,
  AppState,
  ConduitErrorCode,
  ConduitState,
  ConnectionDimensionState,
  ConnectionStateChanged,
} from './app-types'
import type { TranslationKey } from './hooks/use-i18n-types'

export const defaultConduitState: ConduitState = {
  error: null,
  lcu: 'waiting',
  reconnect_attempt: 0,
  relay: 'waiting',
}

export const initialAppState: AppState = {
  accessCode: null,
  connection: defaultConduitState,
  copied: false,
  isGeneratingCode: false,
  showSettings: false,
}

export const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'INITIALIZE': {
      return { ...state, ...action.payload }
    }
    case 'SET_CONNECTION': {
      return { ...state, connection: action.payload }
    }
    case 'SET_ACCESS_CODE': {
      return { ...state, accessCode: action.payload }
    }
    case 'SET_SHOW_SETTINGS': {
      return { ...state, showSettings: action.payload }
    }
    case 'SET_GENERATING': {
      return { ...state, isGeneratingCode: action.payload }
    }
    case 'SET_COPIED': {
      return { ...state, copied: action.payload }
    }
    default: {
      return state
    }
  }
}

export const stateFromConnectionEvent = (event: ConnectionStateChanged): ConduitState => {
  return event.state
}

export const statusColor = (status: ConnectionDimensionState, hasError: boolean) => {
  if (hasError) {
    return 'var(--status-error)'
  }

  switch (status) {
    case 'waiting': {
      return 'var(--status-waiting)'
    }
    case 'connecting': {
      return 'var(--status-starting)'
    }
    case 'connected': {
      return 'var(--status-connected)'
    }
    case 'paired': {
      return 'var(--status-paired)'
    }
    default: {
      return 'var(--status-waiting)'
    }
  }
}

export const statusTextKey = (status: ConnectionDimensionState): TranslationKey => {
  switch (status) {
    case 'waiting': {
      return 'status.waiting'
    }
    case 'connecting': {
      return 'status.connecting'
    }
    case 'connected': {
      return 'status.connected'
    }
    case 'paired': {
      return 'status.paired'
    }
    default: {
      return 'status.waiting'
    }
  }
}

export const errorTextKey = (error: ConduitErrorCode): TranslationKey => {
  switch (error) {
    case 'lcu_unavailable': {
      return 'error.lcuUnavailable'
    }
    case 'relay_unreachable': {
      return 'error.relayUnreachable'
    }
    case 'registration_failed': {
      return 'error.registrationFailed'
    }
    case 'server_error': {
      return 'error.serverError'
    }
    default: {
      return 'error.serverError'
    }
  }
}
