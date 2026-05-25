export interface UseCountdownResult {
  elapsed: number
  isActive: boolean
  remaining: number
  reset: (seconds?: number) => void
  start: (seconds?: number) => void
  stop: () => void
}
