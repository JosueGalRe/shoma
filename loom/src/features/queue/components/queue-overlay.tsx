import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useQueue } from '@/features/queue'

function formatTimer(seconds: number): string {
  const safeSeconds = Math.max(0, seconds)
  const minutes = Math.floor(safeSeconds / 60)
  const remainingSeconds = safeSeconds % 60

  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function QueueOverlay() {
  const { cancelQueue, dodgePenalty, isInQueue, isLoading, queueType, timer } = useQueue()

  if (!isInQueue) {
    return null
  }

  return (
    <div className='bg-background/80 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm'>
      <Card className='bg-secondary/95 relative w-full max-w-md overflow-hidden rounded-2xl border-none shadow-2xl'>
        <CardHeader className='space-y-3 pb-0 text-center'>
          <div className='border-primary/40 bg-secondary text-primary mx-auto flex size-14 items-center justify-center rounded-full border shadow-[0_0_20px_var(--shoma-primary)]'>
            ◈
          </div>
          <CardTitle className='font-display text-primary text-2xl tracking-[0.2em]'>BUSCANDO PARTIDA</CardTitle>
          <p className='text-muted text-xs tracking-[0.2em] uppercase'>TIEMPO DE BÚSQUEDA</p>
          <p className='font-display text-foreground text-3xl tracking-tight tabular-nums'>{formatTimer(timer)}</p>
        </CardHeader>

        <CardContent className='space-y-3 pt-5'>
          <div className='border-border bg-secondary/70 rounded-md border p-3 text-center'>
            <div className='text-muted text-xs tracking-[0.2em] uppercase'>MODO DE JUEGO</div>
            <div className='text-foreground mt-2 text-lg font-medium'>{queueType}</div>
            <p className='text-muted mt-2 text-sm'>Esperando una partida…</p>
          </div>

          {dodgePenalty > 0 ? (
            <div className='border-destructive/60 bg-destructive/10 text-destructive rounded-md border p-3 text-center text-sm'>
              Penalización por esquivar: {formatTimer(dodgePenalty)}
            </div>
          ) : null}

          <div className='flex justify-center pt-2'>
            <Button
              className='min-h-12 px-6 text-sm'
              disabled={isLoading}
              onClick={() => {
                void cancelQueue()
              }}
              type='button'
              variant='destructive'
            >
              CANCELAR COLA
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
