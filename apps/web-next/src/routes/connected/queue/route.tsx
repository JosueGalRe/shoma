import { useNavigate, createFileRoute } from '@tanstack/react-router'

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
  const navigate = useNavigate({ from: Route.fullPath })
  const { cancelQueue, dodgePenalty, isInQueue, isLoading, queueType, timer } = useQueue()

  return (
    <main className='flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(191,155,63,0.12),transparent_40%),linear-gradient(180deg,rgba(8,12,20,0.96),rgba(5,8,14,1))] p-4'>
      <Card className='relative w-full max-w-lg overflow-hidden border border-lol-border-subtle bg-lol-navy-900/80 backdrop-blur-sm'>
        <div className='pointer-events-none absolute inset-0 animate-pulse rounded-lg border border-lol-border-gold/20' />

        <CardHeader className='space-y-4 pb-0 text-center'>
          <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-lol-border-gold/40 bg-lol-navy-800 text-lol-gold shadow-lol-glow-gold'>
            ◈
          </div>
          <CardTitle className='font-display text-2xl text-lol-gold tracking-[0.24em]'>BUSCANDO PARTIDA</CardTitle>
          <p className='text-xs uppercase tracking-[0.4em] text-lol-text-muted'>TIEMPO DE BÚSQUEDA</p>
          <p className='font-display text-4xl tabular-nums text-lol-text-primary'>{formatTimer(timer)}</p>
        </CardHeader>

        <CardContent className='space-y-4 pt-5'>
          <div className='rounded-md border border-lol-border-subtle bg-lol-navy-800/70 p-4 text-center'>
            <div className='text-xs uppercase tracking-[0.3em] text-lol-text-muted'>MODO DE JUEGO</div>
            <div className='mt-2 text-lg font-medium text-lol-text-primary'>{queueType}</div>
            <p className='mt-2 text-sm text-lol-text-muted'>{isInQueue ? 'Esperando una partida...' : 'Preparando la búsqueda...'}</p>
          </div>

          {dodgePenalty > 0 ? (
            <div className='rounded-md border border-red-900/60 bg-red-950/30 p-3 text-center text-sm text-red-300'>
              Penalización por esquivar: {formatTimer(dodgePenalty)}
            </div>
          ) : null}

          <div className='flex justify-center pt-2'>
            <Button
              className='min-h-14 px-8 text-base'
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
              CANCELAR COLA
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

export const Route = createFileRoute('/connected/queue')({
  component: QueueRouteComponent,
})
