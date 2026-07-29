import { useEffect, useRef } from 'react'

import { createQueuePopFeedbackTracker } from './queue-pop-feedback-utils'

export { createQueuePopFeedbackTracker, playQueuePopSound, triggerQueuePopVibration } from './queue-pop-feedback-utils'

export function useQueuePopFeedback(phase: string | null): void {
  const trackerRef = useRef<ReturnType<typeof createQueuePopFeedbackTracker> | null>(null)

  const tracker = (trackerRef.current ??= createQueuePopFeedbackTracker())

  useEffect(() => {
    tracker.handlePhase(phase)
  }, [phase, tracker])
}
