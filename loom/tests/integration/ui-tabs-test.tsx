import { act } from 'react'

import { Tab, Tabs, TabsList, TabsPanel } from '@shoma/ui/tabs'
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

describe('@shoma/ui Tabs', () => {
  it('switches the panel with the selected tab', () => {
    const container = document.createElement('div')

    document.body.append(container)
    root = createRoot(container)
    act(() => {
      root?.render(
        <Tabs defaultValue="champion">
          <TabsList>
            <Tab value="champion">Champion</Tab>
            <Tab value="cosmetics">Cosmetics</Tab>
          </TabsList>
          <TabsPanel value="champion">Champion grid</TabsPanel>
          <TabsPanel value="cosmetics">Skins and wards</TabsPanel>
        </Tabs>,
      )
    })

    const tabs = [...container.querySelectorAll<HTMLElement>('[role="tab"]')]
    const visiblePanel = () => {
      return container.querySelector('[role="tabpanel"]:not([hidden])')?.textContent
    }

    expect(tabs.map((tab) => tab.getAttribute('aria-selected'))).toEqual(['true', 'false'])
    expect(visiblePanel()).toBe('Champion grid')
    act(() => {
      tabs[1]?.click()
    })
    expect(tabs[1]?.getAttribute('aria-selected')).toBe('true')
    expect(visiblePanel()).toBe('Skins and wards')
  })
})
