import { useNavigate, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useQueue } from '@/features/queue'

function formatTimer(seconds: number): string {
  const safeSeconds = Math.max(0, seconds)
  const minutes = Math.floor(safeSeconds / 60)
  const remainingSeconds = safeSeconds % 60

  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

function QueueRouteComponent() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { cancelQueue, dodgePenalty, isInQueue, isLoading, queueType, timer } = useQueue()

  return (
    <main className='min-h-[calc(100vh-4rem)] p-4'>
      <Card className='mx-auto max-w-md'>
        <CardHeader className='space-y-2 text-center'>
          <CardTitle className='text-sm uppercase tracking-[0.3em] text-muted-foreground'>{t('queue.title')}</CardTitle>
          <p className='text-xs uppercase tracking-[0.25em] text-muted-foreground'>{t('queue.timer')}</p>
          <p className='text-5xl font-bold tabular-nums'>{formatTimer(timer)}</p>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='rounded-md border p-3 text-sm'>
            <div className='text-muted-foreground'>{t('queue.type')}</div>
            <div className='font-medium'>{queueType}</div>
          </div>

          <p className='text-sm text-muted-foreground'>{isInQueue ? t('queue.searching') : t('queue.notInQueue')}</p>

          {dodgePenalty > 0 ? (
            <div className='rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive'>
              {t('queue.dodgePenalty', { time: formatTimer(dodgePenalty) })}
            </div>
          ) : null}

          <Button
            className='w-full'
            disabled={isLoading || !isInQueue}
            onClick={() => {
              void cancelQueue().then((cancelled) => {
                if (cancelled) {
                  void navigate({ replace: true, to: '/connected/lobby' })
                }
              })
            }}
            type='button'
            variant='destructive'
          >
            {t('queue.cancel')}
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}

export const Route = createFileRoute('/connected/queue')({
  component: QueueRouteComponent,
})
