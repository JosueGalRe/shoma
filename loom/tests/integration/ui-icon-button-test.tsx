import { act } from 'react'

import { IconButton } from '@shoma/ui/icon-button'
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

describe('@shoma/ui IconButton', () => {
  it('renders a native button named by its aria-label', () => {
    const container = document.createElement('div')

    document.body.append(container)
    root = createRoot(container)
    act(() => {
      root?.render(
        <IconButton aria-label="Back">
          <svg aria-hidden />
        </IconButton>,
      )
    })

    const button = container.querySelector('button')

    expect(button?.getAttribute('aria-label')).toBe('Back')
    expect(button?.type).toBe('button')
  })

  it('does not compile without an accessible name', () => {
    // @ts-expect-error -- icon-only buttons must pass aria-label
    const element = <IconButton>{null}</IconButton>

    expect(element.type).toBe(IconButton)
  })
})
