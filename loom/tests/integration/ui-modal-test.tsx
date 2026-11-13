import { act } from 'react'

import { Modal } from '@shoma/ui/modal'
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

describe('@shoma/ui Modal', () => {
  it('is an alert dialog named by its title', () => {
    const container = document.createElement('div')

    document.body.append(container)
    root = createRoot(container)
    act(() => {
      root?.render(
        <Modal open title="Swap for Camille?" onOpenChange={() => {}}>
          <button type="button">Accept</button>
        </Modal>,
      )
    })

    const dialog = document.querySelector('[role="alertdialog"]')
    const labelledBy = dialog?.getAttribute('aria-labelledby') ?? ''

    expect(document.getElementById(labelledBy)?.textContent).toBe('Swap for Camille?')
    expect(dialog?.textContent).toContain('Accept')
  })
})
