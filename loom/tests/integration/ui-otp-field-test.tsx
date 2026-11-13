import { act } from 'react'

import { OtpField } from '@shoma/ui/otp-field'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'

import type { OtpFieldProps } from '@shoma/ui/otp-field'

let root: ReturnType<typeof createRoot> | null = null

function renderField(fieldProps: OtpFieldProps) {
  const container = document.createElement('div')

  document.body.append(container)
  root = createRoot(container)
  act(() => {
    root?.render(<OtpField {...fieldProps} />)
  })

  return [...container.querySelectorAll('input:not([aria-hidden])')]
}

afterEach(() => {
  act(() => {
    root?.unmount()
  })
  root = null
  document.body.replaceChildren()
})

describe('@shoma/ui OtpField', () => {
  it('renders one slot per character, each named by the label', () => {
    const slots = renderField({ label: 'Code', length: 6 })

    expect(slots).toHaveLength(6)

    for (const slot of slots) {
      const labelledBy = slot.getAttribute('aria-labelledby') ?? ''

      expect(document.getElementById(labelledBy)?.textContent).toBe('Code')
    }
  })

  it('marks every slot invalid and shows the error', () => {
    const slots = renderField({ error: 'Invalid code', label: 'Code', length: 6, value: '124155' })

    expect(slots.every((slot) => slot.getAttribute('aria-invalid') === 'true')).toBe(true)
    expect(document.body.textContent).toContain('Invalid code')
  })

  it('does not compile without a label', () => {
    // @ts-expect-error -- the slots need a label or aria-labelledby
    const element = <OtpField length={6} />

    expect(element.type).toBe(OtpField)
  })
})
