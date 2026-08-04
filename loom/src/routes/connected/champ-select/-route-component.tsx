import { useEffect, useRef, useState } from 'react'

import { useTranslation } from 'react-i18next'

import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLatestDdragonVersion } from '@/core/http/ddragon'
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

export function ChampSelectRouteComponent() {
  const { t } = useTranslation()
  const ddragonVersion = useLatestDdragonVersion()
  const champSelect = useChampSelect()
  const modeRules = getModeRules(champSelect.mode)
  const selectedChampion =
    champSelect.champions.find((champion) => {
      return champion.id === champSelect.selectedChampion
    }) ?? null
  const selectedSkins = champSelect.championSkins
  const lastActionIdRef = useRef<number | null>(null)
  const hasManuallyClosedRef = useRef(false)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const localMember = champSelect.team.find((member) => {
    return member.cellId === champSelect.localPlayerCellId
  })
  const isChampionLockedIn = (localMember?.championId ?? 0) > 0

  // External system sync: open the picker once per new local pick/ban action while preserving manual close state.
  useEffect(() => {
    const { currentAction } = champSelect
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
    if (isPickerOpen) {
      hasManuallyClosedRef.current = true
    }

    setIsPickerOpen(!isPickerOpen)
  }

  return (
    <main className="bg-background min-h-[calc(100vh-4rem)] space-y-4 px-3 py-4 pb-8 sm:px-4">
      <PageHeader title={t('champSelect.title')} />

      <div className="motion-safe:animate-fade-in-up">
        <ChampSelectTimerComponent
          isMyTurn={champSelect.isMyTurn}
          mode={champSelect.mode}
          phase={champSelect.phase}
          timer={champSelect.timer}
        />
      </div>

      {champSelect.error || champSelect.aram.error || champSelect.dataError ? (
        <div className={champSelectStyles.errorBanner} aria-live="polite">
          {translatedErrorMessage(t, champSelect.error ?? champSelect.aram.error ?? champSelect.dataError)}
        </div>
      ) : null}

      <section className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="motion-safe:animate-fade-in-up-200">
          <div className="space-y-4">
            <div className="space-y-3">
              <Button className="w-full justify-center" onClick={handleTogglePicker} variant="secondary">
                {isPickerOpen
                  ? t('champSelect.hideChampionPicker', { defaultValue: 'Hide champion picker' })
                  : t('champSelect.openChampionPicker', { defaultValue: 'Open champion picker' })}
              </Button>

              {isPickerOpen ? (
                <ChampionPicker
                  aramCards={champSelect.aram.cards}
                  bannedChampions={champSelect.bannedChampions}
                  champions={champSelect.champions}
                  enemyTeam={champSelect.enemyTeam}
                  isAram={champSelect.isAram}
                  isLoading={champSelect.isLoading}
                  isMyTurn={champSelect.isMyTurn}
                  onSelectChampion={(championId) => {
                    return void champSelect.selectChampionForTurn(championId)
                  }}
                  phase={champSelect.phase}
                  selectedChampionId={champSelect.selectedChampion}
                  team={champSelect.team}
                />
              ) : null}
            </div>

            {isChampionLockedIn ? (
              <Card className="border-border bg-secondary/85 overflow-hidden">
                <CardContent className="pt-6">
                  <SkinPicker
                    championKey={selectedChampion?.key ?? null}
                    onSelectSkin={(skinId) => {
                      return void champSelect.changeSkin(skinId)
                    }}
                    selectedSkinId={champSelect.selection.skinId}
                    skins={selectedSkins}
                  />
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>

        <div className="motion-safe:animate-fade-in-up-300">
          <aside className="flex h-[100dvh] flex-col gap-4 overflow-hidden">
            <Card className="border-primary/30 bg-secondary/90">
              <CardHeader>
                <CardTitle className="text-base tracking-[0.24em] uppercase">{t('champSelect.actions')}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="border-border bg-secondary/60 rounded-md border p-3">
                  <div className="font-display text-foreground text-sm font-medium tracking-[0.18em] uppercase">
                    {selectedChampion?.name ?? t('champSelect.noChampionSelected')}
                  </div>

                  <div className="text-muted mt-1 text-xs">
                    {selectedChampion?.title ?? t('champSelect.selectChampionHint')}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    className="min-h-11"
                    disabled={!champSelect.isMyTurn || champSelect.phase !== 'pick' || !champSelect.selectedChampion}
                    onClick={() => {
                      return void champSelect.lockInChampion()
                    }}
                  >
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

                {modeRules.hasSimultaneousBans && champSelect.phase === 'ban' ? (
                  <p className="text-muted text-xs">{t('champSelect.simultaneousBans')}</p>
                ) : null}
              </CardContent>
            </Card>

            {modeRules.hasBench ? (
              <Bench
                bench={champSelect.aram.bench}
                onSwap={(championId) => {
                  return void champSelect.aram.swapBench(championId)
                }}
              />
            ) : null}

            <PlayerSettings
              ddragonVersion={ddragonVersion.data}
              modeRules={modeRules}
              onChangeSpell={(slot, spellId) => {
                return void champSelect.changeSpell(slot, spellId)
              }}
              runeTrees={champSelect.runeTrees}
              selectedRuneId={champSelect.selectedRuneId}
              selectedSpell1Id={champSelect.selection.spell1Id}
              selectedSpell2Id={champSelect.selection.spell2Id}
              summonerSpells={champSelect.summonerSpells}
            />
          </aside>
        </div>
      </section>

      <div className="motion-safe:animate-fade-in-up-100">
        <ChampSelectMembers enemyTeam={champSelect.enemyTeam} team={champSelect.team} />
      </div>
    </main>
  )
}
