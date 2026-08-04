import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { resolveChampionIcon, resolveChampionSplash } from '@/lib/asset-resolver'

import { aramOverlayStyles } from './aram-overlay-styles'

import type { ChampionSummary } from '@/core/http/ddragon'
import type { ChampionId as ChampionIdType } from '@/core/types/branded'

export interface AramOverlayProps {
  bench: ChampionIdType[]
  cards: ChampionIdType[]
  champions: ChampionSummary[]
  hasChosenCard: boolean
  isOpen: boolean
  isSwapping: boolean
  onClose: () => void
  onSelectCard: (championId: ChampionIdType) => void
  onSwapBench: (championId: ChampionIdType) => void
  title: string
}

export function AramOverlay({
  bench,
  cards,
  champions,
  hasChosenCard,
  isOpen,
  isSwapping,
  onClose,
  onSelectCard,
  onSwapBench,
  title,
}: AramOverlayProps) {
  const { t } = useTranslation()
  const styles = aramOverlayStyles()

  if (!isOpen) {
    return null
  }

  const championById = (championId: ChampionIdType) => {
    return champions.find((champion) => {
      return champion.id === championId
    })
  }

  return (
    <div aria-label={title} aria-modal="true" className={styles.root()} role="dialog">
      <div className={styles.header()}>
        <h2 className={styles.title()}>{title}</h2>

        <button aria-label={t('common.close')} className={styles.closeButton()} onClick={onClose} type="button">
          <X className={styles.closeIcon()} />
        </button>
      </div>

      <div className={styles.body()}>
        {!hasChosenCard ? (
          <div className={styles.cards()}>
            {cards.map((championId) => {
              const champion = championById(championId)
              const splashUrl = resolveChampionSplash(championId, champions)

              return (
                <button
                  className={styles.card()}
                  key={championId}
                  onClick={() => {
                    onSelectCard(championId)
                  }}
                  type="button"
                >
                  {splashUrl ? <img alt="" className={styles.cardSplash()} loading="lazy" src={splashUrl} /> : null}

                  <span className={styles.cardName()}>{champion?.name ?? championId}</span>
                </button>
              )
            })}
          </div>
        ) : null}

        {bench.length > 0 ? (
          <section aria-label={t('champSelect.bench')} className={styles.benchSection()}>
            <h3 className={styles.benchTitle()}>{t('champSelect.bench')}</h3>

            <div className={styles.benchGrid()}>
              {bench.map((championId) => {
                const champion = championById(championId)

                return (
                  <button
                    aria-label={champion?.name}
                    className={styles.benchItem()}
                    disabled={isSwapping}
                    key={championId}
                    onClick={() => {
                      onSwapBench(championId)
                    }}
                    type="button"
                  >
                    <img
                      alt=""
                      className={styles.benchImage()}
                      loading="lazy"
                      src={resolveChampionIcon(championId, champions)}
                    />
                  </button>
                )
              })}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}
