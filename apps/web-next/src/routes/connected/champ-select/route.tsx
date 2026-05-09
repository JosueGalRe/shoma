import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChampionId, type ChampionId as ChampionIdType } from '@/core/types/branded'
import { useLatestDdragonVersion } from '@/core/http/ddragon-client'
import {
  Bench,
  ChampSelectMembers,
  ChampSelectTimerComponent,
  ChampionPicker,
  PlayerSettings,
  RuneEditor,
  SkinPicker,
  useChampSelect,
} from '@/features/champ-select'
import { getModeRules } from '@/features/modes/mode-engine'

function translatedErrorMessage(t: (key: string) => string, error: string | null): string | null {
  return error ? t(error) : null
}

function ChampSelectRouteComponent() {
  const { t } = useTranslation()
  const ddragonVersion = useLatestDdragonVersion()
  const champSelect = useChampSelect()
  const modeRules = getModeRules(champSelect.mode)
  const selectedChampion = champSelect.champions.find((champion) => champion.id === champSelect.selectedChampion) ?? null
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
  const localMember = champSelect.team.find((member) => member.cellId === champSelect.localPlayerCellId)
  const isChampionLockedIn = (localMember?.championId ?? 0) > 0

  const shouldDrawAramCards = champSelect.isAram && !hasSelectedAramCard && champSelect.aram.cards.length === 0 && availableAramChampionIds.length > 0

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
    const currentAction = champSelect.currentAction
    const currentActionId = currentAction?.id ?? null

    if (lastActionIdRef.current !== currentActionId) {
      lastActionIdRef.current = currentActionId
      hasManuallyClosedRef.current = false
    }

    if (!champSelect.isMyTurn || !currentAction || currentAction.completed || (currentAction.type !== 'pick' && currentAction.type !== 'ban') || (champSelect.phase !== 'pick' && champSelect.phase !== 'ban')) {
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
    <main className="min-h-[calc(100vh-4rem)] space-y-4 bg-[radial-gradient(circle_at_top,rgba(191,155,63,0.14),transparent_38%),linear-gradient(180deg,rgba(10,20,40,0.98),rgba(5,8,14,1))] px-3 py-4 pb-8 sm:px-4">
      <ChampSelectTimerComponent
        isMyTurn={champSelect.isMyTurn}
        mode={champSelect.mode}
        phase={champSelect.phase}
        timer={champSelect.timer}
      />

      {(champSelect.error || champSelect.aram.error || champSelect.dataError) ? (
        <div className="rounded-md border border-red-900/70 bg-red-950/40 p-3 text-sm text-red-300 shadow-lol-shadow-md" aria-live="polite">
          {translatedErrorMessage(t, champSelect.error ?? champSelect.aram.error ?? champSelect.dataError)}
        </div>
      ) : null}

      <section className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="space-y-4">
          <div className="space-y-3">
            <Button className="w-full justify-center" onClick={handleTogglePicker} variant="secondary">
              {isPickerOpen ? t('champSelect.hideChampionPicker', { defaultValue: 'Hide champion picker' }) : t('champSelect.openChampionPicker', { defaultValue: 'Open champion picker' })}
            </Button>

            {isPickerOpen ? <ChampionPicker /> : null}
          </div>

          {isChampionLockedIn ? (
            <Card className="overflow-hidden border-lol-border-subtle bg-lol-navy-900/85">
              <CardContent className="pt-6">
              <SkinPicker
                  championKey={selectedChampion?.key ?? null}
                  onSelectSkin={(skinId) => champSelect.changeSkin(skinId)}
                  selectedSkinId={champSelect.selection.skinId}
                  skins={selectedSkins}
                />
              </CardContent>
            </Card>
          ) : null}
        </div>

        <aside className="flex h-[100dvh] flex-col gap-4 overflow-hidden">
          <Card className="border-lol-border-gold/30 bg-lol-navy-900/90">
            <CardHeader>
              <CardTitle className="text-base uppercase tracking-[0.24em]">{t('champSelect.actions')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md border border-lol-border-subtle bg-lol-navy-800/60 p-3">
                <div className="font-display text-sm font-medium uppercase tracking-[0.18em] text-lol-text-primary">{selectedChampion?.name ?? t('champSelect.noChampionSelected')}</div>
                <div className="mt-1 text-xs text-lol-text-muted">{selectedChampion?.title ?? t('champSelect.selectChampionHint')}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button className="min-h-11" disabled={!champSelect.isMyTurn || champSelect.phase !== 'pick' || !champSelect.selectedChampion} onClick={() => void champSelect.lockInChampion()}>
                  {t('champSelect.lockIn')}
                </Button>
                {modeRules.hasBans ? (
                  <Button
                    className="min-h-11"
                    disabled={!champSelect.isMyTurn || champSelect.phase !== 'ban' || !champSelect.selectedChampion}
                    onClick={() => {
                      if (champSelect.selectedChampion) {
                        void champSelect.banChampion(champSelect.selectedChampion)
                      }
                    }}
                    variant="destructive"
                  >
                    {t('champSelect.ban')}
                  </Button>
                ) : null}
              </div>
              {modeRules.hasSimultaneousBans && champSelect.phase === 'ban' ? <p className="text-xs text-lol-text-muted">{t('champSelect.simultaneousBans')}</p> : null}
            </CardContent>
          </Card>

          {modeRules.hasBench ? (
            <Bench
              bench={champSelect.aram.bench}
              canReroll={champSelect.aram.canReroll}
              isLoading={champSelect.aram.isLoading}
              onReroll={() => void champSelect.aram.reroll()}
              onSwap={(championId) => void champSelect.aram.swapBench(championId)}
              rerollCount={champSelect.aram.rerollCount}
            />
          ) : null}

          <PlayerSettings
            ddragonVersion={ddragonVersion.data}
            modeRules={modeRules}
            onChangeRune={(runeId) => champSelect.changeRune(runeId)}
            onChangeSpell={(slot, spellId) => champSelect.changeSpell(slot, spellId)}
            runeTrees={champSelect.runeTrees}
            selectedRuneId={champSelect.selection.runeId}
            selectedSpell1Id={champSelect.selection.spell1Id}
            selectedSpell2Id={champSelect.selection.spell2Id}
            summonerSpells={champSelect.summonerSpells}
          />

          <RuneEditor runeTrees={champSelect.runeTrees} />
        </aside>
      </section>

      <ChampSelectMembers enemyTeam={champSelect.enemyTeam} team={champSelect.team} />
    </main>
  )
}

export const Route = createFileRoute('/connected/champ-select')({
  component: ChampSelectRouteComponent,
})
