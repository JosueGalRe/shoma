import { afterEach, describe, expect, test, vi } from 'vitest'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'

import { mapModeToIcon, useReliableTimer } from './in-game-screen-utils'

let container: HTMLDivElement | null = null
let root: ReturnType<typeof createRoot> | null = null
let currentTimer: string | undefined

function cleanupHarness() {
  act(() => {
    root?.unmount()
  })

  root = null
  container?.remove()
  container = null
}

describe('in-game-screen-utils', () => {
  afterEach(() => {
    cleanupHarness()
    vi.useRealTimers()
  })

  test('maps queue modes to the expected icons', () => {
    expect(mapModeToIcon('aram')).toContain('/aram/img/game-select-icon-default.png')
    expect(mapModeToIcon('ranked-solo-duo')).toContain('/classic_sru/img/game-select-icon-default.png')
  })

  test('ticks the reliable timer every second', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:03.000Z'))
    const startTime = Date.now() - 2_000

    function TestComponent() {
      currentTimer = useReliableTimer(startTime)
      return null
    }

    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)

    act(() => {
      root?.render(React.createElement(TestComponent))
    })

    expect(currentTimer).toBe('00:02')

    act(() => {
      vi.advanceTimersByTime(1_000)
    })

    expect(currentTimer).toBe('00:03')
  })
})
