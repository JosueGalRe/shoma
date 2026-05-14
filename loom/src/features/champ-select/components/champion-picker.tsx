import { type SyntheticEvent, useState, useRef } from 'react'
import { Shield, Star, Dices } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { communityDragonSplashUrl, type ChampionSummary } from '@/core/http/ddragon-client'
import { ChampionId, type ChampionId as ChampionIdType } from '@/core/types/branded'

import { useAramStore } from '../aram-store'
import { useChampSelectStore } from '../champ-select-store'
import { championSplashUrl } from '../utils'
import { AbilityPreviewSheet } from './ability-preview-sheet'

export function ChampionPicker() {
  const { t } = useTranslation()
  const bannedChampions = useChampSelectStore((state) => state.bannedChampions)
  const champions = useChampSelectStore((state) => state.champions)
  const enemyTeam = useChampSelectStore((state) => state.enemyTeam)
  const isAram = useChampSelectStore((state) => state.isAram)
  const isLoading = useChampSelectStore((state) => state.isLoading)
  const isMyTurn = useChampSelectStore((state) => state.isMyTurn)
  const phase = useChampSelectStore((state) => state.phase)
  const selectedChampionId = useChampSelectStore((state) => state.selectedChampion)
  const team = useChampSelectStore((state) => state.team)
  const aramCanReroll = useAramStore((state) => state.canReroll)
  const aramCards = useAramStore((state) => state.cards)
  const aramDrawCards = useAramStore((state) => state.drawCards)
  const aramSelectCard = useAramStore((state) => state.selectCard)
  const aramSelectedCardIndex = useAramStore((state) => state.selectedCardIndex)
  const [query, setQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'name-asc' | 'name-desc'>('name-asc')
  const [activeRoleFilter, setActiveRoleFilter] = useState<string | null>(null)
  const [previewChampionKey, setPreviewChampionKey] = useState<string | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const timerRef = useRef<number | null>(null)
  const isLongPressTriggered = useRef(false)

  const handlePointerDown = (championKey: string) => {
    isLongPressTriggered.current = false
    timerRef.current = window.setTimeout(() => {
      isLongPressTriggered.current = true
      setPreviewChampionKey(championKey)
      setIsPreviewOpen(true)
    }, 800)
  }

  const handlePointerUp = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const selectedChampion = champions.find((champion) => champion.id === selectedChampionId) ?? null
  const pickedChampionIds = new Set<ChampionIdType>()
  const allyPickIntents = new Set<ChampionIdType>()

  for (const member of team) {
    if (member.championId > 0) {
      pickedChampionIds.add(ChampionId(member.championId))
    }
    if (member.championPickIntent && member.championPickIntent > 0) {
      allyPickIntents.add(ChampionId(member.championPickIntent))
    }
  }

  for (const member of enemyTeam) {
    if (member.championId > 0) {
      pickedChampionIds.add(ChampionId(member.championId))
    }
  }

  const availableAramChampionIds = champions.reduce<ChampionIdType[]>((acc, champion) => {
    if (!bannedChampions.includes(champion.id) && !pickedChampionIds.has(champion.id)) {
      acc.push(champion.id)
    }

    return acc
  }, [])
  const hasSelectedAramCard = aramSelectedCardIndex !== null
  const normalizedQuery = query.trim().toLowerCase()
  const compareChampions = (left: ChampionSummary, right: ChampionSummary) => {
    return sortOrder === 'name-asc' ? left.name.localeCompare(right.name) : right.name.localeCompare(left.name)
  }

  const visibleChampions = champions
    .filter((champion) => {
      if (activeRoleFilter && !champion.tags.includes(activeRoleFilter)) {
        return false
      }
      return champion.name.toLowerCase().includes(normalizedQuery)
    })
    .sort(compareChampions)
  const visibleAramCards = [...aramCards]
    .filter((card) => {
      const champion = champions.find((candidate) => candidate.id === card.championId)
      if (activeRoleFilter && champion && !champion.tags.includes(activeRoleFilter)) {
        return false
      }
      if (!normalizedQuery) {
        return true
      }

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

  const searchAndFilterUi = (
    <div className="space-y-3">
      <Input
        aria-label={t('champSelect.searchChampions', { defaultValue: 'Search champions' })}
        className="h-11 border-border bg-background text-foreground placeholder:text-muted"
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t('champSelect.searchChampions', { defaultValue: 'Search champions' })}
        value={query}
      />
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          className={`shrink-0 rounded-full border h-11 px-4 text-sm transition-colors ${sortOrder === 'name-asc' ? 'border-primary bg-secondary/60 text-primary' : 'border-border text-muted hover:text-foreground'}`}
          onClick={() => setSortOrder('name-asc')}
          type="button"
        >
          {t('champSelect.sortNameAsc', { defaultValue: 'Name (A-Z)' })}
        </button>
        <button
          className={`shrink-0 rounded-full border h-11 px-4 text-sm transition-colors ${sortOrder === 'name-desc' ? 'border-primary bg-secondary/60 text-primary' : 'border-border text-muted hover:text-foreground'}`}
          onClick={() => setSortOrder('name-desc')}
          type="button"
        >
          {t('champSelect.sortNameDesc', { defaultValue: 'Name (Z-A)' })}
        </button>
        <div className="mx-1 w-px shrink-0 bg-border" />
        {['Assassin', 'Fighter', 'Mage', 'Marksman', 'Support', 'Tank'].map((role) => (
          <button
            className={`shrink-0 rounded-full border h-11 px-4 text-sm transition-colors ${activeRoleFilter === role ? 'border-primary bg-secondary/60 text-primary' : 'border-border text-muted hover:text-foreground'}`}
            key={role}
            onClick={() => setActiveRoleFilter(activeRoleFilter === role ? null : role)}
            type="button"
          >
            {role}
          </button>
        ))}
      </div>
    </div>
  )

  if (isAram) {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle>{hasSelectedAramCard ? t('champSelect.champion') : t('aram.cards.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {searchAndFilterUi}
            {isLoading ? <p className="text-sm text-muted">{t('champSelect.loadingChampions')}</p> : null}
            {hasSelectedAramCard ? (
              <div className="overflow-hidden rounded-md border border-primary bg-secondary/60 shadow-[0_0_20px_var(--shoma-primary)]">
                <img
                  alt=""
                  className="h-48 w-full object-cover"
                  data-fallback-url={selectedChampion ? communityDragonSplashUrl(selectedChampion.key, 0) : undefined}
                  loading="lazy"
                  onError={handleSplashError}
                  src={selectedChampion ? championSplashUrl(selectedChampion.key) ?? undefined : undefined}
                />
                <div className="p-3">
                  <div className="font-display text-lg font-semibold uppercase tracking-[0.18em] text-primary">{selectedChampion?.name ?? t('champSelect.noChampionSelected')}</div>
                  <div className="text-sm text-muted">{selectedChampion?.title ?? t('champSelect.selectChampionHint')}</div>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted">{t('aram.cards.description')}</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {visibleAramCards.map((card) => {
                    const champion = champions.find((candidate) => candidate.id === card.championId)
                    const isDisabled = !isMyTurn || phase !== 'pick' || !champion
                    const originalIndex = aramCards.findIndex((candidate) => candidate.championId === card.championId)

                    const isCrowdFavorite = card.type === 'crowd-favorite'
                    const isBravery = card.type === 'bravery'
                    const isBlessed = card.isBlessed && !isCrowdFavorite

                    let borderClass = 'border-border'
                    if (isCrowdFavorite) borderClass = 'border-accent shadow-[0_0_20px_var(--shoma-accent)]'
                    else if (isBravery) borderClass = 'border-accent shadow-[0_0_20px_var(--shoma-accent)]'
                    else if (isBlessed) borderClass = 'border-primary shadow-[0_0_20px_var(--shoma-primary)]'

                    return (
                      <button
                        className={`overflow-hidden rounded-md border bg-secondary/60 text-left transition-all duration-150 hover:border-primary hover:shadow-[0_0_20px_var(--shoma-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${borderClass}`}
                        disabled={isDisabled}
                        key={card.championId}
                        onClick={(e) => {
                          if (isLongPressTriggered.current) {
                            e.preventDefault()
                            return
                          }
                          const selectedCard = aramSelectCard(originalIndex)
                          if (selectedCard) {
                            void useChampSelectStore.getState().selectChampionForTurn(selectedCard.championId)
                          }
                        }}
                        onPointerDown={() => champion && handlePointerDown(champion.key)}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
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
                          <div className="truncate font-display text-sm font-medium uppercase tracking-[0.14em] text-foreground">{champion?.name ?? t('champSelect.championLabel', { value: card.championId })}</div>
                          {isCrowdFavorite ? (
                            <div className="flex items-center gap-1 text-xs font-semibold text-accent">
                              <Star className="size-3" />
                              Crowd Favorite
                            </div>
                          ) : isBravery ? (
                            <div className="flex items-center gap-1 text-xs font-semibold text-accent">
                              <Dices className="size-3" />
                              Bravery
                            </div>
                          ) : isBlessed ? (
                            <div className="text-xs font-semibold text-primary">{t('aram.cards.blessed')}</div>
                          ) : null}
                          <div className="text-xs text-muted">{t('aram.cards.select')}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
                <Button disabled={availableAramChampionIds.length === 0} onClick={() => aramDrawCards(availableAramChampionIds, aramCanReroll)} variant="secondary">
                  {t('aram.cards.drawNew')}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
        <AbilityPreviewSheet championKey={previewChampionKey} isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} />
      </>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('champSelect.champions')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {searchAndFilterUi}
          {isLoading ? <p className="text-sm text-muted">{t('champSelect.loadingChampions')}</p> : null}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {visibleChampions.map((champion) => {
              const isSelected = selectedChampion?.id === champion.id
              const isBanned = bannedChampions.includes(champion.id)
              const isPicked = pickedChampionIds.has(champion.id)
              const isShielded = phase === 'ban' && allyPickIntents.has(champion.id)
              const isDisabled = !isMyTurn || isBanned || isPicked || isShielded

              return (
                <div key={champion.id} className="relative flex">
                  <button
                    className={`relative w-full overflow-hidden rounded-md border bg-secondary/60 text-left transition-all duration-150 hover:border-primary hover:shadow-[0_0_20px_var(--shoma-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isSelected ? 'border-primary shadow-[0_0_20px_var(--shoma-primary)]' : 'border-border'} ${isBanned ? 'grayscale' : ''} ${isPicked && !isBanned ? 'opacity-50' : ''} ${isDisabled && !isBanned && !isPicked ? 'opacity-50' : ''}`}
                    disabled={isDisabled}
                    aria-disabled={isShielded ? "true" : undefined}
                    aria-label={isShielded ? "Ally wants to play this champion" : undefined}
                    onClick={(e) => {
                      if (isLongPressTriggered.current) {
                        e.preventDefault()
                        return
                      }
                      void useChampSelectStore.getState().selectChampionForTurn(champion.id)
                    }}
                    onPointerDown={() => handlePointerDown(champion.key)}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    type="button"
                  >
                    <div className="relative">
                      <img
                        alt=""
                        className="h-20 w-full object-cover"
                        data-fallback-url={communityDragonSplashUrl(champion.key, 0)}
                        loading="lazy"
                        onError={handleSplashError}
                        src={championSplashUrl(champion.key) ?? undefined}
                      />
                      {isBanned && (
                        <div className="absolute inset-0 flex items-center justify-center bg-destructive/10">
                          <span className="font-display text-sm font-bold tracking-widest text-destructive drop-shadow-md">{t('champSelect.banned', { defaultValue: 'BANNED' }).toUpperCase()}</span>
                        </div>
                      )}
                      {isPicked && !isBanned && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                          <span className="font-display text-sm font-bold tracking-widest text-muted drop-shadow-md">{t('champSelect.picked', { defaultValue: 'PICKED' }).toUpperCase()}</span>
                        </div>
                      )}
                      {isShielded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                          <Shield className="size-8 text-primary drop-shadow-md" />
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <div className="truncate font-display text-sm font-medium uppercase tracking-[0.12em] text-foreground">{champion.name}</div>
                      <div className="text-xs text-muted">
                        {isBanned ? t('champSelect.banned') : isPicked ? t('champSelect.picked') : isSelected ? t('champSelect.selected') : t('champSelect.available')}
                      </div>
                    </div>
                  </button>
                  {isShielded && (
                    <div
                      className="absolute inset-0 z-10 cursor-not-allowed"
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setToastMessage('Ally wants to play this champion')
                        setTimeout(() => setToastMessage(null), 3000)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          e.stopPropagation()
                          setToastMessage('Ally wants to play this champion')
                          setTimeout(() => setToastMessage(null), 3000)
                        }
                      }}
                      title="Ally wants to play this champion"
                    />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
      <AbilityPreviewSheet championKey={previewChampionKey} isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} />
      {toastMessage && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-secondary px-4 py-2 text-sm text-primary shadow-lg">
          {toastMessage}
        </div>
      )}
    </>
  )
}
