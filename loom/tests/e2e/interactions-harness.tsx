import { useState } from 'react'

/* eslint-disable react-refresh/only-export-components */
import { createRoot } from 'react-dom/client'

import { BottomSheet } from '../../src/components/ui/bottom-sheet'
import { IconGridSelector } from '../../src/components/ui/icon-grid-selector'

import type { ChampionDetails, RuneTree } from '../../src/core/http/ddragon'
// eslint-disable-next-line import/no-unassigned-import
import '../../src/i18n/config'

declare global {
  interface Window {
    __shomaHarnessRoot?: { unmount: () => void }
  }
}

type HarnessKind = 'bottom-sheet' | 'icon-grid' | 'social-bottom-sheet'

interface HarnessData {
  mockedChampions: ChampionDetails[]
  mockedRuneTrees: RuneTree[]
}

function BottomSheetHarness() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <main style={{ minHeight: '100vh', padding: 16 }}>
      <button
        onClick={() => {
          return setIsOpen(true)
        }}
        type='button'
      >
        Open sheet
      </button>

      <BottomSheet
        isOpen={isOpen}
        onClose={() => {
          return setIsOpen(false)
        }}
        title='Test Sheet'
      >
        <button type='button'>Sheet action</button>
      </BottomSheet>
    </main>
  )
}

function IconGridHarness() {
  const [selectedId, setSelectedId] = useState(4)

  return (
    <IconGridSelector
      columns={3}
      items={[
        { iconUrl: '/flash.png', id: 4, name: 'Flash' },
        { iconUrl: '/ignite.png', id: 14, name: 'Ignite' },
        { iconUrl: '/heal.png', id: 7, name: 'Heal' },
      ]}
      onSelect={setSelectedId}
      selectedId={selectedId}
    />
  )
}


function SocialBottomSheetHarness() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <main style={{ minHeight: '100vh', padding: 16 }}>
      <button
        onClick={() => {
          return setIsOpen(true)
        }}
        type="button"
      >
        Open social sheet
      </button>

      <BottomSheet
        isOpen={isOpen}
        onClose={() => {
          return setIsOpen(false)
        }}
        tall
        flush
        title="Social"
      >
        <div className="h-full overflow-y-auto">
          {Array.from({ length: 50 }, (_, index) => {
            return (
              <div key={index} className="border-b border-border px-4 py-3">
                Friend {index + 1}
              </div>
            )
          })}
        </div>
      </BottomSheet>
    </main>
  )
}

export function mountInteractionHarness(kind: HarnessKind, data: HarnessData): void {
  const rootElement = document.createElement('div')

  document.body.innerHTML = ''
  document.body.append(rootElement)
  window.__shomaHarnessRoot?.unmount()

  const root = createRoot(rootElement)

  window.__shomaHarnessRoot = root

  if (kind === 'bottom-sheet') {
    root.render(<BottomSheetHarness />)
  }

  if (kind === 'icon-grid') {
    root.render(<IconGridHarness />)
  }


  if (kind === 'social-bottom-sheet') {
    root.render(<SocialBottomSheetHarness />)
  }
}
