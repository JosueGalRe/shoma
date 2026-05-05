import { createFileRoute } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useReadyCheck } from '@/features/ready-check'

function formatTimer(seconds: number): string {
  const safeSeconds = Math.max(0, seconds)
  const minutes = Math.floor(safeSeconds / 60)
  const remainingSeconds = safeSeconds % 60

  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

function ReadyCheckRouteComponent() {
  const { accept, decline, error, isLoading, status, timer } = useReadyCheck()

  return (
    <main className='flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(191,155,63,0.16),transparent_38%),linear-gradient(180deg,rgba(10,14,24,0.98),rgba(5,8,14,1))] p-4'>
      <div className='w-full max-w-2xl space-y-5 text-center'>
        <Card className='relative overflow-hidden border border-lol-border-gold/40 bg-lol-navy-900/85 backdrop-blur-sm'>
          <div className='pointer-events-none absolute inset-0 animate-pulse rounded-lg border border-lol-border-gold/20' />

          <CardHeader className='space-y-4 pb-0'>
            <CardTitle className='font-display text-3xl text-lol-gold tracking-[0.24em]'>PARTIDA ENCONTRADA</CardTitle>
            <p className='text-xs uppercase tracking-[0.4em] text-lol-text-muted'>CONFIRMA TU ENTRADA</p>
          </CardHeader>

          <CardContent className='space-y-6 pt-5'>
            <div className='rounded-md border border-lol-border-subtle bg-lol-navy-800/70 px-4 py-6'>
              <div className='text-xs uppercase tracking-[0.3em] text-lol-text-muted'>TIEMPO RESTANTE</div>
              <div className='mt-3 font-display text-5xl tabular-nums text-lol-text-primary'>
                {status === 'expired' ? '00:00' : formatTimer(timer)}
              </div>
              <p className='mt-2 text-sm text-lol-text-muted'>
                {status === 'pending' ? 'Acepta la partida antes de que expire.' : 'La confirmación ya expiró.'}
              </p>
            </div>

            {error ? <p className='text-sm text-red-400'>{error.message}</p> : null}

            {status === 'pending' ? (
              <div className='grid gap-3 sm:grid-cols-2'>
                <Button
                  className='relative min-h-14 rounded-[4px_16px_4px_16px] border-2 border-lol-border-gold bg-lol-navy-800 px-8 py-4 text-lg text-lol-gold shadow-lol-glow-gold transition-all hover:bg-lol-navy-700 hover:shadow-lol-glow-gold-lg'
                  disabled={isLoading}
                  onClick={() => {
                    void accept()
                  }}
                  type='button'
                  variant='ghost'
                >
                  <span className='absolute inset-0 animate-pulse rounded-[4px_16px_4px_16px] bg-lol-gold/5' />
                  <span className='relative'>ACEPTAR</span>
                </Button>
                <Button
                  className='min-h-14 rounded-[4px_16px_4px_16px] border-2 border-red-700 bg-lol-navy-800 px-8 py-4 text-lg text-red-400 transition-all hover:bg-lol-navy-700'
                  disabled={isLoading}
                  onClick={() => {
                    void decline()
                  }}
                  type='button'
                  variant='ghost'
                >
                  DECLINAR
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export const Route = createFileRoute('/connected/ready-check')({
  component: ReadyCheckRouteComponent,
})
