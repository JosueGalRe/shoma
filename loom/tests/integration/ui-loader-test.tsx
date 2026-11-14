import { act } from 'react'

import { Loader } from '@shoma/ui/loader'
import { ScreenBackground } from '@shoma/ui/screen-background'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'

import type { ReactNode } from 'react'

let root: ReturnType<typeof createRoot> | null = null

function render(element: ReactNode) {
  const container = document.createElement('div')

  document.body.append(container)
  root = createRoot(container)
  act(() => {
    root?.render(element)
  })

  return container
}

afterEach(() => {
  act(() => {
    root?.unmount()
  })
  root = null
  document.body.replaceChildren()
})

describe('@shoma/ui Loader and ScreenBackground', () => {
  it('names the loader for screen readers', () => {
    const container = render(<Loader aria-label="Connecting" />)

    expect(container.querySelector('[role="progressbar"]')?.getAttribute('aria-label')).toBe('Connecting')
  })

  it('keeps the background out of the accessibility tree', () => {
    const container = render(<ScreenBackground image="map.jpg" />)

    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true')
  })
})
