import { useEffect, useRef } from 'react'

import { useQuery } from '@tanstack/react-query'

import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { createLcuQueryOptions, gameflowPhaseDescriptor } from '../../../core/lcu/lcu-queries'
import { useSharedLCUTransport } from '../../../core/rift/rift-client-provider'
import { READY_CHECK_DURATION_SECONDS } from '../constants'
import type { ReadyCheckStatus } from '../ready-check-store'
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
    accepted: 'bg-green-500',
    declined: 'bg-red-500',
    expired: 'bg-lol-gold',
    pending: 'bg-lol-gold',
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

  const progressWidth = `${Math.max(0, Math.min(100, (timer / READY_CHECK_DURATION_SECONDS) * 100))}%`
  const hasResponded = readyCheckStatus !== 'pending'

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm'
      data-testid='ready-check-overlay'
    >
      <div className='w-full max-w-md'>
        <Card className='relative overflow-hidden rounded-2xl bg-lol-navy-900/95 shadow-2xl shadow-lol-gold/10'>
          <CardHeader className='relative space-y-4 pb-0 pt-8'>
            <CardTitle className='font-display text-2xl tracking-[0.1em] text-lol-gold'>Partida encontrada</CardTitle>
            <p className='text-xs tracking-[0.1em] text-lol-text-muted'>Confirma tu entrada</p>
            <div className='absolute bottom-0 left-0 right-0 h-1 bg-lol-navy-800'>
              <div
                className={`h-full transition-all duration-1000 ease-linear ${progressBarClassNameByStatus[readyCheckStatus]}`}
                style={{ width: progressWidth }}
              />
            </div>
          </CardHeader>

          <CardContent className='space-y-6 pt-5'>
            <div className='py-4 text-center'>
              <p className='mb-1 text-xs text-lol-text-muted'>TIEMPO RESTANTE</p>
              <p className='font-display tabular-nums text-5xl text-lol-text-primary'>
                {timerLabelByStatus[readyCheckStatus]}
              </p>
              <p className='mt-2 text-sm text-lol-text-muted'>
                {confirmationTextByStatus[readyCheckStatus]}
              </p>
            </div>

            {error ? <p className='text-sm text-red-400'>{error.message}</p> : null}

            <div className='grid gap-3 sm:grid-cols-2'>
              <Button
                className='min-h-12 rounded-xl border border-lol-border-gold bg-lol-navy-800 px-8 py-3 text-base text-lol-gold shadow-lol-glow-gold transition-all hover:bg-lol-navy-700 hover:shadow-lol-glow-gold-lg disabled:opacity-50'
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
                className='min-h-12 rounded-xl border border-red-700 bg-lol-navy-800 px-8 py-3 text-base text-red-400 transition-all hover:bg-lol-navy-700 disabled:opacity-50'
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
