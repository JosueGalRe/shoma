import { useEffect, useRef } from 'react'

import { createQueuePopFeedbackTracker } from './queue-pop-feedback-utils'

export { createQueuePopFeedbackTracker, playQueuePopSound, triggerQueuePopVibration } from './queue-pop-feedback-utils'

export function useQueuePopFeedback(phase: string | null): void {
  const tracker = useRef(createQueuePopFeedbackTracker())

  useEffect(() => {
    tracker.current.handlePhase(phase)
  }, [phase])
}
