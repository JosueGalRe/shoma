import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatSeconds } from '@core/rift/rift-lcu-utils'
import type { ChampSelectState } from '@core/rift/rift-lcu-types'
import { buildChampionIconUrl, buildChampionSplashUrl, formatChampionLabel } from '../-lobby-utils'

interface ChampSelectCardProps {
  champSelectState: ChampSelectState | null
  championNamesById: Record<number, string>
  visibleSelectableChampionIds: number[]
  championSelectionDraft: string
  updateChampionSelectionDraft: (value: string) => Promise<void>
  completeCurrentChampSelectAction: () => Promise<void>
  patchChampSelectSelection: (championId: number) => Promise<void>
  rerollPending: boolean
  rerollPoints: { currentPoints: number; maxRolls: number; numberOfRolls: number; pointsCostToRoll: number } | null | undefined
  rerollChampion: () => Promise<void>
  benchSwapPendingId: number | null
  swapBenchChampion: (championId: number) => Promise<void>
  ddragonVersion: string | null
}

export function ChampSelectCard({
  champSelectState,
  championNamesById,
  visibleSelectableChampionIds,
  championSelectionDraft,
  updateChampionSelectionDraft,
  completeCurrentChampSelectAction,
  patchChampSelectSelection,
  rerollPending,
  rerollPoints,
  rerollChampion,
  benchSwapPendingId,
  swapBenchChampion,
  ddragonVersion,
}: ChampSelectCardProps) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')

  const selectedChampionId = championSelectionDraft ? Number(championSelectionDraft) : null
  const selectedChampionName = selectedChampionId ? championNamesById[selectedChampionId] : null
  const selectedChampionSplashUrl = selectedChampionName ? buildChampionSplashUrl(selectedChampionName) : null
  const selectedChampionIconUrl = selectedChampionName ? buildChampionIconUrl(ddragonVersion, selectedChampionName) : null

  const filteredChampionIds = visibleSelectableChampionIds.filter((id) => {
    if (!searchQuery) return true
    const name = championNamesById[id]
    if (!name) return false
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <Card className='sm:col-span-2'>
      <CardHeader className='pb-3'>
        <CardTitle className='font-display text-xs uppercase tracking-[0.2em] text-primary'>
          {t(($) => $.connected.champSelectTitle)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {champSelectState ? (
          <div className='space-y-6'>
            <div className='grid gap-3 sm:grid-cols-2'>
              <div className='flex justify-between items-center border-b border-gold-dim/20 pb-2 text-sm'>
                <span className='text-muted-foreground'>{t(($) => $.connected.champSelectPhaseLabel)}:</span>
                <span className='font-semibold text-foreground'>{champSelectState.phase}</span>
              </div>
              <div className='flex justify-between items-center border-b border-gold-dim/20 pb-2 text-sm'>
                <span className='text-muted-foreground'>{t(($) => $.connected.champSelectTimeLeftLabel)}:</span>
                <span className='font-semibold font-mono text-foreground'>
                  {champSelectState.timeLeftInPhaseMs !== null
                    ? formatSeconds(Math.round(champSelectState.timeLeftInPhaseMs / 1000))
                    : t(($) => $.connected.unknown)}
                </span>
              </div>
              <div className='flex justify-between items-center border-b border-gold-dim/20 pb-2 text-sm'>
                <span className='text-muted-foreground'>{t(($) => $.connected.champSelectMyTeamLabel)}:</span>
                <span className='font-semibold text-foreground'>{champSelectState.myTeamCount}</span>
              </div>
              <div className='flex justify-between items-center border-b border-gold-dim/20 pb-2 text-sm'>
                <span className='text-muted-foreground'>{t(($) => $.connected.champSelectEnemyTeamLabel)}:</span>
                <span className='font-semibold text-foreground'>{champSelectState.theirTeamCount}</span>
              </div>
              <div className='flex justify-between items-center border-b border-gold-dim/20 pb-2 text-sm'>
                <span className='text-muted-foreground'>{t(($) => $.connected.champSelectLocalCellLabel)}:</span>
                <span className='font-semibold text-foreground'>{champSelectState.localPlayerCellId ?? t(($) => $.connected.unknown)}</span>
              </div>
              <div className='flex justify-between items-center border-b border-gold-dim/20 pb-2 text-sm'>
                <span className='text-muted-foreground'>{t(($) => $.connected.champSelectSelectedChampLabel)}:</span>
                <span className='font-semibold text-foreground'>
                  {formatChampionLabel(
                    champSelectState.localPlayerChampionId || champSelectState.localChampionPickIntentId,
                    championNamesById,
                    t(($) => $.connected.unknown),
                  )}
                </span>
              </div>
              <div className='flex justify-between items-center border-b border-gold-dim/20 pb-2 text-sm'>
                <span className='text-muted-foreground'>{t(($) => $.connected.champSelectCurrentActionLabel)}:</span>
                <span className='font-semibold text-foreground'>{champSelectState.currentActionType ?? t(($) => $.connected.unknown)}</span>
              </div>
              <div className='flex justify-between items-center border-b border-gold-dim/20 pb-2 text-sm'>
                <span className='text-muted-foreground'>{t(($) => $.connected.champSelectYourTurnLabel)}:</span>
                <span className='font-semibold text-foreground'>
                  {champSelectState.isLocalPlayerTurn ? t(($) => $.connected.yes) : t(($) => $.connected.no)}
                </span>
              </div>
              <div className='flex justify-between items-center border-b border-gold-dim/20 pb-2 text-sm'>
                <span className='text-muted-foreground'>{t(($) => $.connected.champSelectActionChampionLabel)}:</span>
                <span className='font-semibold text-foreground'>
                  {formatChampionLabel(champSelectState.currentActionChampionId, championNamesById, t(($) => $.connected.unknown))}
                </span>
              </div>
              <div className='flex justify-between items-center border-b border-gold-dim/20 pb-2 text-sm'>
                <span className='text-muted-foreground'>{t(($) => $.connected.champSelectLockedInLabel)}:</span>
                <span className='font-semibold text-foreground'>
                  {champSelectState.hasLockedChampion ? t(($) => $.connected.yes) : t(($) => $.connected.no)}
                </span>
              </div>
            </div>

            {champSelectState.currentActionId !== null || champSelectState.hoverActionId !== null ? (
              <div className='rounded-xl border border-gold-dim/30 bg-background/40 p-4'>
                <p className='font-display text-sm uppercase tracking-[0.1em] text-primary'>
                  {t(($) => $.connected.champSelectActionTitle)}
                </p>
                {visibleSelectableChampionIds.length > 0 ? (
                  <div className='mt-4 flex flex-col gap-3'>
                    {selectedChampionSplashUrl ? (
                      <img
                        src={selectedChampionSplashUrl}
                        alt={selectedChampionName || 'Champion Splash'}
                        className='w-full h-48 object-cover rounded-xl border border-gold-dim/50'
                      />
                    ) : null}
                    <div className='flex flex-col gap-3'>
                      <Input
                        placeholder='Search champions...'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className='bg-background/60 border-gold-dim/50 focus-visible:ring-primary text-foreground'
                      />

                      <div className='grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-64 overflow-y-auto p-1'>
                        {filteredChampionIds.map((championId) => {
                          const isSelected = championSelectionDraft === String(championId)
                          const isBanned = champSelectState.bannedChampionIds.includes(championId)
                          const championName = championNamesById[championId]
                          const iconUrl = championName ? buildChampionIconUrl(ddragonVersion, championName) : null
                          
                          return (
                            <button
                              key={championId}
                              type="button"
                              disabled={isBanned}
                              onClick={() => {
                                if (!isBanned) {
                                  void updateChampionSelectionDraft(String(championId))
                                }
                              }}
                              className={`
                                relative group aspect-square rounded-lg border-2 overflow-hidden transition-all
                                ${isBanned ? 'border-destructive/50 grayscale opacity-50 cursor-not-allowed' : 
                                  isSelected ? 'border-primary shadow-[0_0_10px_rgba(200,169,110,0.4)] scale-105 z-10' : 
                                  'border-gold-dim/50 hover:border-primary/70 hover:scale-105'}
                              `}
                            >
                              {iconUrl ? (
                                <img
                                  src={iconUrl}
                                  alt={championName || 'Champion Icon'}
                                  className='w-full h-full object-cover'
                                />
                              ) : (
                                <div className='w-full h-full bg-background flex items-center justify-center text-xs text-muted-foreground'>
                                  ?
                                </div>
                              )}
                              
                              <div className='absolute bottom-0 left-0 right-0 bg-black/80 text-foreground text-[10px] sm:text-xs text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity truncate px-1'>
                                {formatChampionLabel(championId, championNamesById, t(($) => $.connected.unknown))}
                              </div>
                            </button>
                          )
                        })}
                      </div>

                      <div className='flex justify-end mt-2 gap-2'>
                        {champSelectState.currentActionType !== 'pick' ? (
                          <Button
                            variant='outline'
                            className='font-display tracking-wider uppercase'
                            disabled={championSelectionDraft.length === 0}
                            onClick={() => {
                              if (champSelectState.currentActionType === 'ban') {
                                void completeCurrentChampSelectAction()
                                return
                              }

                              void patchChampSelectSelection(Number(championSelectionDraft))
                            }}
                            type='button'
                          >
                            {champSelectState.currentActionType === 'ban'
                              ? t(($) => $.connected.champSelectActionBan)
                              : t(($) => $.connected.champSelectActionHover)}
                          </Button>
                        ) : null}
                        {champSelectState.currentActionType === 'pick' ? (
                          <Button
                            variant='hextech'
                            className='font-display tracking-wider uppercase'
                            disabled={
                              championSelectionDraft.length === 0 ||
                              (champSelectState.currentActionId === null && champSelectState.hoverActionId === null)
                            }
                            onClick={() => {
                              void completeCurrentChampSelectAction()
                            }}
                            type='button'
                          >
                            {t(($) => $.connected.champSelectActionLock)}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2'>
                    {Array.from({ length: 10 }).map((_, i) => (
                      <Skeleton key={i} className='aspect-square w-full rounded-lg' />
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {champSelectState.benchEnabled ? (
              <div className='rounded-xl border border-gold-dim/30 bg-background/40 p-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='font-display text-sm uppercase tracking-[0.1em] text-primary'>
                      {t(($) => $.connected.champSelectRerollTitle)}
                    </p>
                    <p className='mt-1 text-xs text-muted-foreground'>
                      <Trans
                        components={{ value: <span className='font-semibold text-foreground' /> }}
                        i18nKey={($) => $.connected.champSelectRerollValue}
                        values={{ value: `${rerollPoints?.numberOfRolls ?? 0}/${rerollPoints?.maxRolls ?? 0}` }}
                      />
                    </p>
                  </div>
                  <Button
                    variant='hextech'
                    size='sm'
                    className='font-display tracking-wider uppercase'
                    disabled={rerollPending || !rerollPoints || rerollPoints.numberOfRolls < 1}
                    onClick={() => {
                      void rerollChampion()
                    }}
                    type='button'
                  >
                    {t(($) => $.connected.champSelectRerollAction)}
                  </Button>
                </div>

                {champSelectState.benchChampionIds.length > 0 ? (
                  <div className='mt-4 flex flex-wrap gap-2'>
                    {champSelectState.benchChampionIds.map((championId) => {
                      const championName = championNamesById[championId]
                      const iconUrl = championName ? buildChampionIconUrl(ddragonVersion, championName) : null
                      return (
                        <Button
                          variant='outline'
                          size='sm'
                          className='font-display tracking-wider uppercase flex items-center gap-2'
                          disabled={benchSwapPendingId !== null}
                          key={championId}
                          onClick={() => {
                            void swapBenchChampion(championId)
                          }}
                          type='button'
                        >
                          {iconUrl ? (
                            <img
                              src={iconUrl}
                              alt={championName || 'Champion Icon'}
                              className='h-8 w-8 rounded-full'
                            />
                          ) : null}
                          {formatChampionLabel(championId, championNamesById, t(($) => $.connected.unknown))}
                        </Button>
                      )
                    })}
                  </div>
                ) : (
                  <p className='mt-3 text-sm text-muted-foreground italic'>{t(($) => $.connected.champSelectBenchEmpty)}</p>
                )}
              </div>
            ) : null}
          </div>
        ) : (
          <div className='flex h-full min-h-[120px] items-center justify-center'>
            <p className='text-muted-foreground italic'>{t(($) => $.connected.champSelectNoSession)}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
