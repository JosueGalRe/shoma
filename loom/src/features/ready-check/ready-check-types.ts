export type ReadyCheckStatus = 'pending' | 'accepted' | 'declined' | 'expired'

export interface PremadeReadyCheckMember {
  displayName: string
  status: 'pending' | 'accepted' | 'declined'
  summonerId: number
  iconUrl?: string
}

export interface PremadeReadyCheckState {
  isActive: boolean
  members: PremadeReadyCheckMember[]
}

export interface ReadyCheckStoreState {
  status: ReadyCheckStatus
  timer: number
  premade: PremadeReadyCheckState
}

export interface ReadyCheckStoreActions {
  accept: () => void
  decline: () => void
  expire: () => void
  reset: () => void
  setTimer: (timer: number) => void
  setPremadeReadyCheck: (data: PremadeReadyCheckState) => void
}

export type ReadyCheckStore = ReadyCheckStoreState & ReadyCheckStoreActions

export interface UseReadyCheckResult {
  accept: () => Promise<boolean>
  decline: () => Promise<boolean>
  error: Error | null
  isLoading: boolean
  status: ReadyCheckStatus
  timer: number
}
