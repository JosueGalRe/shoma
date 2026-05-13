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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <Card className="relative w-full max-w-md overflow-hidden rounded-2xl border-none bg-lol-navy-900/95 shadow-2xl">
        <CardHeader className="space-y-3 pb-0 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-lol-border-gold/40 bg-lol-navy-800 text-lol-gold shadow-lol-glow-gold">
            ◈
          </div>
          <CardTitle className="font-display text-2xl tracking-[0.2em] text-lol-gold">BUSCANDO PARTIDA</CardTitle>
          <p className="text-xs uppercase tracking-[0.2em] text-lol-text-muted">TIEMPO DE BÚSQUEDA</p>
          <p className="font-display text-3xl tabular-nums tracking-tight text-lol-text-primary">{formatTimer(timer)}</p>
        </CardHeader>

        <CardContent className="space-y-3 pt-5">
          <div className="rounded-md border border-lol-border-subtle bg-lol-navy-800/70 p-3 text-center">
            <div className="text-xs uppercase tracking-[0.2em] text-lol-text-muted">MODO DE JUEGO</div>
            <div className="mt-2 text-lg font-medium text-lol-text-primary">{queueType}</div>
            <p className="mt-2 text-sm text-lol-text-muted">Esperando una partida…</p>
          </div>

          {dodgePenalty > 0 ? (
            <div className="rounded-md border border-red-900/60 bg-red-950/30 p-3 text-center text-sm text-red-300">
              Penalización por esquivar: {formatTimer(dodgePenalty)}
            </div>
          ) : null}

          <div className="flex justify-center pt-2">
            <Button
              className="min-h-12 px-6 text-sm"
              disabled={isLoading}
              onClick={() => {
                void cancelQueue()
              }}
              type="button"
              variant="destructive"
            >
              CANCELAR COLA
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
