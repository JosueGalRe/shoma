/* eslint-disable react-doctor/no-giant-component, react-doctor/prefer-useReducer -- Component is large by design (pick/ban/skin/rune UI in one screen); useReducer refactor is planned but out of scope for lint fixes */
import { Shield, Star, Dices } from 'lucide-react'
import { type SyntheticEvent, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { communityDragonSplashUrl, type ChampionSummary } from '@/core/http/ddragon-client'
import { ChampionId, type ChampionId as ChampionIdType } from '@/core/types/branded'

import { useAramStore } from '../aram-store'
import { useChampSelectStore } from '../champ-select-store'
import { championSplashUrl } from '../champ-select-utils'
import { AbilityPreviewSheet } from './ability-preview-sheet'
import {
  championPickerAramSelectedStyles,
  championPickerAramStyles,
  championPickerCardStyles,
  championPickerFilterStyles,
  championPickerToastStyles,
} from './champion-picker-styles'

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
  const filterStyles = championPickerFilterStyles()
  const aramSelectedStyles = championPickerAramSelectedStyles()
  const aramStyles = championPickerAramStyles()
  const cardStyles = championPickerCardStyles()

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
    <div className={filterStyles.root()}>
      <Input
        aria-label={t('champSelect.searchChampions', { defaultValue: 'Search champions' })}
        className={filterStyles.input()}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
        placeholder={t('champSelect.searchChampions', { defaultValue: 'Search champions' })}
        value={query}
      />
      <div className={filterStyles.list()}>
        <button
          className={championPickerFilterStyles({ active: sortOrder === 'name-asc' }).button()}
          onClick={() => setSortOrder('name-asc')}
          type='button'
        >
          {t('champSelect.sortNameAsc', { defaultValue: 'Name (A-Z)' })}
        </button>
        <button
          className={championPickerFilterStyles({ active: sortOrder === 'name-desc' }).button()}
          onClick={() => setSortOrder('name-desc')}
          type='button'
        >
          {t('champSelect.sortNameDesc', { defaultValue: 'Name (Z-A)' })}
        </button>
        <div className={filterStyles.divider()} />
        {['Assassin', 'Fighter', 'Mage', 'Marksman', 'Support', 'Tank'].map((role) => (
          <button
            className={championPickerFilterStyles({ active: activeRoleFilter === role }).button()}
            key={role}
            onClick={() => setActiveRoleFilter(activeRoleFilter === role ? null : role)}
            type='button'
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
          <CardContent className={filterStyles.root()}>
            {searchAndFilterUi}
            {isLoading ? <p className={aramStyles.description()}>{t('champSelect.loadingChampions')}</p> : null}
            {hasSelectedAramCard ? (
              <div className={aramSelectedStyles.card()}>
                <img
                  alt=''
                  className={aramSelectedStyles.image()}
                  data-fallback-url={selectedChampion ? communityDragonSplashUrl(selectedChampion.key, 0) : undefined}
                  loading='lazy'
                  onError={handleSplashError}
                  src={selectedChampion ? (championSplashUrl(selectedChampion.key) ?? undefined) : undefined}
                />
                <div className={aramSelectedStyles.content()}>
                  <div className={aramSelectedStyles.name()}>
                    {selectedChampion?.name ?? t('champSelect.noChampionSelected')}
                  </div>
                  <div className={aramSelectedStyles.title()}>{selectedChampion?.title ?? t('champSelect.selectChampionHint')}</div>
                </div>
              </div>
            ) : (
              <>
                <p className={aramStyles.description()}>{t('aram.cards.description')}</p>
                <div className={aramStyles.grid()}>
                  {visibleAramCards.map((card) => {
                    const champion = champions.find((candidate) => candidate.id === card.championId)
                    const isDisabled = !isMyTurn || phase !== 'pick' || !champion
                    const originalIndex = aramCards.findIndex((candidate) => candidate.championId === card.championId)

                    const isCrowdFavorite = card.type === 'crowd-favorite'
                    const isBravery = card.type === 'bravery'
                    const isBlessed = card.isBlessed && !isCrowdFavorite
                    const tone = isCrowdFavorite ? 'crowdFavorite' : isBravery ? 'bravery' : isBlessed ? 'blessed' : 'default'
                    const cardToneStyles = championPickerAramStyles({ tone })

                    return (
                      <button
                        className={cardToneStyles.card()}
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
                        type='button'
                      >
                        <img
                          alt=''
                          className={aramStyles.image()}
                          data-fallback-url={champion ? communityDragonSplashUrl(champion.key, 0) : undefined}
                          loading='lazy'
                          onError={handleSplashError}
                          src={champion ? (championSplashUrl(champion.key) ?? undefined) : undefined}
                        />
                        <div className={aramStyles.content()}>
                          <div className={aramStyles.name()}>
                            {champion?.name ?? t('champSelect.championLabel', { value: card.championId })}
                          </div>
                          {isCrowdFavorite ? (
                            <div className={aramStyles.badge()}>
                              <Star className={aramStyles.badgeIcon()} />
                              Crowd Favorite
                            </div>
                          ) : isBravery ? (
                            <div className={aramStyles.badge()}>
                              <Dices className={aramStyles.badgeIcon()} />
                              Bravery
                            </div>
                          ) : isBlessed ? (
                            <div className={aramStyles.blessed()}>{t('aram.cards.blessed')}</div>
                          ) : null}
                          <div className={aramStyles.selectHint()}>{t('aram.cards.select')}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
                <Button
                  disabled={availableAramChampionIds.length === 0}
                  onClick={() => aramDrawCards(availableAramChampionIds, aramCanReroll)}
                  className={aramStyles.drawButton()}
                  variant='secondary'
                >
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
        <CardContent className={filterStyles.root()}>
          {searchAndFilterUi}
          {isLoading ? <p className={aramStyles.description()}>{t('champSelect.loadingChampions')}</p> : null}
          <div className={cardStyles.grid()}>
            {visibleChampions.map((champion) => {
              const isSelected = selectedChampion?.id === champion.id
              const isBanned = bannedChampions.includes(champion.id)
              const isPicked = pickedChampionIds.has(champion.id)
              const isShielded = phase === 'ban' && allyPickIntents.has(champion.id)
              const isDisabled = !isMyTurn || isBanned || isPicked || isShielded
              const state = isBanned ? 'banned' : isPicked ? 'picked' : isShielded ? 'shielded' : 'available'
              const styles = championPickerCardStyles({ selected: isSelected, state })
              let cardLabelKey = 'champSelect.available'

              if (isBanned) {
                cardLabelKey = 'champSelect.banned'
              } else if (isPicked) {
                cardLabelKey = 'champSelect.picked'
              } else if (isSelected) {
                cardLabelKey = 'champSelect.selected'
              }

              return (
                <div key={champion.id} className={styles.cell()}>
                  <button
                    className={styles.card()}
                    disabled={isDisabled}
                    aria-disabled={isShielded ? 'true' : undefined}
                    aria-label={isShielded ? 'Ally wants to play this champion' : undefined}
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
                    type='button'
                  >
                    <div className={styles.imageWrap()}>
                      <img
                        alt=''
                        className={styles.image()}
                        data-fallback-url={communityDragonSplashUrl(champion.key, 0)}
                        loading='lazy'
                        onError={handleSplashError}
                        src={championSplashUrl(champion.key) ?? undefined}
                      />
                      {isBanned && (
                        <div className={styles.overlay()}>
                          <span className={styles.overlayLabel()}>
                            {t('champSelect.banned', { defaultValue: 'BANNED' }).toUpperCase()}
                          </span>
                        </div>
                      )}
                      {isPicked && !isBanned && (
                        <div className={styles.overlay()}>
                          <span className={styles.overlayLabel()}>
                            {t('champSelect.picked', { defaultValue: 'PICKED' }).toUpperCase()}
                          </span>
                        </div>
                      )}
                      {isShielded && (
                        <div className={styles.overlay()}>
                          <Shield className={styles.overlayIcon()} />
                        </div>
                      )}
                    </div>
                    <div className={styles.content()}>
                      <div className={styles.name()}>
                        {champion.name}
                      </div>
                      <div className={styles.label()}>
                        {t(cardLabelKey)}
                      </div>
                    </div>
                  </button>
                  {isShielded && (
                    <div
                      className={styles.shieldHitArea()}
                      role='button'
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
                      title='Ally wants to play this champion'
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
        <div className={championPickerToastStyles()}>
          {toastMessage}
        </div>
      )}
    </>
  )
}
