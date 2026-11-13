import { act } from 'react'

import { Avatar } from '@shoma/ui/avatar'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'

import type { AvatarProps } from '@shoma/ui/avatar'

let root: ReturnType<typeof createRoot> | null = null

function renderAvatar(avatarProps: AvatarProps) {
  const container = document.createElement('div')

  document.body.append(container)
  root = createRoot(container)
  act(() => {
    root?.render(<Avatar {...avatarProps} />)
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

describe('@shoma/ui Avatar', () => {
  it('falls back to the initials while there is no picture', () => {
    const container = renderAvatar({ name: 'Bryan Galdamez' })

    expect(container.textContent).toBe('BG')
  })

  it('shows the name and status beside the picture', () => {
    const container = renderAvatar({ name: 'Dylan Siliezar', status: 'En partida' })

    expect(container.textContent).toContain('Dylan Siliezar')
    expect(container.textContent).toContain('En partida')
  })
})
