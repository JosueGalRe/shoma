import { expect, test } from 'vitest'

import { createQueuePopFeedbackTracker, playQueuePopSound, triggerQueuePopVibration } from './queue-pop-feedback-utils'

test('playQueuePopSound ignores missing Audio and rejected playback', async () => {
  const originalAudio = globalThis.Audio

  try {
    Object.defineProperty(globalThis, 'Audio', {
      configurable: true,
      value: undefined,
      writable: true,
    })

    await expect(playQueuePopSound()).resolves.toBeUndefined()

    let playCalls = 0

    class RejectedAudio {
      constructor(_src: string) {}

      play(): Promise<void> {
        playCalls += 1
        return Promise.reject(new Error('blocked'))
      }
    }

    Object.defineProperty(globalThis, 'Audio', {
      configurable: true,
      value: RejectedAudio,
      writable: true,
    })

    await expect(playQueuePopSound()).resolves.toBeUndefined()
    expect(playCalls).toBe(1)
  } finally {
    Object.defineProperty(globalThis, 'Audio', {
      configurable: true,
      value: originalAudio,
      writable: true,
    })
  }
})

test('triggerQueuePopVibration ignores missing vibration APIs', () => {
  const originalNavigator = globalThis.navigator

  try {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {},
      writable: true,
    })

    expect(() => { return triggerQueuePopVibration(); }).not.toThrow()
  } finally {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: originalNavigator,
      writable: true,
    })
  }
})

test('queue pop feedback tracker triggers once per Matchmaking to ReadyCheck transition', async () => {
  const originalAudio = globalThis.Audio
  const originalNavigator = globalThis.navigator
  const vibrationCalls: number[][] = []
  let playCalls = 0

  class PlaybackAudio {
    constructor(_src: string) {}

    play(): Promise<void> {
      playCalls += 1
      return Promise.resolve()
    }
  }

  const vibrate = (pattern: number | number[]): boolean => {
    vibrationCalls.push(Array.isArray(pattern) ? pattern : [pattern])
    return true
  }

  try {
    Object.defineProperty(globalThis, 'Audio', {
      configurable: true,
      value: PlaybackAudio,
      writable: true,
    })

    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { vibrate },
      writable: true,
    })

    const tracker = createQueuePopFeedbackTracker()

    tracker.handlePhase('Matchmaking')
    tracker.handlePhase('Matchmaking')
    tracker.handlePhase('ReadyCheck')
    tracker.handlePhase('ReadyCheck')
    tracker.handlePhase('Matchmaking')
    tracker.handlePhase('ReadyCheck')

    expect(playCalls).toBe(2)
    expect(vibrationCalls).toEqual([
      [500, 250, 500, 250, 500, 250, 500, 250],
      [500, 250, 500, 250, 500, 250, 500, 250],
    ])
  } finally {
    Object.defineProperty(globalThis, 'Audio', {
      configurable: true,
      value: originalAudio,
      writable: true,
    })

    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: originalNavigator,
      writable: true,
    })
  }
})
