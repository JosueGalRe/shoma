import { useEffect, useRef } from 'react'

import { useQuery } from '@tanstack/react-query'

import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { createLcuQueryOptions, gameflowPhaseDescriptor } from '../../../core/lcu/lcu-queries'
import { useSharedLCUTransport } from '../../../core/relay/relay-client-provider'
import { READY_CHECK_DURATION_SECONDS } from '../constants'
import type { ReadyCheckStatus } from '../ready-check-store'
import { useReadyCheck } from '../hooks/use-ready-check'

function formatTimer(seconds: number): string {
  const safeSeconds = Math.max(0, seconds)
  const minutes = Math.floor(safeSeconds / 60)
  const remainingSeconds = safeSeconds % 60

  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function ReadyCheckOverlay() {
  const { accept, decline, error, isLoading, status, timer } = useReadyCheck()
  const transport = useSharedLCUTransport()
  const gameflowQuery = useQuery(createLcuQueryOptions(gameflowPhaseDescriptor, transport))
  const previousBodyOverflowRef = useRef<string | null>(null)
  const readyCheckStatus: ReadyCheckStatus = status
  const isVisible = readyCheckStatus === 'pending' && gameflowQuery.data === 'ReadyCheck'

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined
    }

    if (!isVisible) {
      return undefined
    }

    previousBodyOverflowRef.current = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousBodyOverflowRef.current ?? ''
    }
  }, [isVisible])
  const progressBarClassNameByStatus: Record<ReadyCheckStatus, string> = {
    accepted: '[&::-moz-progress-bar]:bg-primary [&::-webkit-progress-value]:bg-primary',
    declined: '[&::-moz-progress-bar]:bg-destructive [&::-webkit-progress-value]:bg-destructive',
    expired: '[&::-moz-progress-bar]:bg-primary [&::-webkit-progress-value]:bg-primary',
    pending: '[&::-moz-progress-bar]:bg-primary [&::-webkit-progress-value]:bg-primary',
  }
  const confirmationTextByStatus: Record<ReadyCheckStatus, string> = {
    accepted: 'La confirmación ya expiró.',
    declined: 'La confirmación ya expiró.',
    expired: 'La confirmación ya expiró.',
    pending: 'Acepta la partida antes de que expire.',
  }
  const timerLabelByStatus: Record<ReadyCheckStatus, string> = {
    accepted: formatTimer(timer),
    declined: formatTimer(timer),
    expired: '00:00',
    pending: formatTimer(timer),
  }

  if (!isVisible) {
    return null
  }

  const progressValue = Math.max(0, Math.min(100, (timer / READY_CHECK_DURATION_SECONDS) * 100))
  const hasResponded = readyCheckStatus !== 'pending'

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm'
      data-testid='ready-check-overlay'
    >
      <div className='w-full max-w-md'>
        <Card className='relative overflow-hidden rounded-2xl bg-secondary/95 shadow-2xl shadow-[0_0_24px_color-mix(in_srgb,var(--shoma-primary)_18%,transparent)]'>
          <CardHeader className='relative space-y-4 pb-0 pt-8'>
            <CardTitle className='font-display text-2xl tracking-[0.1em] text-primary'>Partida encontrada</CardTitle>
            <p className='text-xs tracking-[0.1em] text-muted'>Confirma tu entrada</p>
            <div className='absolute bottom-0 left-0 right-0 h-1 bg-secondary'>
              <progress
                className={`h-full w-full appearance-none bg-transparent transition-all duration-1000 ease-linear [&::-webkit-progress-bar]:bg-transparent ${progressBarClassNameByStatus[readyCheckStatus]}`}
                max={100}
                value={progressValue}
              />
            </div>
          </CardHeader>

          <CardContent className='space-y-6 pt-5'>
            <div className='py-4 text-center'>
              <p className='mb-1 text-xs text-muted'>TIEMPO RESTANTE</p>
              <p className='font-display tabular-nums text-5xl text-foreground'>
                {timerLabelByStatus[readyCheckStatus]}
              </p>
              <p className='mt-2 text-sm text-muted'>
                {confirmationTextByStatus[readyCheckStatus]}
              </p>
            </div>

            {error ? <p className='text-sm text-destructive'>{error.message}</p> : null}

            <div className='grid gap-3 sm:grid-cols-2'>
              <Button
                className='min-h-12 rounded-xl border border-primary bg-secondary px-8 py-3 text-base text-primary shadow-[0_0_20px_var(--shoma-primary)] transition-all hover:bg-secondary hover:shadow-[0_0_28px_var(--shoma-primary)] disabled:opacity-50'
                disabled={isLoading || hasResponded}
                onClick={() => {
                  void accept()
                }}
                type='button'
                variant='ghost'
              >
                Aceptar
              </Button>
              <Button
                className='min-h-12 rounded-xl border border-destructive bg-secondary px-8 py-3 text-base text-destructive transition-all hover:bg-secondary disabled:opacity-50'
                disabled={isLoading || hasResponded}
                onClick={() => {
                  void decline()
                }}
                type='button'
                variant='ghost'
              >
                Declinar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
