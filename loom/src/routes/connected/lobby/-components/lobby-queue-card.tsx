import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui'
import type { LobbyQueueCardProps } from './lobby-queue-card-types'
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

  const joinQueueLabel = isDodgePenaltyActive
    ? t('queue.dodgePenalty', { time: formatSeconds(dodgePenaltySeconds) })
    : isSwiftplay
      ? t('swiftplay.enterQueue')
      : t('queue.findMatch')

  return (
    <section className='shrink-0 px-4 py-2'>
      <div
        className={`rounded-xl border p-3 ${queueStatus.isSearching ? 'border-primary/60 bg-secondary/80' : 'border-border bg-secondary/60'}`}
      >
        <div className='mb-3 flex items-center justify-between gap-2'>
          <div className='flex items-center gap-2'>
            <span className={`h-2 w-2 rounded-full ${queueStatus.isSearching ? 'bg-primary animate-pulse' : 'bg-muted'}`} />
            <span className='text-foreground text-sm font-medium'>
              {queueStatus.isSearching ? t('queue.searching') : t('queue.notInQueue')}
            </span>
          </div>
          {queueStatus.isSearching ? <span className='font-display text-primary text-sm'>{t('queue.searching')}</span> : null}
        </div>

        {isSwiftplay && !isSwiftplayConfigured ? (
          <Button className='w-full' onClick={() => void navigate({ to: '/connected/swiftplay' })} variant='primary' size='sm'>
            {t('swiftplay.configure')}
          </Button>
        ) : queueStatus.isSearching ? (
          <Button
            className='w-full'
            onClick={onLeaveQueue}
            disabled={!isConnected || isActionPending}
            variant='secondary'
            size='sm'
          >
            {t('queue.leave')}
          </Button>
        ) : (
          <Button className='w-full' onClick={onJoinQueue} disabled={!canJoinQueue} variant='primary' size='sm'>
            {joinQueueLabel}
          </Button>
        )}

        {isDodgePenaltyActive ? (
          <p className='text-destructive mt-2 text-center text-xs'>
            {t('queue.dodgePenalty', { time: formatSeconds(dodgePenaltySeconds) })}
          </p>
        ) : null}
      </div>
    </section>
  )
}
