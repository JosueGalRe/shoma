import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useReadyCheck } from '../use-ready-check'

const readyCheckDurationSeconds = 12

function readProgressPercentage(timeRemaining: number): number {
  return Math.max(0, Math.min(100, (timeRemaining / readyCheckDurationSeconds) * 100))
}

export function ReadyCheckModal() {
  const { accept, decline, error, isLoading, readyCheckState, timeRemaining } = useReadyCheck()
  const isReadyCheckVisible = readyCheckState?.state === 'InProgress' && timeRemaining > 0
  const hasResponded = readyCheckState?.playerResponse === 'Accepted' || readyCheckState?.playerResponse === 'Declined'
  const isUrgent = timeRemaining <= 5
  const progressPercentage = readProgressPercentage(timeRemaining)

  useEffect(() => {
    if (isReadyCheckVisible && !hasResponded && navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 400])
    }
  }, [isReadyCheckVisible, hasResponded])

  const handleAccept = async () => {
    if (navigator.vibrate) navigator.vibrate(100)
    await accept()
  }

  const handleDecline = async () => {
    if (navigator.vibrate) navigator.vibrate([50, 50, 50])
    await decline()
  }

  const modalContent = (
    <>
      <div className='fixed inset-0 z-[100] bg-black/90 backdrop-blur-md animate-in fade-in duration-300' />
      <section className='fixed inset-0 z-[110] flex flex-col items-center justify-center p-4 sm:p-8 animate-in zoom-in-95 duration-300'>
        <div className='text-center mb-12'>
          <p className='font-display text-sm tracking-[0.4em] text-primary uppercase mb-4 animate-pulse'>Match Found</p>
          <h1 className='font-display text-5xl sm:text-6xl tracking-widest text-foreground uppercase drop-shadow-[0_0_15px_rgba(200,170,110,0.5)]'>
            Ready Check
          </h1>
        </div>

        <div className='relative flex items-center justify-center w-64 h-64 sm:w-80 sm:h-80 mb-16'>
          <svg className='absolute inset-0 w-full h-full -rotate-90' viewBox='0 0 100 100'>
            <circle
              cx='50'
              cy='50'
              r='46'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              className='text-muted/20'
            />
            <circle
              cx='50'
              cy='50'
              r='46'
              fill='none'
              stroke='currentColor'
              strokeWidth='4'
              strokeDasharray='289'
              strokeDashoffset={289 - (289 * progressPercentage) / 100}
              className={`transition-all duration-1000 ease-linear ${isUrgent ? 'text-destructive' : 'text-primary'}`}
            />
          </svg>

          <div className='absolute inset-0 flex flex-col items-center justify-center'>
            <p className={`font-mono text-7xl sm:text-8xl font-bold ${isUrgent ? 'text-destructive drop-shadow-[0_0_20px_rgba(211,47,47,0.8)]' : 'text-primary drop-shadow-[0_0_20px_rgba(10,200,185,0.6)]'}`}>
              {timeRemaining}
            </p>
          </div>
        </div>

        <div className='w-full max-w-md space-y-6'>
          {isUrgent && !hasResponded ? (
            <div className='flex items-center justify-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive animate-pulse'>
              <AlertTriangle className='h-5 w-5 shrink-0' />
              <span className='text-center'>Respond now or return to matchmaking.</span>
            </div>
          ) : null}

          {hasResponded ? (
            <div className='rounded-xl border border-primary/30 bg-primary/10 p-6 text-center text-lg font-display tracking-widest uppercase text-primary'>
              Response sent: {readyCheckState.playerResponse}
            </div>
          ) : null}

          {error ? (
            <div className='rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-center text-sm text-destructive'>{error.message}</div>
          ) : null}

          {!hasResponded && (
            <div className='flex flex-col gap-4'>
              <Button
                className='w-full h-24 font-display text-3xl tracking-widest uppercase bg-gradient-to-r from-primary to-teal-dim hover:from-teal hover:to-primary shadow-[0_0_30px_rgba(10,200,185,0.4)] rounded-2xl transition-all hover:scale-[1.02]'
                disabled={isLoading}
                onClick={() => {
                  void handleAccept()
                }}
                type='button'
              >
                Accept
              </Button>
              <Button
                className='w-full h-14 font-display text-lg tracking-widest uppercase border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl transition-all'
                disabled={isLoading}
                onClick={() => {
                  void handleDecline()
                }}
                type='button'
                variant='outline'
              >
                Decline
              </Button>
            </div>
          )}
        </div>
      </section>
    </>
  )

  if (!isReadyCheckVisible) {
    return (
      <main className='relative z-10 mx-auto grid min-h-[60vh] max-w-2xl place-items-center'>
        <Card className='w-full border-secondary bg-card/80 text-center shadow-2xl shadow-black/40'>
          <CardHeader>
            <CardTitle className='font-display text-sm tracking-[0.25em] text-primary uppercase'>Ready Check</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3 text-muted-foreground'>
            <p>No active ready check.</p>
            {error ? <p className='text-sm text-destructive'>{error.message}</p> : null}
          </CardContent>
        </Card>
      </main>
    )
  }

  return createPortal(modalContent, document.body)
}
