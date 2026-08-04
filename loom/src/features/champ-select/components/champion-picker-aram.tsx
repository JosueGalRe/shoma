import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { communityDragonSplashUrl } from '@/core/http/ddragon'

import { championSplashUrl } from '../champ-select-utils'
import { useChampionPreview } from '../hooks/use-champion-preview'

import { AbilityPreviewSheet } from './ability-preview-sheet'
import {
  championPickerAramSelectedStyles,
  championPickerAramStyles,
  championPickerFilterStyles,
} from './champion-picker-styles'
import { filterAramCards, handleSplashError } from './champion-picker-utils'

import type { ChampionPickerBranchProps } from './champion-picker-branch-types'

export function ChampionPickerAram({ query, sortOrder, activeRoleFilter, filters, t, view }: ChampionPickerBranchProps) {
  const { aramCards, champions, isLoading, isMyTurn, onSelectChampion, phase, selectedChampionId } = view
  const { closePreview, handleLongPressDown, handleLongPressUp, isLongPressTriggered, isPreviewOpen, previewChampionKey } =
    useChampionPreview()

  const aramSelectedStyles = championPickerAramSelectedStyles()
  const aramStyles = championPickerAramStyles()

  const selectedChampion =
    champions.find((champion) => {
      return champion.id === selectedChampionId
    }) ?? null
  const hasSelectedAramCard = selectedChampionId !== null
  const visibleAramCards = filterAramCards({
    activeRoleFilter,
    aramCards: aramCards.map((championId) => {
      return { championId }
    }),
    champions,
    query,
    sortOrder,
  })

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

                  return (
                    <button
                      className={championPickerAramStyles({ tone: 'default' }).card()}
                      disabled={isDisabled}
                      key={card.championId}
                      onClick={(e) => {
                        if (isLongPressTriggered.current) {
                          e.preventDefault()

                          return
                        }

                        onSelectChampion(card.championId)
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

                        <div className={aramStyles.selectHint()}>{t('aram.cards.select')}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AbilityPreviewSheet championKey={previewChampionKey} isOpen={isPreviewOpen} onClose={closePreview} />
    </>
  )
}
