import { act } from 'react'

import { Select } from '@shoma/ui/select'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'

import type { SelectProps } from '@shoma/ui/select'

const options = [
  { label: 'Blind Pick', value: 'blind-pick' },
  { label: 'Draft Mode', value: 'draft' },
]

let root: ReturnType<typeof createRoot> | null = null

function renderSelect(selectProps: Omit<SelectProps, 'onValueChange' | 'options'>) {
  const container = document.createElement('div')

  document.body.append(container)
  root = createRoot(container)
  act(() => {
    root?.render(<Select {...selectProps} options={options} onValueChange={() => {}} />)
  })

  const trigger = container.querySelector<HTMLElement>('[role="combobox"]')

  if (!trigger) {
    throw new Error('Select did not render its trigger')
  }

  return trigger
}

afterEach(() => {
  act(() => {
    root?.unmount()
  })
  root = null
  document.body.replaceChildren()
})

describe('@shoma/ui Select', () => {
  it('shows the selected option label in a trigger named by the label', () => {
    const trigger = renderSelect({ label: 'Game type', value: 'draft' })
    const labelledBy = trigger.getAttribute('aria-labelledby') ?? ''

    expect(trigger.textContent).toContain('Draft Mode')
    expect(labelledBy.split(' ').some((id) => document.getElementById(id)?.textContent === 'Game type')).toBe(true)
  })

  it('shows the placeholder without a value', () => {
    const trigger = renderSelect({ label: 'Team size', placeholder: 'Pick one', value: null })

    expect(trigger.textContent).toContain('Pick one')
  })
})
