/* eslint-disable react-doctor/no-giant-component, react-doctor/prefer-useReducer -- Component is large by design (pick/ban/skin/rune UI in one screen); useReducer refactor is planned but out of scope for lint fixes */
import { type SyntheticEvent, useRef, useState } from 'react'

import { Dices, Shield, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { communityDragonSplashUrl } from '@/core/http/ddragon-client'
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
import { filterAramCards, filterChampions, getAvailableAramChampionIds } from './champion-picker-utils'

type LongPressTimer = ReturnType<typeof globalThis.setTimeout>

function handleChampionPointerDown(options: {
  timerRef: { current: LongPressTimer | null }
  isLongPressTriggered: { current: boolean }
  setPreviewChampionKey: (value: string) => void
  setIsPreviewOpen: (value: boolean) => void
  championKey: string
}) {
  const { championKey, isLongPressTriggered, setIsPreviewOpen, setPreviewChampionKey, timerRef } = options

  isLongPressTriggered.current = false

  timerRef.current = globalThis.setTimeout(() => {
    isLongPressTriggered.current = true
    setPreviewChampionKey(championKey)
    setIsPreviewOpen(true)
  }, 800)
}

function handleChampionPointerUp(timerRef: { current: LongPressTimer | null }) {
  if (timerRef.current) {
    clearTimeout(timerRef.current)
    timerRef.current = null
  }
}

function handleSplashError(event: SyntheticEvent<HTMLImageElement>) {
  const { fallbackUrl } = event.currentTarget.dataset

  if (!fallbackUrl || event.currentTarget.src === fallbackUrl) {
    return
  }

  event.currentTarget.src = fallbackUrl
}

function getAramCardTone(card: { isBlessed: boolean; type?: string }): 'crowdFavorite' | 'bravery' | 'blessed' | 'default' {
  if (card.type === 'crowd-favorite') {
    return 'crowdFavorite'
  }

  if (card.type === 'bravery') {
    return 'bravery'
  }

  if (card.isBlessed) {
    return 'blessed'
  }

  return 'default'
}

function getChampionCardState(params: {
  isBanned: boolean
  isPicked: boolean
  isShielded: boolean
}): 'banned' | 'picked' | 'shielded' | 'available' {
  if (params.isBanned) {
    return 'banned'
  }

  if (params.isPicked) {
    return 'picked'
  }

  if (params.isShielded) {
    return 'shielded'
  }

  return 'available'
}

export function ChampionPicker() {
  const { t } = useTranslation()
  const bannedChampions = useChampSelectStore((state) => {
    return state.bannedChampions
  })
  const champions = useChampSelectStore((state) => {
    return state.champions
  })
  const enemyTeam = useChampSelectStore((state) => {
    return state.enemyTeam
  })
  const isAram = useChampSelectStore((state) => {
    return state.isAram
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
  const selectedChampionId = useChampSelectStore((state) => {
    return state.selectedChampion
  })
  const team = useChampSelectStore((state) => {
    return state.team
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
  const [query, setQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'name-asc' | 'name-desc'>('name-asc')
  const [activeRoleFilter, setActiveRoleFilter] = useState<string | null>(null)
  const [previewChampionKey, setPreviewChampionKey] = useState<string | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const timerRef = useRef<LongPressTimer | null>(null)
  const isLongPressTriggered = useRef(false)
  const filterStyles = championPickerFilterStyles()
  const aramSelectedStyles = championPickerAramSelectedStyles()
  const aramStyles = championPickerAramStyles()
  const cardStyles = championPickerCardStyles()

  const selectedChampion =
    champions.find((champion) => {
      return champion.id === selectedChampionId
    }) ?? null
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

  const hasSelectedAramCard = aramSelectedCardIndex !== null
  const visibleChampions = filterChampions({ activeRoleFilter, champions, query, sortOrder })
  const visibleAramCards = filterAramCards({ activeRoleFilter, aramCards, champions, query, sortOrder })
  const availableAramChampionIds = getAvailableAramChampionIds({ bannedChampions, champions, enemyTeam, team })

  const searchAndFilterUi = (
    <div className={filterStyles.root()}>
      <Input
        aria-label={t('champSelect.searchChampions', { defaultValue: 'Search champions' })}
        className={filterStyles.input()}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          return setQuery(event.target.value)
        }}
        placeholder={t('champSelect.searchChampions', { defaultValue: 'Search champions' })}
        value={query}
      />

      <div className={filterStyles.list()}>
        <button
          className={championPickerFilterStyles({ active: sortOrder === 'name-asc' }).button()}
          onClick={() => {
            return setSortOrder('name-asc')
          }}
          type="button"
        >
          {t('champSelect.sortNameAsc', { defaultValue: 'Name (A-Z)' })}
        </button>

        <button
          className={championPickerFilterStyles({ active: sortOrder === 'name-desc' }).button()}
          onClick={() => {
            return setSortOrder('name-desc')
          }}
          type="button"
        >
          {t('champSelect.sortNameDesc', { defaultValue: 'Name (Z-A)' })}
        </button>

        <div className={filterStyles.divider()} />

        {['Assassin', 'Fighter', 'Mage', 'Marksman', 'Support', 'Tank'].map((role) => {
          return (
            <button
              className={championPickerFilterStyles({ active: activeRoleFilter === role }).button()}
              key={role}
              onClick={() => {
                return setActiveRoleFilter(activeRoleFilter === role ? null : role)
              }}
              type="button"
            >
              {role}
            </button>
          )
        })}
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
                  alt=""
                  className={aramSelectedStyles.image()}
                  data-fallback-url={selectedChampion ? communityDragonSplashUrl(selectedChampion.key, 0) : undefined}
                  loading="lazy"
                  onError={handleSplashError}
                  src={selectedChampion ? (championSplashUrl(selectedChampion.key) ?? undefined) : undefined}
                />

                <div className={aramSelectedStyles.content()}>
                  <div className={aramSelectedStyles.name()}>
                    {selectedChampion?.name ?? t('champSelect.noChampionSelected')}
                  </div>

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
                          Crowd Favorite
                        </div>
                      )
                    } else if (card.type === 'bravery') {
                      badgeContent = (
                        <div className={aramStyles.badge()}>
                          <Dices className={aramStyles.badgeIcon()} />
                          Bravery
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
                            handleChampionPointerDown({
                              championKey: champion.key,
                              isLongPressTriggered,
                              setIsPreviewOpen,
                              setPreviewChampionKey,
                              timerRef,
                            })
                          }
                        }}
                        onPointerUp={() => {
                          handleChampionPointerUp(timerRef)
                        }}
                        onPointerLeave={() => {
                          handleChampionPointerUp(timerRef)
                        }}
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

        <AbilityPreviewSheet
          championKey={previewChampionKey}
          isOpen={isPreviewOpen}
          onClose={() => {
            return setIsPreviewOpen(false)
          }}
        />
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
              const state = getChampionCardState({ isBanned, isPicked, isShielded })
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
                    onPointerDown={() => {
                      handleChampionPointerDown({
                        championKey: champion.key,
                        isLongPressTriggered,
                        setIsPreviewOpen,
                        setPreviewChampionKey,
                        timerRef,
                      })
                    }}
                    onPointerUp={() => {
                      handleChampionPointerUp(timerRef)
                    }}
                    onPointerLeave={() => {
                      handleChampionPointerUp(timerRef)
                    }}
                    type="button"
                  >
                    <div className={styles.imageWrap()}>
                      <img
                        alt=""
                        className={styles.image()}
                        data-fallback-url={communityDragonSplashUrl(champion.key, 0)}
                        loading="lazy"
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
                      <div className={styles.name()}>{champion.name}</div>

                      <div className={styles.label()}>{t(cardLabelKey)}</div>
                    </div>
                  </button>

                  {isShielded && (
                    <button
                      className={styles.shieldHitArea()}
                      aria-label="Ally wants to play this champion"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setToastMessage('Ally wants to play this champion')

                        setTimeout(() => {
                          setToastMessage(null)
                        }, 3000)
                      }}
                      type="button"
                      title="Ally wants to play this champion"
                    />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <AbilityPreviewSheet
        championKey={previewChampionKey}
        isOpen={isPreviewOpen}
        onClose={() => {
          return setIsPreviewOpen(false)
        }}
      />

      {toastMessage && <div className={championPickerToastStyles()}>{toastMessage}</div>}
    </>
  )
}
