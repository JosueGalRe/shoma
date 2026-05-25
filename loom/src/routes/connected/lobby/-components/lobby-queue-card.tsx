import type { ReactNode } from 'react'

import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui'

import { lobbyQueueCardStyles } from './lobby-queue-card-styles'
import { formatSeconds } from './lobby-queue-card-utils'

import type { LobbyQueueCardProps } from './lobby-queue-card-types'

export function LobbyQueueCard({
  queueStatus,
  gameMode,
  session,
  canJoinQueue,
  dodgePenalty,
  onJoinQueue,
  onLeaveQueue,
}: LobbyQueueCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isSwiftplay, isSwiftplayConfigured } = gameMode
  const { isConnected, isActionPending } = session
  const { isActive: isDodgePenaltyActive, remainingSeconds: dodgePenaltySeconds } = dodgePenalty
  let queueState: 'searching' | 'open' | 'closed'

  if (queueStatus.isSearching) {
    queueState = 'searching'
  } else if (canJoinQueue) {
    queueState = 'open'
  } else {
    queueState = 'closed'
  }

  const styles = lobbyQueueCardStyles({ queueStatus: queueState })

  let joinQueueLabel: string

  if (isDodgePenaltyActive) {
    joinQueueLabel = t('queue.dodgePenalty', { time: formatSeconds(dodgePenaltySeconds) })
  } else if (isSwiftplay) {
    joinQueueLabel = t('swiftplay.enterQueue')
  } else {
    joinQueueLabel = t('queue.findMatch')
  }

  let actionButton: ReactNode

  if (isSwiftplay && !isSwiftplayConfigured) {
    actionButton = (
      <Button
        className={styles.button()}
        onClick={() => {
          return void navigate({ to: '/connected/swiftplay' })
        }}
        variant="primary"
        size="sm"
      >
        {t('swiftplay.configure')}
      </Button>
    )
  } else if (queueStatus.isSearching) {
    actionButton = (
      <Button
        className={styles.button()}
        onClick={onLeaveQueue}
        disabled={!isConnected || isActionPending}
        variant="secondary"
        size="sm"
      >
        {t('queue.leave')}
      </Button>
    )
  } else {
    actionButton = (
      <Button className={styles.button()} onClick={onJoinQueue} disabled={!canJoinQueue} variant="primary" size="sm">
        {joinQueueLabel}
      </Button>
    )
  }

  return (
    <section className={styles.section()}>
      <div className={styles.card()}>
        <div className={styles.statusRow()}>
          <div className={styles.statusLead()}>
            <span className={styles.statusDot()} />

            <span className={styles.statusLabel()}>
              {queueStatus.isSearching ? t('queue.searching') : t('queue.notInQueue')}
            </span>
          </div>

          {queueStatus.isSearching ? <span className={styles.searchingLabel()}>{t('queue.searching')}</span> : null}
        </div>

        {actionButton}

        {isDodgePenaltyActive ? (
          <p className={styles.penalty()}>{t('queue.dodgePenalty', { time: formatSeconds(dodgePenaltySeconds) })}</p>
        ) : null}
      </div>
    </section>
  )
}
