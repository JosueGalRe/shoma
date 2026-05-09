import { useQuery } from '@tanstack/react-query'

import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { createLcuQueryOptions, gameflowPhaseDescriptor, readyCheckDescriptor } from '../../../core/lcu/lcu-queries'
import { useSharedLCUTransport } from '../../../core/rift/rift-client-provider'
import { useReadyCheck } from '../index'

function formatTimer(seconds: number): string {
  const safeSeconds = Math.max(0, seconds)
  const minutes = Math.floor(safeSeconds / 60)
  const remainingSeconds = safeSeconds % 60

  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function ReadyCheckOverlay() {
  const { accept, decline, error, isLoading, status, timer } = useReadyCheck()
  const transport = useSharedLCUTransport()
  const readyCheckQuery = useQuery(createLcuQueryOptions(readyCheckDescriptor, transport))
  const gameflowQuery = useQuery(createLcuQueryOptions(gameflowPhaseDescriptor, transport))
  const readyCheckSnapshot = readyCheckQuery.data ?? null

  const isVisible = (readyCheckSnapshot?.state === 'InProgress' || status === 'pending') && gameflowQuery.data === 'ReadyCheck'

  if (!isVisible) {
    return null
  }

  const progressWidth = `${Math.max(0, Math.min(100, ((12 - timer) / 12) * 100))}%`
  const hasResponded = status !== 'pending'

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'
      data-testid='ready-check-overlay'
    >
      <div className='w-full max-w-2xl space-y-5 text-center'>
        <Card className='relative overflow-hidden border border-lol-border-gold/40 bg-lol-navy-900/85 backdrop-blur-sm'>
          <div className='pointer-events-none absolute inset-0 animate-pulse rounded-lg border border-lol-border-gold/20' />

          <div className='absolute left-0 top-0 h-2 w-full bg-lol-navy-800'>
            <div
              className={`h-full transition-all duration-1000 ease-linear ${
                status === 'accepted'
                  ? 'bg-green-500'
                  : status === 'declined'
                    ? 'bg-red-500'
                    : 'bg-lol-gold'
              }`}
              style={{ width: progressWidth }}
            />
          </div>

          <CardHeader className='space-y-4 pb-0 pt-8'>
            <CardTitle className='font-display text-3xl tracking-[0.24em] text-lol-gold'>PARTIDA ENCONTRADA</CardTitle>
            <p className='text-xs uppercase tracking-[0.4em] text-lol-text-muted'>CONFIRMA TU ENTRADA</p>
          </CardHeader>

          <CardContent className='space-y-6 pt-5'>
            <div className='rounded-md border border-lol-border-subtle bg-lol-navy-800/70 px-4 py-6'>
              <div className='text-xs uppercase tracking-[0.3em] text-lol-text-muted'>TIEMPO RESTANTE</div>
              <div className='mt-3 font-display tabular-nums text-5xl text-lol-text-primary'>
                {status === 'expired' ? '00:00' : formatTimer(timer)}
              </div>
              <p className='mt-2 text-sm text-lol-text-muted'>
                {status === 'pending' ? 'Acepta la partida antes de que expire.' : 'La confirmación ya expiró.'}
              </p>
            </div>

            {error ? <p className='text-sm text-red-400'>{error.message}</p> : null}

            <div className='grid gap-3 sm:grid-cols-2'>
              <Button
                className='relative min-h-14 rounded-[4px_16px_4px_16px] border-2 border-lol-border-gold bg-lol-navy-800 px-8 py-4 text-lg text-lol-gold shadow-lol-glow-gold transition-all hover:bg-lol-navy-700 hover:shadow-lol-glow-gold-lg disabled:opacity-50'
                disabled={isLoading || hasResponded}
                onClick={() => {
                  void accept()
                }}
                type='button'
                variant='ghost'
              >
                {!hasResponded && <span className='absolute inset-0 animate-pulse rounded-[4px_16px_4px_16px] bg-lol-gold/5' />}
                <span className='relative'>ACEPTAR</span>
              </Button>
              <Button
                className='min-h-14 rounded-[4px_16px_4px_16px] border-2 border-red-700 bg-lol-navy-800 px-8 py-4 text-lg text-red-400 transition-all hover:bg-lol-navy-700 disabled:opacity-50'
                disabled={isLoading || hasResponded}
                onClick={() => {
                  void decline()
                }}
                type='button'
                variant='ghost'
              >
                DECLINAR
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
