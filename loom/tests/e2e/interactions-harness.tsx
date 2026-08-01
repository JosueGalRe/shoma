import { useMemo, useState } from 'react'

/* eslint-disable react-refresh/only-export-components */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRoot } from 'react-dom/client'

import { BottomSheet } from '../../src/components/ui/bottom-sheet'
import { IconGridSelector } from '../../src/components/ui/icon-grid-selector'
import { perksCurrentPageDescriptor, perksPagesDescriptor } from '../../src/core/lcu/queries'
import { RelayClientProvider } from '../../src/core/relay/relay-client-provider'
import { CellId, ChampionId, QueueId, SpellId, SummonerId } from '../../src/core/types/branded'
import { useChampSelectStore } from '../../src/features/champ-select/champ-select-store'
import { ChampionPicker } from '../../src/features/champ-select/components/champion-picker'
import { RuneEditor } from '../../src/features/champ-select/components/rune-editor'
import { SummonerPicker } from '../../src/features/champ-select/components/summoner-picker'

import type { ChampionDetails, RuneTree } from '../../src/core/http/ddragon-client'
import type { SummonerSpell } from '../../src/features/champ-select/hooks/use-champ-select'
// eslint-disable-next-line import/no-unassigned-import
import '../../src/i18n/config'

declare global {
  interface Window {
    __shomaHarnessRoot?: { unmount: () => void }
  }
}

type HarnessKind = 'bottom-sheet' | 'icon-grid' | 'champion-picker' | 'summoner-picker' | 'rune-editor' | 'social-bottom-sheet'

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

function ChampionPickerHarness({ mockedChampions: _mockedChampions }: HarnessData) {
  return <ChampionPicker />
}

function seedChampionPickerStore(mockedChampions: HarnessData['mockedChampions']) {
  useChampSelectStore.getState().reset()

  useChampSelectStore.setState({
    champions: mockedChampions,
    isAram: false,
    isLoading: false,
    selectedChampion: null,
    session: {
      actions: [[{ actorCellId: CellId(1), championId: ChampionId(0), completed: false, id: 1, isAllyAction: true, type: 'pick' }]],
      localPlayerCellId: CellId(1),
      myTeam: [{ cellId: CellId(1), championId: ChampionId(0), displayName: 'Mimic Tester', summonerId: SummonerId(101) }],
      queueId: QueueId(420),
      theirTeam: [],
      timer: { adjustedTimeLeftInPhase: 30_000, phase: 'BAN_PICK', totalTimeInPhase: 30_000 },
    },
  })
}

function SummonerPickerHarness() {
  const [spell1, setSpell1] = useState(SpellId(4))
  const [spell2, setSpell2] = useState(SpellId(14))
  const spells: SummonerSpell[] = [
    { iconPath: '/flash.png', id: SpellId(4), name: 'Flash' },
    { iconPath: '/ignite.png', id: SpellId(14), name: 'Ignite' },
    { iconPath: '/heal.png', id: SpellId(7), name: 'Heal' },
  ]

  return (
    <SummonerPicker
      ddragonVersion='15.1.1'
      onChangeSpell={(slot: 1 | 2, spellId: number) => {
        if (slot === 1) {
          setSpell1(SpellId(spellId))

          return
        }

        setSpell2(SpellId(spellId))
      }}
      selectedSpell1Id={spell1}
      selectedSpell2Id={spell2}
      summonerSpells={spells}
    />
  )
}

function RuneEditorHarness({ mockedRuneTrees }: HarnessData) {
  const queryClient = useMemo(() => {
    return new QueryClient()
  }, [])
  const pageData = {
    id: 1,
    isActive: true,
    isDeletable: true,
    isEditable: true,
    name: 'Mimic Page',
    primaryStyleId: 8000,
    selectedPerkIds: [8005, 9101, 9104, 8014, 8126, 8138, 5008, 5008, 5011],
    subStyleId: 8100,
  }

  queryClient.setQueryData(perksPagesDescriptor.queryKey, [pageData])
  queryClient.setQueryData(perksCurrentPageDescriptor.queryKey, { id: 1 })

  return (
      <QueryClientProvider client={queryClient}>
        <RelayClientProvider>
          <RuneEditor
            isOpen
            onClose={() => {
              return undefined
            }}
            runeTrees={mockedRuneTrees}
          />
        </RelayClientProvider>
      </QueryClientProvider>
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

  if (kind === 'champion-picker') {
    seedChampionPickerStore(data.mockedChampions)
    root.render(<ChampionPickerHarness mockedChampions={data.mockedChampions} mockedRuneTrees={data.mockedRuneTrees} />)
  }

  if (kind === 'summoner-picker') {
    root.render(<SummonerPickerHarness />)
  }

  if (kind === 'rune-editor') {
    root.render(<RuneEditorHarness mockedChampions={data.mockedChampions} mockedRuneTrees={data.mockedRuneTrees} />)
  }

  if (kind === 'social-bottom-sheet') {
    root.render(<SocialBottomSheetHarness />)
  }
}
