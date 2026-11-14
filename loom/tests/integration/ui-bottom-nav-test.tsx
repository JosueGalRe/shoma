import { act } from 'react'

import { BottomNav, BottomNavTab } from '@shoma/ui/bottom-nav'
import { Tabs, TabsPanel } from '@shoma/ui/tabs'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'

let root: ReturnType<typeof createRoot> | null = null

afterEach(() => {
  act(() => {
    root?.unmount()
  })
  root = null
  document.body.replaceChildren()
})

describe('@shoma/ui BottomNav', () => {
  it('switches the section with the selected tab', () => {
    const container = document.createElement('div')

    document.body.append(container)
    root = createRoot(container)
    act(() => {
      root?.render(
        <Tabs defaultValue="champion">
          <TabsPanel value="champion">Champion grid</TabsPanel>
          <TabsPanel value="spell">Spell picker</TabsPanel>
          <BottomNav aria-label="Champ select">
            <BottomNavTab icon={null} value="champion">
              Champion
            </BottomNavTab>
            <BottomNavTab icon={null} value="spell">
              Spell
            </BottomNavTab>
          </BottomNav>
        </Tabs>,
      )
    })

    const spell = [...container.querySelectorAll<HTMLElement>('[role="tab"]')].find((tab) => tab.textContent === 'Spell')

    expect(container.querySelector('[role="tablist"]')?.getAttribute('aria-label')).toBe('Champ select')
    act(() => {
      spell?.click()
    })
    expect(spell?.getAttribute('aria-selected')).toBe('true')
    expect(container.querySelector('[role="tabpanel"]:not([hidden])')?.textContent).toBe('Spell picker')
  })
})
