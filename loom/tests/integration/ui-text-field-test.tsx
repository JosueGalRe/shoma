import { act } from 'react'

import { TextField } from '@shoma/ui/text-field'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { TextFieldProps } from '@shoma/ui/text-field'

let root: ReturnType<typeof createRoot> | null = null

function renderField(fieldProps: TextFieldProps) {
  const container = document.createElement('div')

  document.body.append(container)
  root = createRoot(container)
  act(() => {
    root?.render(<TextField {...fieldProps} />)
  })

  const input = container.querySelector('input')

  if (!input) {
    throw new Error('TextField did not render an <input>')
  }

  return { container, input }
}

afterEach(() => {
  act(() => {
    root?.unmount()
  })
  root = null
  document.body.replaceChildren()
})

describe('@shoma/ui TextField', () => {
  it('labels the input and describes it with the error', () => {
    const { input } = renderField({ error: 'Name taken', label: 'Game name', onValueChange: () => {}, value: 'Sol' })

    expect(input.labels?.[0]?.textContent).toBe('Game name')
    expect(input.getAttribute('aria-invalid')).toBe('true')

    const describedBy = input.getAttribute('aria-describedby') ?? ''

    expect(document.getElementById(describedBy)?.textContent).toBe('Name taken')
  })

  it('clears the value and keeps focus in the input', () => {
    const onValueChange = vi.fn()
    const { container, input } = renderField({ clearLabel: 'Clear', label: 'Search', onValueChange, value: 'Vi' })
    const clear = container.querySelector<HTMLButtonElement>('button[aria-label="Clear"]')

    act(() => {
      clear?.click()
    })
    expect(onValueChange).toHaveBeenCalledWith('')
    expect(document.activeElement).toBe(input)
  })

  it('hides the clear button while empty', () => {
    const { container } = renderField({ clearLabel: 'Clear', label: 'Search', onValueChange: () => {}, value: '' })

    expect(container.querySelector('button')).toBeNull()
  })
})
