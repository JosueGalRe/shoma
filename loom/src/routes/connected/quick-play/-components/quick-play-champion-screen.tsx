import { useState } from 'react'

import { Tab, Tabs, TabsList, TabsPanel } from '@shoma/ui/tabs'
import { create } from '@stylexjs/stylex'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { useQuickPlaySlots } from '@/features/lobby/hooks/use-quick-play-slots'

import { QuickPlayChampionGrid } from './quick-play-champion-grid'
import { QuickPlayScreen } from './quick-play-screen'
import { toOptionNumeral } from './quick-play-screen-utils'
import { QuickPlaySkinGrid } from './quick-play-skin-grid'

import type { QuickPlayPickerProps } from './quick-play-screen-types'

type ChampionTab = 'champion' | 'cosmetics'

// Figma "Champion Selection" and "Cosmetic Selection": the option's champion, then its skin once there is one
export function QuickPlayChampionScreen({ option }: QuickPlayPickerProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const quickPlay = useQuickPlaySlots()
  const slot = quickPlay.slots[option]
  const [championId, setChampionId] = useState(slot?.championId ?? 0)
  const [skinId, setSkinId] = useState(slot?.skinId ?? 0)
  const [tab, setTab] = useState<ChampionTab>('champion')

  function goToLobby() {
    void navigate({ to: '/connected/lobby' })
  }

  function handlePick(picked: number) {
    // A champion either option holds keeps its skin; another starts on its base one
    const holder = quickPlay.slots.find((each) => {
      return each.championId === picked
    })

    setChampionId(picked)
    setSkinId(holder?.skinId || picked * 1000)
  }

  return (
    <QuickPlayScreen
      confirmDisabled={championId <= 0 || quickPlay.isPending}
      hasError={quickPlay.error !== null}
      title={
        tab === 'champion'
          ? t('lobby.quickPlay.selectChampion', { number: toOptionNumeral(option) })
          : t('lobby.quickPlay.selectCosmetic')
      }
      onConfirm={() => {
        if (championId === slot?.championId && skinId === slot.skinId) {
          goToLobby()

          return
        }

        void quickPlay.setChampion(option, { championId, skinId }, goToLobby)
      }}
    >
      <Tabs
        style={styles.tabs}
        value={tab}
        onValueChange={(value: ChampionTab) => {
          setTab(value)
        }}
      >
        <TabsList style={styles.list}>
          <Tab value="champion">{t('lobby.quickPlay.championTab')}</Tab>

          <Tab disabled={championId <= 0} value="cosmetics">
            {t('lobby.quickPlay.cosmeticsTab')}
          </Tab>
        </TabsList>

        <TabsPanel style={styles.panel} value="champion">
          <QuickPlayChampionGrid
            championId={championId}
            queueId={quickPlay.queueId}
            summonerId={quickPlay.summonerId}
            onPick={handlePick}
          />
        </TabsPanel>

        <TabsPanel style={styles.panel} value="cosmetics">
          <QuickPlaySkinGrid championId={championId} skinId={skinId} summonerId={quickPlay.summonerId} onPick={setSkinId} />
        </TabsPanel>
      </Tabs>
    </QuickPlayScreen>
  )
}

const styles = create({
  list: {
    alignSelf: 'center',
  },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    gap: 32,
    minHeight: 0,
  },
  tabs: {
    flexGrow: 1,
    gap: 32,
    minHeight: 0,
  },
})
