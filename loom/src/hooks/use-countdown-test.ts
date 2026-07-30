import React, { act } from 'react'

import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useCountdown } from './use-countdown'

import type { UseCountdownResult } from './use-countdown-types'

let container: HTMLDivElement | null = null
let root: ReturnType<typeof createRoot> | null = null
let result: UseCountdownResult | null = null
let observedRemaining: number[] = []

interface TestHarnessProps {
  onExpire?: () => void
  seconds: number
}

function TestHarness({ onExpire, seconds }: TestHarnessProps) {
  result = useCountdown(seconds, onExpire)
  observedRemaining.push(result.remaining)

  return null
}

function renderHook(props: TestHarnessProps): void {
  if (!container) {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  }

  act(() => {
    root?.render(React.createElement(TestHarness, props))
  })
}

function requireResult(): UseCountdownResult {
  if (!result) {
    throw new Error('useCountdown did not render')
  }

  return result
}

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    act(() => {
      root?.unmount()
    })

    root = null
    container?.remove()
    container = null
    result = null
    observedRemaining = []
    vi.useRealTimers()
  })

  it('counts down every second', () => {
    renderHook({ seconds: 5 })

    expect(requireResult().remaining).toBe(5)
    expect(requireResult().isActive).toBe(true)

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(requireResult().remaining).toBe(3)
    expect(requireResult().elapsed).toBe(2)
  })

  it('calls the latest onExpire callback when reaching zero', () => {
    const firstExpire = vi.fn()
    const secondExpire = vi.fn()

    renderHook({ onExpire: firstExpire, seconds: 2 })
    renderHook({ onExpire: secondExpire, seconds: 2 })

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(firstExpire).not.toHaveBeenCalled()
    expect(secondExpire).toHaveBeenCalledTimes(1)
    expect(requireResult().isActive).toBe(false)
  })

  it('resets the countdown when initialSeconds changes', () => {
    renderHook({ seconds: 5 })

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(requireResult().remaining).toBe(3)

    renderHook({ seconds: 10 })

    expect(requireResult().remaining).toBe(10)
    expect(requireResult().isActive).toBe(true)
  })

  it('never renders a stale remaining value when initialSeconds changes', () => {
    renderHook({ seconds: 5 })

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(requireResult().remaining).toBe(3)

    const rendersBeforeChange = observedRemaining.length

    renderHook({ seconds: 10 })

    const rendersAfterChange = observedRemaining.slice(rendersBeforeChange)

    expect(rendersAfterChange.length).toBeGreaterThan(0)
    expect(rendersAfterChange).not.toContain(3)
    expect(rendersAfterChange).not.toContain(5)
  })


  it('stops counting when stop is called', () => {
    renderHook({ seconds: 5 })

    act(() => {
      requireResult().stop()
    })

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(requireResult().remaining).toBe(5)
  })
})
