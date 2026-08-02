import { Shield } from 'lucide-react'

import { communityDragonSplashUrl } from '@/core/http/ddragon'

import { useChampSelectStore } from '../champ-select-store'
import { championSplashUrl } from '../champ-select-utils'

import { championPickerCardStyles } from './champion-picker-styles'
import { getChampionCardState, handleSplashError } from './champion-picker-utils'

import type { ChampionGridCardProps } from './champion-grid-card-types'

export function ChampionGridCard({
  champion,
  isMyTurn,
  phase,
  selectedChampion,
  bannedChampionIds,
  pickedChampionIds,
  allyPickIntents,
  isLongPressTriggered,
  onLongPressDown,
  onLongPressUp,
  onShowToast,
  t,
}: ChampionGridCardProps) {
  const isSelected = selectedChampion?.id === champion.id
  const isBanned = bannedChampionIds.has(champion.id)
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
    <div className={styles.cell()}>
      <button
        className={styles.card()}
        disabled={isDisabled}
        aria-disabled={isShielded ? 'true' : undefined}
        aria-label={isShielded ? t('champSelect.allyWantsToPlay') : undefined}
        onClick={(e) => {
          if (isLongPressTriggered.current) {
            e.preventDefault()

            return
          }

          void useChampSelectStore.getState().selectChampionForTurn(champion.id)
        }}
        onPointerDown={() => {
          return onLongPressDown(champion.key)
        }}
        onPointerUp={onLongPressUp}
        onPointerLeave={onLongPressUp}
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
              <span className={styles.overlayLabel()}>{t('champSelect.banned', { defaultValue: 'BANNED' }).toUpperCase()}</span>
            </div>
          )}

          {isPicked && !isBanned && (
            <div className={styles.overlay()}>
              <span className={styles.overlayLabel()}>{t('champSelect.picked', { defaultValue: 'PICKED' }).toUpperCase()}</span>
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
          aria-label={t('champSelect.allyWantsToPlay')}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onShowToast(t('champSelect.allyWantsToPlay'))
          }}
          type="button"
          title={t('champSelect.allyWantsToPlay')}
        />
      )}
    </div>
  )
}
