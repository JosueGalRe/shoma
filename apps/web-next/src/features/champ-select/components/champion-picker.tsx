import { type SyntheticEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { communityDragonSplashUrl, type ChampionSummary } from '@/core/http/ddragon-client'
import type { ChampionId } from '@/core/types/branded'

import { type ChampionCard } from '../aram-store'
import { championSplashUrl } from '../utils'

interface ChampionPickerProps {
  champions: ChampionSummary[]
  selectedChampion: ChampionSummary | null
  bannedChampions: ChampionId[]
  pickedChampionIds: Set<ChampionId>
  onSelectChampion: (championId: ChampionId) => void
  onSelectAramCard: (index: number) => void
  onDrawCards: () => void
  availableAramChampionIds: ChampionId[]
  mode: 'classic' | 'aram'
  aramState: { cards: ChampionCard[]; hasSelectedCard: boolean; canReroll: boolean } | null
  phaseState: { isMyTurn: boolean; phase: string; isLoading: boolean }
}

export function ChampionPicker({
  champions,
  selectedChampion,
  bannedChampions,
  pickedChampionIds,
  onSelectChampion,
  onSelectAramCard,
  onDrawCards,
  availableAramChampionIds,
  mode,
  aramState,
  phaseState,
}: ChampionPickerProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'name-asc' | 'name-desc'>('name-asc')

  const normalizedQuery = query.trim().toLowerCase()
  const compareChampions = (left: ChampionSummary, right: ChampionSummary) => {
    return sortOrder === 'name-asc' ? left.name.localeCompare(right.name) : right.name.localeCompare(left.name)
  }

  const visibleChampions = champions.filter((champion) => champion.name.toLowerCase().includes(normalizedQuery)).sort(compareChampions)
  const visibleAramCards = [...(aramState?.cards ?? [])]
    .filter((card) => {
      if (!normalizedQuery) {
        return true
      }

      const champion = champions.find((candidate) => candidate.id === card.championId)
      return champion?.name.toLowerCase().includes(normalizedQuery) ?? false
    })
    .sort((left, right) => {
      const leftChampion = champions.find((candidate) => candidate.id === left.championId)
      const rightChampion = champions.find((candidate) => candidate.id === right.championId)
      const leftName = leftChampion?.name ?? String(left.championId)
      const rightName = rightChampion?.name ?? String(right.championId)

      return sortOrder === 'name-asc' ? leftName.localeCompare(rightName) : rightName.localeCompare(leftName)
    })

  const handleSplashError = (event: SyntheticEvent<HTMLImageElement>) => {
    const fallbackUrl = event.currentTarget.dataset.fallbackUrl
    if (!fallbackUrl || event.currentTarget.src === fallbackUrl) {
      return
    }

    event.currentTarget.src = fallbackUrl
  }

  if (mode === 'aram' && aramState) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{aramState.hasSelectedCard ? t('champSelect.champion') : t('aram.cards.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_11rem]">
            <Input
              aria-label={t('champSelect.searchChampions', { defaultValue: 'Search champions' })}
              className="border-lol-border-subtle bg-lol-navy-950 text-lol-text-primary placeholder:text-lol-text-muted"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('champSelect.searchChampions', { defaultValue: 'Search champions' })}
              value={query}
            />
            <select
              aria-label={t('champSelect.sortChampions', { defaultValue: 'Sort champions' })}
              className="h-10 w-full rounded-md border border-lol-border-subtle bg-lol-navy-950 px-3 py-2 text-sm text-lol-text-primary focus-visible:border-lol-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold"
              onChange={(event) => setSortOrder(event.target.value as 'name-asc' | 'name-desc')}
              value={sortOrder}
            >
              <option value="name-asc">{t('champSelect.sortNameAsc', { defaultValue: 'Name (A-Z)' })}</option>
              <option value="name-desc">{t('champSelect.sortNameDesc', { defaultValue: 'Name (Z-A)' })}</option>
            </select>
          </div>
          {phaseState.isLoading ? <p className="text-sm text-lol-text-muted">{t('champSelect.loadingChampions')}</p> : null}
          {aramState.hasSelectedCard ? (
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
                {visibleAramCards.map((card, index) => {
                  const champion = champions.find((candidate) => candidate.id === card.championId)
                  const isDisabled = !phaseState.isMyTurn || phaseState.phase !== 'pick' || !champion

                  return (
                    <button
                      className={`overflow-hidden rounded-md border bg-lol-navy-900/60 text-left transition-all duration-150 hover:border-lol-border-gold hover:shadow-lol-glow-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold disabled:opacity-50 ${card.isBlessed ? 'border-lol-border-gold shadow-lol-glow-gold' : 'border-lol-border-subtle'}`}
                      disabled={isDisabled}
                      key={card.championId}
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
      <CardContent className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_11rem]">
          <Input
            aria-label={t('champSelect.searchChampions', { defaultValue: 'Search champions' })}
            className="border-lol-border-subtle bg-lol-navy-950 text-lol-text-primary placeholder:text-lol-text-muted"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('champSelect.searchChampions', { defaultValue: 'Search champions' })}
            value={query}
          />
          <select
            aria-label={t('champSelect.sortChampions', { defaultValue: 'Sort champions' })}
            className="h-10 w-full rounded-md border border-lol-border-subtle bg-lol-navy-950 px-3 py-2 text-sm text-lol-text-primary focus-visible:border-lol-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold"
            onChange={(event) => setSortOrder(event.target.value as 'name-asc' | 'name-desc')}
            value={sortOrder}
          >
            <option value="name-asc">{t('champSelect.sortNameAsc', { defaultValue: 'Name (A-Z)' })}</option>
            <option value="name-desc">{t('champSelect.sortNameDesc', { defaultValue: 'Name (Z-A)' })}</option>
          </select>
        </div>
        {phaseState.isLoading ? <p className="text-sm text-lol-text-muted">{t('champSelect.loadingChampions')}</p> : null}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {visibleChampions.map((champion) => {
            const isSelected = selectedChampion?.id === champion.id
            const isBanned = bannedChampions.includes(champion.id)
            const isPicked = pickedChampionIds.has(champion.id)
            const isDisabled = !phaseState.isMyTurn || isBanned || isPicked

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
