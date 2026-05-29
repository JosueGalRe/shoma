export type ConnectionDimensionState = 'waiting' | 'connecting' | 'connected' | 'paired'
export type ConduitErrorCode = 'lcu_unavailable' | 'relay_unreachable' | 'registration_failed' | 'server_error'

export interface ConduitState {
  relay: ConnectionDimensionState
  lcu: ConnectionDimensionState
  error: ConduitErrorCode | null
  reconnect_attempt: number
}

export interface AppState {
  connection: ConduitState
  accessCode: string | null
  showSettings: boolean
  isGeneratingCode: boolean
  copied: boolean
}

export type AppAction =
  | { type: 'INITIALIZE'; payload: Partial<AppState> }
  | { type: 'SET_CONNECTION'; payload: ConduitState }
  | { type: 'SET_ACCESS_CODE'; payload: string | null }
  | { type: 'SET_SHOW_SETTINGS'; payload: boolean }
  | { type: 'SET_GENERATING'; payload: boolean }
  | { type: 'SET_COPIED'; payload: boolean }

export interface ConnectionStateChanged {
  state: ConduitState
}

export interface UpdateInfo {
  version: string
  date: string | null
  notes: string | null
}

export interface DeviceApprovalRequest {
  approvalId: string
  device: string
  browser: string
}

export interface DeviceEntry {
  identity: string
  device: string
  browser: string
  last_connected: number
}
