import React, { act } from 'react'

import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useLobbyGracePeriod } from './use-lobby-support'

let container: HTMLDivElement | null = null
let root: ReturnType<typeof createRoot> | null = null
let result: boolean | null = null

interface TestHarnessProps {
  isSearching: boolean
}

function TestHarness({ isSearching }: TestHarnessProps) {
  result = useLobbyGracePeriod(isSearching)

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

function requireResult(): boolean {
  if (result === null) {
    throw new Error('useLobbyGracePeriod did not render')
  }

  return result
}

describe('useLobbyGracePeriod', () => {
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
    vi.useRealTimers()
  })

  it('stays inactive while searching', () => {
    renderHook({ isSearching: true })

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(requireResult()).toBe(false)
  })

  it('activates when the search stops and expires after the grace period', () => {
    renderHook({ isSearching: true })

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    renderHook({ isSearching: false })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(requireResult()).toBe(true)

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(requireResult()).toBe(false)
  })

  it('activates on the very render where the search stops', () => {
    renderHook({ isSearching: true })

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    renderHook({ isSearching: false })

    expect(requireResult()).toBe(true)
  })

  it('deactivates on the very render where the search resumes mid-grace', () => {
    renderHook({ isSearching: true })
    renderHook({ isSearching: false })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(requireResult()).toBe(true)

    renderHook({ isSearching: true })

    expect(requireResult()).toBe(false)
  })


  it('does not activate when never searching', () => {
    renderHook({ isSearching: false })

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(requireResult()).toBe(false)
  })
})
