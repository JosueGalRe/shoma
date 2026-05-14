import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui'

function formatSeconds(seconds: number): string {
  const safeSeconds = Math.max(0, seconds)
  const mins = Math.floor(safeSeconds / 60)
  const secs = safeSeconds % 60

  return `${mins}:${secs.toString().padStart(2, '0')}`
}

interface LobbyQueueCardProps {
  queueStatus: { isSearching: boolean }
  gameMode: {
    isSwiftplay: boolean
    isSwiftplayConfigured: boolean
  }
  session: {
    isConnected: boolean
    isActionPending: boolean
  }
  canJoinQueue: boolean
  dodgePenalty: {
    isActive: boolean
    remainingSeconds: number
  }
  onJoinQueue: () => void
  onLeaveQueue: () => void
}

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
    <section className="shrink-0 px-4 py-2">
      <div className={`rounded-xl border p-3 ${queueStatus.isSearching ? 'border-primary/60 bg-secondary/80' : 'border-border bg-secondary/60'}`}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${queueStatus.isSearching ? 'animate-pulse bg-primary' : 'bg-muted'}`} />
            <span className="text-sm font-medium text-foreground">
              {queueStatus.isSearching ? t('queue.searching') : t('queue.notInQueue')}
            </span>
          </div>
          {queueStatus.isSearching ? (
            <span className="font-display text-sm text-primary">
              {t('queue.searching')}
            </span>
          ) : null}
        </div>

        {isSwiftplay && !isSwiftplayConfigured ? (
          <Button
            className="w-full"
            onClick={() => void navigate({ to: '/connected/swiftplay' })}
            variant="primary"
            size="sm"
          >
            {t('swiftplay.configure')}
          </Button>
        ) : queueStatus.isSearching ? (
          <Button
            className="w-full"
            onClick={onLeaveQueue}
            disabled={!isConnected || isActionPending}
            variant="secondary"
            size="sm"
          >
            {t('queue.leave')}
          </Button>
        ) : (
          <Button
            className="w-full"
            onClick={onJoinQueue}
            disabled={!canJoinQueue}
            variant="primary"
            size="sm"
          >
            {joinQueueLabel}
          </Button>
        )}

        {isDodgePenaltyActive ? (
          <p className="mt-2 text-center text-xs text-destructive">{t('queue.dodgePenalty', { time: formatSeconds(dodgePenaltySeconds) })}</p>
        ) : null}
      </div>
    </section>
  )
}
