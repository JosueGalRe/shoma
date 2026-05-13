/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { BottomSheet } from '../../src/components/ui/bottom-sheet'
import { IconGridSelector } from '../../src/components/ui/icon-grid-selector'
import { perksCurrentPageDescriptor, perksPagesDescriptor } from '../../src/core/lcu/lcu-queries'
import { RelayClientProvider } from '../../src/core/relay/relay-client-provider'
import { useChampSelectStore } from '../../src/features/champ-select/champ-select-store'
import { ChampionPicker } from '../../src/features/champ-select/components/champion-picker'
import { RuneEditor } from '../../src/features/champ-select/components/rune-editor'
import { SummonerPicker } from '../../src/features/champ-select/components/summoner-picker'

import '../../src/i18n/config'

declare global {
  interface Window {
    __shomaHarnessRoot?: { unmount: () => void }
  }
}

type HarnessKind = 'bottom-sheet' | 'icon-grid' | 'champion-picker' | 'summoner-picker' | 'rune-editor'

type HarnessData = {
  mockedChampions: Array<{ key: string; name: string; tags: string[]; title: string }>
  mockedRuneTrees: unknown[]
}

function BottomSheetHarness() {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <main style={{ minHeight: '100vh', padding: 16 }}>
      <button onClick={() => setIsOpen(true)} type="button">Open sheet</button>
      <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)} title="Test Sheet">
        <button type="button">Sheet action</button>
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
        { id: 4, iconUrl: '/flash.png', name: 'Flash' },
        { id: 14, iconUrl: '/ignite.png', name: 'Ignite' },
        { id: 7, iconUrl: '/heal.png', name: 'Heal' },
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
    champions: mockedChampions.map((champion) => ({ ...champion, id: Number(champion.key) })),
    isAram: false,
    isLoading: false,
    selectedChampion: null,
    session: {
      actions: [[{ actorCellId: 1, championId: 0, completed: false, id: 1, isAllyAction: true, type: 'pick' }]],
      localPlayerCellId: 1,
      myTeam: [{ cellId: 1, championId: 0, displayName: 'Mimic Tester', summonerId: 101 }],
      queueId: 420,
      theirTeam: [],
      timer: { adjustedTimeLeftInPhase: 30000, phase: 'BAN_PICK', totalTimeInPhase: 30000 },
    },
  })
}

function SummonerPickerHarness() {
  const [spell1, setSpell1] = useState(4)
  const [spell2, setSpell2] = useState(14)
  const spells = [
    { id: 4, iconPath: '/flash.png', name: 'Flash' },
    { id: 14, iconPath: '/ignite.png', name: 'Ignite' },
    { id: 7, iconPath: '/heal.png', name: 'Heal' },
  ]
  return (
    <SummonerPicker
      ddragonVersion="15.1.1"
      onChangeSpell={(slot: 1 | 2, spellId: number) => slot === 1 ? setSpell1(spellId) : setSpell2(spellId)}
      selectedSpell1Id={spell1}
      selectedSpell2Id={spell2}
      summonerSpells={spells}
    />
  )
}

function RuneEditorHarness({ mockedRuneTrees }: HarnessData) {
  const queryClient = new QueryClient()
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
        <RuneEditor isOpen onClose={() => undefined} runeTrees={mockedRuneTrees} />
      </RelayClientProvider>
    </QueryClientProvider>
  )
}

export function mountInteractionHarness(kind: HarnessKind, data: HarnessData): void {
  const rootElement = document.createElement('div')
  document.body.innerHTML = ''
  document.body.append(rootElement)
  window.__shomaHarnessRoot?.unmount()
  const root = createRoot(rootElement)
  window.__shomaHarnessRoot = root

  if (kind === 'bottom-sheet') root.render(<BottomSheetHarness />)
  if (kind === 'icon-grid') root.render(<IconGridHarness />)
  if (kind === 'champion-picker') {
    seedChampionPickerStore(data.mockedChampions)
    root.render(<ChampionPickerHarness {...data} />)
  }
  if (kind === 'summoner-picker') root.render(<SummonerPickerHarness />)
  if (kind === 'rune-editor') root.render(<RuneEditorHarness {...data} />)
}
