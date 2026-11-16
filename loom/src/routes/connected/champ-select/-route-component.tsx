import { useEffect, useState } from 'react'

import { BottomNav, BottomNavTab } from '@shoma/ui/bottom-nav'
import { Icon } from '@shoma/ui/icon'
import { ScreenBackground } from '@shoma/ui/screen-background'
import { Tabs, TabsPanel } from '@shoma/ui/tabs'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import { TopBar } from '@/components/layout/top-bar'
import { AramOverlay, useChampSelect } from '@/features/champ-select'

import { AssignedPositions } from './-components/assigned-positions'
import { ChampSelectHeader } from './-components/champ-select-header'
import { isBanStage, readChampSelectStage, STAGE_TITLES } from './-components/champ-select-screen-utils'
import { ChampionPanel } from './-components/champion-panel'
import { PicksPanel } from './-components/picks-panel'
import { RunesPanel } from './-components/runes-panel'
import { SpellsPanel } from './-components/spells-panel'
import { TeamStrip } from './-components/team-strip'
import { WardsPanel } from './-components/wards-panel'
import { useChampSelectMap } from './-hooks/use-champ-select-map'

import type { ChampSelectTab } from './-components/champ-select-screen-types'

// How long champ select opens on the assigned positions, as the client's intro does
const INTRO_MS = 3000

// Figma "Champion Selection": the turn's title and timer, the section picked in the bottom tabs, the teams, and the
// Section's button between them
export function ChampSelectRouteComponent() {
  const { t } = useTranslation()
  const champSelect = useChampSelect()
  const { session } = champSelect
  const stage = readChampSelectStage(session)
  const mapUrl = useChampSelectMap(session)
  const [tab, setTab] = useState<ChampSelectTab>('champion')
  const [isTeamsOpen, setIsTeamsOpen] = useState(false)
  const [actionSlot, setActionSlot] = useState<HTMLDivElement | null>(null)
  const [isIntroShown, setIsIntroShown] = useState(stage === 'planning')
  const [isAramOpen, setIsAramOpen] = useState(false)
  // Figma "prepare for battle": once the game is starting nothing can change, so only the picks stay
  const isStarting = session?.timer?.phase === 'GAME_STARTING'
  const isLoadout = !isStarting && (tab === 'spell' || tab === 'rune' || tab === 'ward')
  const hasPositions = champSelect.team.some((member) => {
    return Boolean(member.assignedPosition)
  })
  const hasChosenAramCard = champSelect.team.some((member) => {
    return member.cellId === champSelect.localPlayerCellId && (member.championId > 0 || (member.championPickIntent ?? 0) > 0)
  })

  // External system sync: the intro fades away on its own, as the client's does
  useEffect(() => {
    const timeout = isIntroShown
      ? setTimeout(() => {
          setIsIntroShown(false)
        }, INTRO_MS)
      : undefined

    return () => {
      clearTimeout(timeout)
    }
  }, [isIntroShown])

  // External system sync: ARAM's cards open by themselves until one is chosen
  useEffect(() => {
    setIsAramOpen(champSelect.isAram && !hasChosenAramCard && champSelect.aram.cards.length > 0)
  }, [champSelect.aram.cards.length, champSelect.isAram, hasChosenAramCard])

  return (
    <Tabs
      style={styles.screen}
      value={isStarting ? 'picks' : tab}
      onValueChange={(value: ChampSelectTab) => {
        setTab(value)
        setIsTeamsOpen(false)
      }}
    >
      <ScreenBackground image={mapUrl} />

      <TopBar />

      <ChampSelectHeader
        secondsLeft={champSelect.timer}
        secondsTotal={Math.ceil((session?.timer?.totalTimeInPhase ?? 0) / 1000)}
        title={t(isLoadout ? 'champSelect.prepareYourLoadout' : STAGE_TITLES[stage])}
        tone={isBanStage(stage) ? 'ban' : 'pick'}
      />

      <TabsPanel style={styles.panel} value="champion">
        <ChampionPanel
          actionSlot={actionSlot}
          champSelect={champSelect}
          stage={stage}
          onOpenAram={() => {
            setIsAramOpen(true)
          }}
        />
      </TabsPanel>

      <TabsPanel style={styles.panel} value="spell">
        <SpellsPanel actionSlot={actionSlot} champSelect={champSelect} />
      </TabsPanel>

      <TabsPanel style={styles.panel} value="picks">
        <PicksPanel actionSlot={actionSlot} champSelect={champSelect} onOpenTab={setTab} />
      </TabsPanel>

      <TabsPanel style={styles.panel} value="rune">
        <RunesPanel actionSlot={actionSlot} champSelect={champSelect} />
      </TabsPanel>

      <TabsPanel style={styles.panel} value="ward">
        <WardsPanel actionSlot={actionSlot} champSelect={champSelect} />
      </TabsPanel>

      <TeamStrip champSelect={champSelect} open={isTeamsOpen} onOpenChange={setIsTeamsOpen} />

      {isStarting ? null : (
        <>
          <div ref={setActionSlot} {...props(styles.action)} />

          <BottomNav aria-label={t('champSelect.sections')}>
            <BottomNavTab icon={<Icon name="champion" />} value="champion">
              {t('champSelect.champion')}
            </BottomNavTab>

            <BottomNavTab icon={<Icon name="spell" />} value="spell">
              {t('champSelect.spell')}
            </BottomNavTab>

            <BottomNavTab icon={<Icon name="dashboard" />} value="picks">
              {t('champSelect.picks')}
            </BottomNavTab>

            <BottomNavTab icon={<Icon name="rune" />} value="rune">
              {t('champSelect.rune')}
            </BottomNavTab>

            <BottomNavTab icon={<Icon name="sentinel" />} value="ward">
              {t('champSelect.wards')}
            </BottomNavTab>
          </BottomNav>
        </>
      )}

      {hasPositions ? (
        <AssignedPositions
          localCellId={champSelect.localPlayerCellId}
          mapUrl={mapUrl}
          members={champSelect.team}
          open={isIntroShown && stage === 'planning'}
        />
      ) : null}

      <AramOverlay
        bench={champSelect.aram.bench}
        cards={champSelect.aram.cards}
        champions={champSelect.champions}
        hasChosenCard={hasChosenAramCard}
        isOpen={isAramOpen}
        isSwapping={champSelect.aram.isLoading}
        title={t('aram.cards.title')}
        onClose={() => {
          setIsAramOpen(false)
        }}
        onSelectCard={(championId) => {
          void champSelect.selectChampionForTurn(championId)
        }}
        onSwapBench={(championId) => {
          void champSelect.aram.swapBench(championId)
        }}
      />
    </Tabs>
  )
}

const styles = create({
  // Figma "Bottom Action": 16 above and below the button, 24 at the sides; gone when the section has no button
  action: {
    backgroundColor: color.background,
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    paddingBlock: { ':empty': 0, default: 16 },
    paddingInline: 24,
  },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minHeight: 0,
  },
  screen: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minHeight: 0,
  },
})
