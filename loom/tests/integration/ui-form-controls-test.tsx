import { act } from 'react'

import { Checkbox } from '@shoma/ui/checkbox'
import { Radio, RadioGroup } from '@shoma/ui/radio-group'
import { Switch } from '@shoma/ui/switch'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

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

function clickLabel(container: HTMLElement, label: string) {
  const target = [...container.querySelectorAll('label')].find((element) => element.textContent === label)

  act(() => {
    target?.click()
  })
}

afterEach(() => {
  act(() => {
    root?.unmount()
  })
  root = null
  document.body.replaceChildren()
})

describe('@shoma/ui form controls', () => {
  it('selects a radio from its label', () => {
    const onValueChange = vi.fn()
    const container = render(
      <RadioGroup aria-label="Sort" value="status" onValueChange={onValueChange}>
        <Radio label="Sort Alphabetically" value="alphabetically" />
        <Radio label="Sort by Status" value="status" />
      </RadioGroup>,
    )

    expect(container.querySelector('[role="radio"][aria-checked="true"]')?.parentElement?.textContent).toBe('Sort by Status')
    clickLabel(container, 'Sort Alphabetically')
    expect(onValueChange).toHaveBeenCalledWith('alphabetically', expect.anything())
  })

  it('toggles a checkbox from its label', () => {
    const onCheckedChange = vi.fn()
    const container = render(<Checkbox checked={false} label="Group Offline" onCheckedChange={onCheckedChange} />)

    clickLabel(container, 'Group Offline')
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything())
  })

  it('exposes the switch with its name and state', () => {
    const onCheckedChange = vi.fn()
    const container = render(<Switch aria-label="Open party" checked={false} onCheckedChange={onCheckedChange} />)
    const control = container.querySelector<HTMLElement>('[role="switch"]')

    expect(control?.getAttribute('aria-label')).toBe('Open party')
    expect(control?.getAttribute('aria-checked')).toBe('false')
    act(() => {
      control?.click()
    })
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything())
  })
})
