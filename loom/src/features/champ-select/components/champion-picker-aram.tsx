import { Dices, Star } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { communityDragonSplashUrl } from '@/core/http/ddragon'

import { useAramStore } from '../aram-store'
import { useChampSelectStore } from '../champ-select-store'
import { championSplashUrl } from '../champ-select-utils'
import { useChampionPreview } from '../hooks/use-champion-preview'

import { AbilityPreviewSheet } from './ability-preview-sheet'
import {
  championPickerAramSelectedStyles,
  championPickerAramStyles,
  championPickerFilterStyles,
} from './champion-picker-styles'
import { filterAramCards, getAramCardTone, getAvailableAramChampionIds, handleSplashError } from './champion-picker-utils'

import type { ChampionPickerBranchProps } from './champion-picker-branch-types'

export function ChampionPickerAram({ query, sortOrder, activeRoleFilter, filters, t }: ChampionPickerBranchProps) {
  const champions = useChampSelectStore((state) => {
    return state.champions
  })
  const enemyTeam = useChampSelectStore((state) => {
    return state.enemyTeam
  })
  const isLoading = useChampSelectStore((state) => {
    return state.isLoading
  })
  const isMyTurn = useChampSelectStore((state) => {
    return state.isMyTurn
  })
  const phase = useChampSelectStore((state) => {
    return state.phase
  })
  const bannedChampions = useChampSelectStore((state) => {
    return state.bannedChampions
  })
  const team = useChampSelectStore((state) => {
    return state.team
  })
  const selectedChampionId = useChampSelectStore((state) => {
    return state.selectedChampion
  })
  const aramCanReroll = useAramStore((state) => {
    return state.canReroll
  })
  const aramCards = useAramStore((state) => {
    return state.cards
  })
  const aramDrawCards = useAramStore((state) => {
    return state.drawCards
  })
  const aramSelectCard = useAramStore((state) => {
    return state.selectCard
  })
  const aramSelectedCardIndex = useAramStore((state) => {
    return state.selectedCardIndex
  })

  const { closePreview, handleLongPressDown, handleLongPressUp, isLongPressTriggered, isPreviewOpen, previewChampionKey } =
    useChampionPreview()

  const aramSelectedStyles = championPickerAramSelectedStyles()
  const aramStyles = championPickerAramStyles()

  const selectedChampion =
    champions.find((champion) => {
      return champion.id === selectedChampionId
    }) ?? null
  const hasSelectedAramCard = aramSelectedCardIndex !== null
  const visibleAramCards = filterAramCards({ activeRoleFilter, aramCards, champions, query, sortOrder })
  const availableAramChampionIds = getAvailableAramChampionIds({ bannedChampions, champions, enemyTeam, team })

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{hasSelectedAramCard ? t('champSelect.champion') : t('aram.cards.title')}</CardTitle>
        </CardHeader>

        <CardContent className={championPickerFilterStyles().root()}>
          {filters}

          {isLoading ? <p className={aramStyles.description()}>{t('champSelect.loadingChampions')}</p> : null}

          {hasSelectedAramCard ? (
            <div className={aramSelectedStyles.card()}>
              <img
                alt=""
                className={aramSelectedStyles.image()}
                data-fallback-url={selectedChampion ? communityDragonSplashUrl(selectedChampion.key, 0) : undefined}
                loading="lazy"
                onError={handleSplashError}
                src={selectedChampion ? (championSplashUrl(selectedChampion.key) ?? undefined) : undefined}
              />

              <div className={aramSelectedStyles.content()}>
                <div className={aramSelectedStyles.name()}>{selectedChampion?.name ?? t('champSelect.noChampionSelected')}</div>

                <div className={aramSelectedStyles.title()}>
                  {selectedChampion?.title ?? t('champSelect.selectChampionHint')}
                </div>
              </div>
            </div>
          ) : (
            <>
              <p className={aramStyles.description()}>{t('aram.cards.description')}</p>

              <div className={aramStyles.grid()}>
                {visibleAramCards.map((card) => {
                  const champion = champions.find((candidate) => {
                    return candidate.id === card.championId
                  })
                  const isDisabled = !isMyTurn || phase !== 'pick' || !champion
                  const originalIndex = aramCards.findIndex((candidate) => {
                    return candidate.championId === card.championId
                  })

                  const tone = getAramCardTone(card)
                  const cardToneStyles = championPickerAramStyles({ tone })
                  let badgeContent = null

                  if (card.type === 'crowd-favorite') {
                    badgeContent = (
                      <div className={aramStyles.badge()}>
                        <Star className={aramStyles.badgeIcon()} />
                        {t('aram.cards.crowdFavorite')}
                      </div>
                    )
                  } else if (card.type === 'bravery') {
                    badgeContent = (
                      <div className={aramStyles.badge()}>
                        <Dices className={aramStyles.badgeIcon()} />
                        {t('arena.bravery')}
                      </div>
                    )
                  } else if (card.isBlessed) {
                    badgeContent = <div className={aramStyles.blessed()}>{t('aram.cards.blessed')}</div>
                  }

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
                      onPointerDown={() => {
                        if (champion) {
                          handleLongPressDown(champion.key)
                        }
                      }}
                      onPointerUp={handleLongPressUp}
                      onPointerLeave={handleLongPressUp}
                      type="button"
                    >
                      <img
                        alt=""
                        className={aramStyles.image()}
                        data-fallback-url={champion ? communityDragonSplashUrl(champion.key, 0) : undefined}
                        loading="lazy"
                        onError={handleSplashError}
                        src={champion ? (championSplashUrl(champion.key) ?? undefined) : undefined}
                      />

                      <div className={aramStyles.content()}>
                        <div className={aramStyles.name()}>
                          {champion?.name ?? t('champSelect.championLabel', { value: card.championId })}
                        </div>

                        {badgeContent}

                        <div className={aramStyles.selectHint()}>{t('aram.cards.select')}</div>
                      </div>
                    </button>
                  )
                })}
              </div>

              <Button
                disabled={availableAramChampionIds.length === 0}
                onClick={() => {
                  return aramDrawCards(availableAramChampionIds, aramCanReroll)
                }}
                className={aramStyles.drawButton()}
                variant="secondary"
              >
                {t('aram.cards.drawNew')}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <AbilityPreviewSheet championKey={previewChampionKey} isOpen={isPreviewOpen} onClose={closePreview} />
    </>
  )
}
