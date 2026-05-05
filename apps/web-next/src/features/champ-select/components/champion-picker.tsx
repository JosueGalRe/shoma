import { type SyntheticEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { communityDragonSplashUrl, type ChampionSummary } from '@/core/http/ddragon-client'

import { type ChampionCard } from '../aram-store'
import { championSplashUrl } from '../utils'

interface ChampionPickerProps {
  champions: ChampionSummary[]
  selectedChampion: ChampionSummary | null
  bannedChampions: number[]
  pickedChampionIds: Set<number>
  isMyTurn: boolean
  phase: string
  isAram: boolean
  aramCards: ChampionCard[]
  hasSelectedAramCard: boolean
  onSelectChampion: (championId: number) => void
  onSelectAramCard: (index: number) => void
  onDrawCards: () => void
  availableAramChampionIds: number[]
  canReroll: boolean
  isLoading: boolean
}

export function ChampionPicker({
  champions,
  selectedChampion,
  bannedChampions,
  pickedChampionIds,
  isMyTurn,
  phase,
  isAram,
  aramCards,
  hasSelectedAramCard,
  onSelectChampion,
  onSelectAramCard,
  onDrawCards,
  availableAramChampionIds,
  isLoading,
}: ChampionPickerProps) {
  const { t } = useTranslation()
  const handleSplashError = (event: SyntheticEvent<HTMLImageElement>) => {
    const fallbackUrl = event.currentTarget.dataset.fallbackUrl
    if (!fallbackUrl || event.currentTarget.src === fallbackUrl) {
      return
    }

    event.currentTarget.src = fallbackUrl
  }

  if (isAram) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{hasSelectedAramCard ? t('champSelect.champion') : t('aram.cards.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? <p className="text-sm text-lol-text-muted">{t('champSelect.loadingChampions')}</p> : null}
          {hasSelectedAramCard ? (
            <div className="overflow-hidden rounded-md border border-lol-border-gold bg-lol-navy-900/60 shadow-lol-glow-gold">
              <img
                alt=""
                className="h-48 w-full object-cover"
                data-fallback-url={selectedChampion ? communityDragonSplashUrl(selectedChampion.key, 0) : undefined}
                loading="lazy"
                onError={handleSplashError}
                src={selectedChampion ? championSplashUrl(selectedChampion.key) ?? undefined : undefined}
              />
              <div className="p-3">
                <div className="font-display text-lg font-semibold uppercase tracking-[0.18em] text-lol-gold">{selectedChampion?.name ?? t('champSelect.noChampionSelected')}</div>
                <div className="text-sm text-lol-text-secondary">{selectedChampion?.title ?? t('champSelect.selectChampionHint')}</div>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-lol-text-muted">{t('aram.cards.description')}</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {aramCards.map((card, index) => {
                  const champion = champions.find((candidate) => candidate.id === card.championId)
                  const isDisabled = !isMyTurn || phase !== 'pick' || !champion

                  return (
                    <button
                      className={`overflow-hidden rounded-md border bg-lol-navy-900/60 text-left transition-all duration-150 hover:border-lol-border-gold hover:shadow-lol-glow-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold disabled:opacity-50 ${card.isBlessed ? 'border-lol-border-gold shadow-lol-glow-gold' : 'border-lol-border-subtle'}`}
                      disabled={isDisabled}
                      key={`${card.championId}-${index}`}
                      onClick={() => onSelectAramCard(index)}
                      type="button"
                    >
                      <img
                        alt=""
                        className="h-28 w-full object-cover"
                        data-fallback-url={champion ? communityDragonSplashUrl(champion.key, 0) : undefined}
                        loading="lazy"
                        onError={handleSplashError}
                        src={champion ? championSplashUrl(champion.key) ?? undefined : undefined}
                      />
                      <div className="space-y-2 p-2">
                        <div className="truncate font-display text-sm font-medium uppercase tracking-[0.14em] text-lol-text-primary">{champion?.name ?? t('champSelect.championLabel', { value: card.championId })}</div>
                        {card.isBlessed ? <div className="text-xs font-semibold text-lol-gold">{t('aram.cards.blessed')}</div> : null}
                        <div className="text-xs text-lol-text-muted">{t('aram.cards.select')}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
              <Button disabled={availableAramChampionIds.length === 0} onClick={onDrawCards} variant="secondary">
                {t('aram.cards.drawNew')}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('champSelect.champions')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-sm text-lol-text-muted">{t('champSelect.loadingChampions')}</p> : null}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {champions.map((champion) => {
            const isSelected = selectedChampion?.id === champion.id
            const isBanned = bannedChampions.includes(champion.id)
            const isPicked = pickedChampionIds.has(champion.id)
            const isDisabled = !isMyTurn || isBanned || isPicked

            return (
              <button
                className={`overflow-hidden rounded-md border bg-lol-navy-900/60 text-left transition-all duration-150 hover:border-lol-border-gold hover:shadow-lol-glow-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold disabled:opacity-50 ${isSelected ? 'border-lol-border-gold shadow-lol-glow-gold' : 'border-lol-border-subtle'}`}
                disabled={isDisabled}
                key={champion.id}
                onClick={() => onSelectChampion(champion.id)}
                type="button"
              >
                <img
                  alt=""
                  className="h-20 w-full object-cover"
                  data-fallback-url={communityDragonSplashUrl(champion.key, 0)}
                  loading="lazy"
                  onError={handleSplashError}
                  src={championSplashUrl(champion.key) ?? undefined}
                />
                <div className="p-2">
                  <div className="truncate font-display text-sm font-medium uppercase tracking-[0.12em] text-lol-text-primary">{champion.name}</div>
                  <div className="text-xs text-lol-text-muted">
                    {isBanned ? t('champSelect.banned') : isPicked ? t('champSelect.picked') : isSelected ? t('champSelect.selected') : t('champSelect.available')}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
