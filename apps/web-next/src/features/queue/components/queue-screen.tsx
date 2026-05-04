import { useMemo } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatSeconds } from '@core/rift/rift-lcu-utils'
import { useQueue } from '../use-queue'

const queueTypeOptions = [
  { label: 'Current lobby queue', value: 'current' },
  { label: 'Summoner\'s Rift Draft', value: 'draft' },
  { label: 'ARAM', value: 'aram' },
]

export function QueueScreen() {
  const { cancelQueue, dodgeTimer, error, errors, estimatedTime, isInQueue, isLoading, queueState, startQueue } = useQueue()
  const queueTime = queueState?.timeInQueue ?? 0
  const searchState = queueState?.searchState ?? (isInQueue ? 'Searching' : 'Idle')
  const queueStatus = useMemo(() => {
    if (dodgeTimer) {
      return `Dodge penalty active: ${formatSeconds(dodgeTimer)}`
    }

    if (isInQueue) {
      return `In queue for ${formatSeconds(queueTime)}`
    }

    return 'Ready to queue from the current lobby.'
  }, [dodgeTimer, isInQueue, queueTime])

  return (
    <main className='relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]'>
      <Card className={isInQueue ? 'animate-queue-active' : undefined}>
        <CardHeader>
          <CardTitle className='font-display text-sm tracking-[0.25em] text-primary uppercase'>Queue</CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='rounded-lg border border-gold-dim/30 bg-background/60 p-5 text-center'>
            <p className='text-sm tracking-[0.2em] text-muted-foreground uppercase'>{searchState}</p>
            <p className='mt-3 font-mono text-6xl font-bold text-primary drop-shadow-[0_0_16px_rgba(200,169,110,0.35)]'>
              {formatSeconds(queueTime)}
            </p>
            <p className='mt-3 text-sm text-muted-foreground'>{queueStatus}</p>
          </div>

          <div className='grid gap-3 sm:grid-cols-2'>
            <Button
              className='min-h-14 font-display text-base tracking-wider uppercase'
              disabled={isLoading || isInQueue || Boolean(dodgeTimer)}
              onClick={() => {
                void startQueue()
              }}
              type='button'
            >
              Start Queue
            </Button>
            <Button
              className='min-h-14 font-display text-base tracking-wider uppercase'
              disabled={isLoading || !isInQueue}
              onClick={() => {
                void cancelQueue()
              }}
              type='button'
              variant='destructive'
            >
              Cancel Queue
            </Button>
          </div>

          {dodgeTimer ? (
            <div className='rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive'>
              Dodge timer: {formatSeconds(dodgeTimer)} remaining before matchmaking can start.
            </div>
          ) : null}

          {error ? (
            <div className='rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive'>
              {error.message}
            </div>
          ) : null}

          {errors.length > 1 ? (
            <ul className='space-y-2 text-sm text-muted-foreground'>
              {errors.slice(1).map((message) => (
                <li key={message}>• {message}</li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='font-display text-sm tracking-[0.25em] text-primary uppercase'>Queue Type</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <label className='block text-sm font-medium text-muted-foreground' htmlFor='queue-type'>
            Queue selector
          </label>
          <select
            className='h-12 w-full rounded-md border border-gold-dim/40 bg-background px-3 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30'
            defaultValue='current'
            disabled={isInQueue}
            id='queue-type'
          >
            {queueTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className='rounded-lg border border-secondary bg-background/50 p-4 text-sm text-muted-foreground'>
            <p>Estimated wait: {estimatedTime === null ? 'Unavailable' : formatSeconds(estimatedTime)}</p>
            <p className='mt-2'>Queue changes are controlled by the active League lobby.</p>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
