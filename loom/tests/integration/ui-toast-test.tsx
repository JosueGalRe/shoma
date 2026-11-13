import { act } from 'react'

import { ToastProvider } from '@shoma/ui/toast'
import { useToast } from '@shoma/ui/use-toast'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ToastOptions } from '@shoma/ui/use-toast'

let root: ReturnType<typeof createRoot> | null = null

function Trigger({ options }: { options: ToastOptions }) {
  const toast = useToast()

  return (
    <button
      type="button"
      onClick={() => {
        toast.add(options)
      }}
    >
      show
    </button>
  )
}

function showToast(options: ToastOptions) {
  const container = document.createElement('div')

  document.body.append(container)
  root = createRoot(container)
  act(() => {
    root?.render(
      <ToastProvider closeLabel="Close">
        <Trigger options={options} />
      </ToastProvider>,
    )
  })
  act(() => {
    container.querySelector('button')?.click()
  })
}

afterEach(() => {
  act(() => {
    root?.unmount()
  })
  root = null
  document.body.replaceChildren()
})

describe('@shoma/ui Toast', () => {
  it('announces the title with a named close button', () => {
    showToast({ title: 'Champion Locked', type: 'success' })

    expect(document.body.textContent).toContain('Champion Locked')
    expect(document.querySelector('button[aria-label="Close"]')).not.toBeNull()
    // The trigger and the close button: no empty action button without an action
    expect(document.querySelectorAll('button')).toHaveLength(2)
  })

  it('renders the action only when given, and runs it', () => {
    const onClick = vi.fn()

    showToast({ action: { label: 'Retry', onClick }, title: 'Could not send the invite', type: 'error' })

    const action = [...document.querySelectorAll('button')].find((button) => button.textContent === 'Retry')

    act(() => {
      action?.click()
    })
    expect(onClick).toHaveBeenCalledOnce()
  })
})
