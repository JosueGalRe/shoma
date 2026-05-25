export interface QueuePopFeedbackTracker {
  handlePhase: (phase: string | null) => void
  reset: () => void
}
