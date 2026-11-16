import { useState } from 'react'

import { Tab, Tabs, TabsList, TabsPanel } from '@shoma/ui/tabs'
import { create } from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { useSaveChampSelectSettings } from '@/core/lcu/lcu-mutations'
import { champSelectSettingsDescriptor, createLcuQueryOptions, queueChampionsDescriptor } from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'
import { ChampionGrid } from '@/features/champ-select/components/champion-grid'
import { useQuickPlaySlots } from '@/features/lobby/hooks/use-quick-play-slots'

import { QuickPlayScreen } from './quick-play-screen'
import { toOptionNumeral } from './quick-play-screen-utils'
import { QuickPlaySkinGrid } from './quick-play-skin-grid'

import type { QuickPlayPickerProps } from './quick-play-screen-types'

type ChampionTab = 'champion' | 'cosmetics'

// Figma "Champion Selection" and "Cosmetic Selection": the option's champion, then its skin once there is one. A
// Picked skin is remembered for the champion in the client's settings, as the client does
export function QuickPlayChampionScreen({ option }: QuickPlayPickerProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const transport = useSharedLCUTransport()
  const quickPlay = useQuickPlaySlots()
  const settings = useQuery(createLcuQueryOptions(champSelectSettingsDescriptor, transport)).data
  const saveSettings = useSaveChampSelectSettings()
  const championsQuery = useQuery({
    ...createLcuQueryOptions(queueChampionsDescriptor(quickPlay.summonerId ?? 0, quickPlay.queueId ?? 0), transport),
    enabled: Boolean(transport && quickPlay.summonerId && quickPlay.queueId),
  })
  const slot = quickPlay.slots[option]
  const [championId, setChampionId] = useState(slot?.championId ?? 0)
  const [skinId, setSkinId] = useState(slot?.skinId ?? 0)
  const [tab, setTab] = useState<ChampionTab>('champion')

  function goToLobby() {
    void navigate({ to: '/connected/lobby' })
  }

  // The skin the player last took the champion into a game with, or its base one
  function getDefaultSkin(picked: number) {
    return settings?.data.skins[String(picked)] || picked * 1000
  }

  function rememberSkin() {
    if (settings && skinId !== getDefaultSkin(championId)) {
      saveSettings.mutate({ ...settings, data: { ...settings.data, skins: { ...settings.data.skins, [championId]: skinId } } })
    }
  }

  function handlePick(picked: number) {
    // A champion either option holds keeps its skin
    const holder = quickPlay.slots.find((each) => {
      return each.championId === picked
    })

    setChampionId(picked)
    setSkinId(holder?.skinId || getDefaultSkin(picked))
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

        void quickPlay.setChampion(option, { championId, skinId }, () => {
          rememberSkin()
          goToLobby()
        })
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
          <ChampionGrid
            isLoaded={championsQuery.isSuccess}
            options={championsQuery.data ?? []}
            value={championId}
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
