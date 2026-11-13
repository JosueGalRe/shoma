import { act } from 'react'

import { Stepper } from '@shoma/ui/stepper'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'

let root: ReturnType<typeof createRoot> | null = null

afterEach(() => {
  act(() => {
    root?.unmount()
  })
  root = null
  document.body.replaceChildren()
})

describe('@shoma/ui Stepper', () => {
  it('reports the current step as a progress bar', () => {
    const container = document.createElement('div')

    document.body.append(container)
    root = createRoot(container)
    act(() => {
      root?.render(<Stepper aria-label="Create lobby" aria-valuetext="Step 2 of 3" step={2} />)
    })

    const bar = container.querySelector('[role="progressbar"]')

    expect(bar?.getAttribute('aria-label')).toBe('Create lobby')
    expect(bar?.getAttribute('aria-valuenow')).toBe('2')
    expect(bar?.getAttribute('aria-valuemax')).toBe('3')
    expect(bar?.getAttribute('aria-valuetext')).toBe('Step 2 of 3')
  })
})
