export type ReadyCheckStatus = 'pending' | 'accepted' | 'declined' | 'expired'

export interface ReadyCheckStoreState {
  status: ReadyCheckStatus
  timer: number
}

export interface ReadyCheckStoreActions {
  accept: () => void
  decline: () => void
  expire: () => void
  reset: () => void
  setTimer: (timer: number) => void
}

export type ReadyCheckStore = ReadyCheckStoreState & ReadyCheckStoreActions

export interface UseReadyCheckResult {
  accept: () => Promise<boolean>
  decline: () => Promise<boolean>
  // Since the match popped, as the LCU reports it
  elapsedSeconds: number
  isResponding: boolean
  status: ReadyCheckStatus
  timer: number
}
