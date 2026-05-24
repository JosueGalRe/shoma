export type QueuePopFeedbackTracker = {
  handlePhase: (phase: string | null) => void
  reset: () => void
}
