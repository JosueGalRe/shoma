import React, { act } from 'react'

import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { RoleSlotStrip } from './role-slot-strip'

import type { LobbyRole } from '../lobby-store'

let container: HTMLDivElement | null = null
let root: ReturnType<typeof createRoot> | null = null

function renderStrip(first: LobbyRole, second: LobbyRole, onSelect = vi.fn()): void {
  if (!container) {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  }

  act(() => {
    root?.render(
      React.createElement(RoleSlotStrip, {
        disabled: false,
        first,
        onSelect,
        second,
        t: (key: string) => {
          return key
        },
      }),
    )
  })
}

function clickButton(label: string): void {
  const button = container?.querySelector(`button[aria-label="${label}"]`)

  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`Button not found: ${label}`)
  }

  act(() => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

function checkedRole(): string | null {
  const checked = container?.querySelector('[role="radio"][aria-checked="true"]')

  return checked?.getAttribute('aria-label') ?? null
}

describe('RoleSlotStrip', () => {
  afterEach(() => {
    act(() => {
      root?.unmount()
    })

    root = null
    container?.remove()
    container = null
  })

  it('highlights the role of the slot being edited when switching slots directly', () => {
    renderStrip('TOP', 'JUNGLE')

    clickButton('lobby.primaryRole')
    expect(checkedRole()).toBe('lobby.roles.top')

    clickButton('lobby.secondaryRole')
    expect(checkedRole()).toBe('lobby.roles.jungle')
  })

  it('highlights the second slot role when the second slot is opened first', () => {
    renderStrip('TOP', 'JUNGLE')

    clickButton('lobby.secondaryRole')
    expect(checkedRole()).toBe('lobby.roles.jungle')
  })

  it('keeps the last edited slot content while the close animation runs', () => {
    renderStrip('TOP', 'JUNGLE')

    clickButton('lobby.secondaryRole')
    clickButton('lobby.secondaryRole')

    const strip = container?.querySelector('[role="radiogroup"]')

    expect(strip?.getAttribute('aria-hidden')).toBe('true')
    expect(checkedRole()).toBe('lobby.roles.jungle')
  })

  it('picks against the open slot, not the remembered one', () => {
    const onSelect = vi.fn()

    renderStrip('TOP', 'JUNGLE', onSelect)

    clickButton('lobby.secondaryRole')
    clickButton('lobby.roles.middle')

    expect(onSelect).toHaveBeenCalledWith('second', 'MIDDLE')
  })
})
