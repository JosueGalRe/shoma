export type ReadyCheckStatus = 'pending' | 'accepted' | 'declined' | 'expired'

export type PremadeReadyCheckMember = {
  displayName: string
  status: 'pending' | 'accepted' | 'declined'
  summonerId: number
  iconUrl?: string
}

export type PremadeReadyCheckState = {
  isActive: boolean
  members: PremadeReadyCheckMember[]
}

export type ReadyCheckStoreState = {
  status: ReadyCheckStatus
  timer: number
  premade: PremadeReadyCheckState
}

export type ReadyCheckStoreActions = {
  accept: () => void
  decline: () => void
  expire: () => void
  reset: () => void
  setTimer: (timer: number) => void
  setPremadeReadyCheck: (data: PremadeReadyCheckState) => void
}

export type ReadyCheckStore = ReadyCheckStoreState & ReadyCheckStoreActions

export type UseReadyCheckResult = {
  accept: () => Promise<boolean>
  decline: () => Promise<boolean>
  error: Error | null
  isLoading: boolean
  status: ReadyCheckStatus
  timer: number
}
