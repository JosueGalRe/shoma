import { useEffect, useRef } from 'react'

import { createQueuePopFeedbackTracker } from './queue-pop-feedback-utils'

export { createQueuePopFeedbackTracker, playQueuePopSound, triggerQueuePopVibration } from './queue-pop-feedback-utils'

export function useQueuePopFeedback(phase: string | null): void {
  const trackerRef = useRef<ReturnType<typeof createQueuePopFeedbackTracker> | null>(null)

  trackerRef.current ??= createQueuePopFeedbackTracker()

  const tracker = trackerRef.current

  useEffect(() => {
    tracker.handlePhase(phase)
  }, [phase, tracker])
}
