import { act } from 'react'

import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Button } from '@shoma/ui/button'

import type { ButtonProps } from '@shoma/ui/button'

let root: ReturnType<typeof createRoot> | null = null

function renderButton(buttonProps: ButtonProps) {
  const container = document.createElement('div')

  document.body.append(container)
  root = createRoot(container)
  act(() => {
    root?.render(<Button {...buttonProps} />)
  })

  const button = container.querySelector('button')

  if (!button) {
    throw new Error('Button did not render a <button>')
  }

  return button
}

afterEach(() => {
  act(() => {
    root?.unmount()
  })
  root = null
  document.body.replaceChildren()
})

describe('@shoma/ui Button', () => {
  it('renders a native button that does not submit forms', () => {
    const onClick = vi.fn()
    const button = renderButton({ children: 'Confirm', onClick })

    expect(button.type).toBe('button')
    act(() => {
      button.click()
    })
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('ignores clicks when disabled and swaps to the disabled styles', () => {
    const onClick = vi.fn()
    const enabled = renderButton({ children: 'Next' }).className

    act(() => {
      root?.unmount()
    })

    const button = renderButton({ children: 'Next', disabled: true, onClick })

    expect(button.disabled).toBe(true)
    expect(button.className).not.toBe(enabled)
    act(() => {
      button.click()
    })
    expect(onClick).not.toHaveBeenCalled()
  })

  it('stays focusable when disabled on request', () => {
    const button = renderButton({ children: 'In queue', disabled: true, focusableWhenDisabled: true })

    expect(button.disabled).toBe(false)
    expect(button.getAttribute('aria-disabled')).toBe('true')
    act(() => {
      button.focus()
    })
    expect(document.activeElement).toBe(button)
  })
})
