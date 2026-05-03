import { Trans, useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatSeconds } from '@core/rift/rift-lcu-utils'
import type { ChampSelectState } from '@core/rift/rift-lcu-types'
import type { ChampionMetadataById } from '@core/http/ddragon-client'
import { buildChampionIconUrl, formatChampionLabel } from '../-lobby-utils'

interface ChampSelectCardProps {
  champSelectState: ChampSelectState | null
  championNamesById: Record<number, string>
  championMetadataById: ChampionMetadataById
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
  championMetadataById,
  rerollPending,
  rerollPoints,
  rerollChampion,
  benchSwapPendingId,
  swapBenchChampion,
  ddragonVersion,
}: ChampSelectCardProps) {
  const { t } = useTranslation()

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
                      const championKey = championMetadataById[championId]?.key
                      const iconUrl = championKey ? buildChampionIconUrl(ddragonVersion, championKey) : null
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
