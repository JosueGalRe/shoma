import { useEffect, useRef, useState } from 'react'

import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLatestDdragonVersion } from '@/core/http/ddragon-client'
import { ChampionId } from '@/core/types/branded'
import {
  Bench,
  ChampionPicker,
  ChampSelectMembers,
  ChampSelectTimerComponent,
  PlayerSettings,
  SkinPicker,
  useChampSelect,
} from '@/features/champ-select'
import { getModeRules } from '@/features/modes/mode-engine'

import { champSelectStyles } from './-styles'
import { translatedErrorMessage } from './-utils'

import type { ChampionId as ChampionIdType } from '@/core/types/branded'

function ChampSelectRouteComponent() {
  const { t } = useTranslation()
  const ddragonVersion = useLatestDdragonVersion()
  const champSelect = useChampSelect()
  const modeRules = getModeRules(champSelect.mode)
  const selectedChampion =
    champSelect.champions.find((champion) => {
      return champion.id === champSelect.selectedChampion
    }) ?? null
  const pickedChampionIds = new Set<ChampionIdType>()

  for (const member of champSelect.team) {
    if (member.championId > 0) {
      pickedChampionIds.add(ChampionId(member.championId))
    }
  }

  for (const member of champSelect.enemyTeam) {
    if (member.championId > 0) {
      pickedChampionIds.add(ChampionId(member.championId))
    }
  }

  const selectedSkins = champSelect.championSkins
  const availableAramChampionIds = champSelect.champions.reduce<ChampionIdType[]>((acc, champion) => {
    if (!champSelect.bannedChampions.includes(champion.id) && !pickedChampionIds.has(champion.id)) {
      acc.push(champion.id)
    }

    return acc
  }, [])
  const hasSelectedAramCard = champSelect.aram.selectedCardIndex !== null
  const hasDrawnAramCards = useRef(false)
  const lastActionIdRef = useRef<number | null>(null)
  const hasManuallyClosedRef = useRef(false)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const localMember = champSelect.team.find((member) => {
    return member.cellId === champSelect.localPlayerCellId
  })
  const isChampionLockedIn = (localMember?.championId ?? 0) > 0

  const shouldDrawAramCards =
    champSelect.isAram && !hasSelectedAramCard && champSelect.aram.cards.length === 0 && availableAramChampionIds.length > 0

  // External system sync: ARAM card drawing is triggered by champ-select session state, not user interaction.
  useEffect(() => {
    if (shouldDrawAramCards && !hasDrawnAramCards.current) {
      champSelect.aram.drawCards(availableAramChampionIds, champSelect.aram.canReroll)
      hasDrawnAramCards.current = true
    } else if (!shouldDrawAramCards) {
      hasDrawnAramCards.current = false
    }
  }, [shouldDrawAramCards, availableAramChampionIds, champSelect.aram])

  // External system sync: open the picker once per new local pick/ban action while preserving manual close state.
  useEffect(() => {
    const {currentAction} = champSelect
    const currentActionId = currentAction?.id ?? null

    if (lastActionIdRef.current !== currentActionId) {
      lastActionIdRef.current = currentActionId
      hasManuallyClosedRef.current = false
    }

    if (
      !champSelect.isMyTurn ||
      !currentAction ||
      currentAction.completed ||
      (currentAction.type !== 'pick' && currentAction.type !== 'ban') ||
      (champSelect.phase !== 'pick' && champSelect.phase !== 'ban')
    ) {
      return
    }

    if (!hasManuallyClosedRef.current) {
      setIsPickerOpen(true)
    }
  }, [champSelect.currentAction, champSelect.isMyTurn, champSelect.phase])

  const handleTogglePicker = () => {
    setIsPickerOpen((currentIsOpen) => {
      const nextIsOpen = !currentIsOpen

      if (!nextIsOpen) {
        hasManuallyClosedRef.current = true
      }

      return nextIsOpen
    })
  }

  return (
    <main className='bg-background min-h-[calc(100vh-4rem)] space-y-4 px-3 py-4 pb-8 sm:px-4'>
      <PageHeader title={t('champSelect.title')} />

      <div className='motion-safe:animate-fade-in-up'>
        <ChampSelectTimerComponent
          isMyTurn={champSelect.isMyTurn}
          mode={champSelect.mode}
          phase={champSelect.phase}
          timer={champSelect.timer}
        />
      </div>

      {champSelect.error || champSelect.aram.error || champSelect.dataError ? (
        <div className={champSelectStyles.errorBanner} aria-live='polite'>
          {translatedErrorMessage(t, champSelect.error ?? champSelect.aram.error ?? champSelect.dataError)}
        </div>
      ) : null}

      <section className='grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]'>
        <div className='motion-safe:animate-fade-in-up-200'>
          <div className='space-y-4'>
            <div className='space-y-3'>
              <Button className='w-full justify-center' onClick={handleTogglePicker} variant='secondary'>
                {isPickerOpen
                  ? t('champSelect.hideChampionPicker', { defaultValue: 'Hide champion picker' })
                  : t('champSelect.openChampionPicker', { defaultValue: 'Open champion picker' })}
              </Button>

              {isPickerOpen ? <ChampionPicker /> : null}
            </div>

            {isChampionLockedIn ? (
              <Card className='border-border bg-secondary/85 overflow-hidden'>
                <CardContent className='pt-6'>
                  <SkinPicker
                    championKey={selectedChampion?.key ?? null}
                    onSelectSkin={(skinId) => {
                      return champSelect.changeSkin(skinId)
                    }}
                    selectedSkinId={champSelect.selection.skinId}
                    skins={selectedSkins}
                  />
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>

        <div className='motion-safe:animate-fade-in-up-300'>
          <aside className='flex h-[100dvh] flex-col gap-4 overflow-hidden'>
            <Card className='border-primary/30 bg-secondary/90'>
              <CardHeader>
                <CardTitle className='text-base tracking-[0.24em] uppercase'>{t('champSelect.actions')}</CardTitle>
              </CardHeader>

              <CardContent className='space-y-3'>
                <div className='border-border bg-secondary/60 rounded-md border p-3'>
                  <div className='font-display text-foreground text-sm font-medium tracking-[0.18em] uppercase'>
                    {selectedChampion?.name ?? t('champSelect.noChampionSelected')}
                  </div>

                  <div className='text-muted mt-1 text-xs'>
                    {selectedChampion?.title ?? t('champSelect.selectChampionHint')}
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-2'>
                  <Button
                    className='min-h-11'
                    disabled={!champSelect.isMyTurn || champSelect.phase !== 'pick' || !champSelect.selectedChampion}
                    onClick={() => {
                      return void champSelect.lockInChampion()
                    }}
                  >
                    {t('champSelect.lockIn')}
                  </Button>

                  {modeRules.hasBans ? (
                    <Button
                      className='min-h-11'
                      disabled={!champSelect.isMyTurn || champSelect.phase !== 'ban' || !champSelect.selectedChampion}
                      onClick={() => {
                        if (champSelect.selectedChampion) {
                          void champSelect.banChampion(champSelect.selectedChampion)
                        }
                      }}
                      variant='destructive'
                    >
                      {t('champSelect.ban')}
                    </Button>
                  ) : null}
                </div>

                {modeRules.hasSimultaneousBans && champSelect.phase === 'ban' ? (
                  <p className='text-muted text-xs'>{t('champSelect.simultaneousBans')}</p>
                ) : null}
              </CardContent>
            </Card>

            {modeRules.hasBench ? (
              <Bench
                bench={champSelect.aram.bench}
                canReroll={champSelect.aram.canReroll}
                isLoading={champSelect.aram.isLoading}
                onReroll={() => {
                  return void champSelect.aram.reroll()
                }}
                onSwap={(championId) => {
                  return void champSelect.aram.swapBench(championId)
                }}
                rerollCount={champSelect.aram.rerollCount}
              />
            ) : null}

            <PlayerSettings
              ddragonVersion={ddragonVersion.data}
              modeRules={modeRules}
              onChangeRune={(runeId) => {
                return champSelect.changeRune(runeId)
              }}
              onChangeSpell={(slot, spellId) => {
                return champSelect.changeSpell(slot, spellId)
              }}
              runeTrees={champSelect.runeTrees}
              selectedRuneId={champSelect.selection.runeId}
              selectedSpell1Id={champSelect.selection.spell1Id}
              selectedSpell2Id={champSelect.selection.spell2Id}
              summonerSpells={champSelect.summonerSpells}
            />
          </aside>
        </div>
      </section>

      <div className='motion-safe:animate-fade-in-up-100'>
        <ChampSelectMembers enemyTeam={champSelect.enemyTeam} team={champSelect.team} />
      </div>
    </main>
  )
}

export const Route = createFileRoute('/connected/champ-select')({
  component: ChampSelectRouteComponent,
})
