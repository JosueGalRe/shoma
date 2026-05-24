import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui'
import type { LobbyQueueCardProps } from './lobby-queue-card-types'
import { lobbyQueueCardStyles } from './lobby-queue-card-styles'
import { formatSeconds } from './lobby-queue-card-utils'

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
  const queueState = queueStatus.isSearching ? 'searching' : canJoinQueue ? 'open' : 'closed'
  const styles = lobbyQueueCardStyles({ queueStatus: queueState })

  const joinQueueLabel = isDodgePenaltyActive
    ? t('queue.dodgePenalty', { time: formatSeconds(dodgePenaltySeconds) })
    : isSwiftplay
      ? t('swiftplay.enterQueue')
      : t('queue.findMatch')

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

        {isSwiftplay && !isSwiftplayConfigured ? (
          <Button className={styles.button()} onClick={() => void navigate({ to: '/connected/swiftplay' })} variant='primary' size='sm'>
            {t('swiftplay.configure')}
          </Button>
        ) : queueStatus.isSearching ? (
          <Button
            className={styles.button()}
            onClick={onLeaveQueue}
            disabled={!isConnected || isActionPending}
            variant='secondary'
            size='sm'
          >
            {t('queue.leave')}
          </Button>
        ) : (
          <Button className={styles.button()} onClick={onJoinQueue} disabled={!canJoinQueue} variant='primary' size='sm'>
            {joinQueueLabel}
          </Button>
        )}

        {isDodgePenaltyActive ? (
          <p className={styles.penalty()}>
            {t('queue.dodgePenalty', { time: formatSeconds(dodgePenaltySeconds) })}
          </p>
        ) : null}
      </div>
    </section>
  )
}
