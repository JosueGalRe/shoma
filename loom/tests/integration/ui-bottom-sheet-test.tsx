import { act } from 'react'

import { BottomSheet } from '@shoma/ui/bottom-sheet'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { BottomSheetProps } from '@shoma/ui/bottom-sheet'

let root: ReturnType<typeof createRoot> | null = null

function renderSheet(sheetProps: Omit<BottomSheetProps, 'children'>) {
  const container = document.createElement('div')

  document.body.append(container)
  root = createRoot(container)
  act(() => {
    root?.render(
      <BottomSheet {...sheetProps}>
        <p>Sort by Status</p>
      </BottomSheet>,
    )
  })
}

afterEach(() => {
  act(() => {
    root?.unmount()
  })
  root = null
  document.body.replaceChildren()
})

describe('@shoma/ui BottomSheet', () => {
  it('is a dialog named by its title', () => {
    renderSheet({ onOpenChange: () => {}, open: true, title: 'Options' })

    const dialog = document.querySelector('[role="dialog"]')
    const labelledBy = dialog?.getAttribute('aria-labelledby') ?? ''

    expect(document.getElementById(labelledBy)?.textContent).toBe('Options')
    expect(dialog?.textContent).toContain('Sort by Status')
  })

  it('closes from the back arrow', () => {
    const onOpenChange = vi.fn()

    renderSheet({ closeLabel: 'Back', onOpenChange, open: true, title: 'Options' })
    act(() => {
      document.querySelector<HTMLButtonElement>('button[aria-label="Back"]')?.click()
    })
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything())
  })

  it('renders nothing while closed', () => {
    renderSheet({ onOpenChange: () => {}, open: false, title: 'Options' })

    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })
})
