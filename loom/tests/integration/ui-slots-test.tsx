import { act } from 'react'

import { EmptySlot } from '@shoma/ui/empty-slot'
import { Tile, TileGroup } from '@shoma/ui/tile'
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

function buttonNamed(container: HTMLElement, name: string) {
  const button = [...container.querySelectorAll<HTMLButtonElement>('button')].find((element) => {
    return (element.getAttribute('aria-label') ?? element.textContent) === name
  })

  if (!button) {
    throw new Error(`No button named ${name}`)
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

describe('@shoma/ui Tile', () => {
  it('picks a tile by its label and reports the group value', () => {
    const onValueChange = vi.fn()
    const container = render(
      <TileGroup aria-label="Champion" value={['Jinx']} onValueChange={onValueChange}>
        <Tile image="jinx.png" label="Jinx" value="Jinx" />
        <Tile image="ahri.png" label="Ahri" value="Ahri" />
      </TileGroup>,
    )

    expect(buttonNamed(container, 'Jinx').getAttribute('aria-pressed')).toBe('true')
    expect(buttonNamed(container, 'Ahri').getAttribute('aria-pressed')).toBe('false')
    act(() => {
      buttonNamed(container, 'Ahri').click()
    })
    expect(onValueChange).toHaveBeenCalledWith(['Ahri'], expect.anything())
  })

  it('opens the info without picking the tile', () => {
    const onValueChange = vi.fn()
    const onInfo = vi.fn()
    const container = render(
      <TileGroup aria-label="Summoner spells" multiple value={[]} onValueChange={onValueChange}>
        <Tile image="flash.png" infoLabel="Flash details" onInfoClick={onInfo} label="Flash" value="SummonerFlash" />
      </TileGroup>,
    )

    act(() => {
      buttonNamed(container, 'Flash details').click()
    })
    expect(onInfo).toHaveBeenCalledOnce()
    expect(onValueChange).not.toHaveBeenCalled()
  })
})

describe('@shoma/ui EmptySlot', () => {
  it('is a named button that ignores clicks while disabled', () => {
    const onClick = vi.fn()
    const container = render(<EmptySlot aria-label="Pick a champion" disabled icon={null} onClick={onClick} />)

    act(() => {
      buttonNamed(container, 'Pick a champion').click()
    })
    expect(onClick).not.toHaveBeenCalled()
  })
})
