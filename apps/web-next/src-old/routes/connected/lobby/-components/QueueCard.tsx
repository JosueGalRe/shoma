import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatSeconds } from '@core/rift/rift-lcu-utils'
import type { QueueState } from '@core/rift/rift-lcu-types'
import { buildMapIconUrl } from '../-lobby-utils'

interface QueueCardProps {
  queueState: QueueState | null
  lobbyActionPending: boolean
  mapId: number | null
  ddragonVersionValue: string | null
  leaveQueue: () => Promise<void>
}

export function QueueCard({ queueState, lobbyActionPending, mapId, ddragonVersionValue, leaveQueue }: QueueCardProps) {
  const { t } = useTranslation()
  const mapIconUrl = buildMapIconUrl(ddragonVersionValue, mapId)

  useEffect(() => {
    if (!queueState) return
    
    const interval = setInterval(() => {
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }, 5000)
    
    return () => clearInterval(interval)
  }, [queueState])

  return (
    <Card className={`relative overflow-hidden ${queueState ? 'animate-queue-active border-primary shadow-[0_0_30px_rgba(10,200,185,0.2)]' : ''}`}>
      {mapIconUrl && queueState && (
        <>
          <img src={mapIconUrl} alt='' className='absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-overlay' />
          <div className='absolute inset-0 bg-gradient-to-b from-[#0a0e13]/90 to-[#111820]/95' />
        </>
      )}
      <CardHeader className='relative z-10 pb-0'>
        <CardTitle className='font-display text-xs uppercase tracking-[0.2em] text-primary text-center'>
          {t(($) => $.connected.queue)}
        </CardTitle>
      </CardHeader>
      <CardContent className='relative z-10 pt-6'>
        {queueState ? (
          <div className='flex flex-col items-center space-y-8'>
            <div className='relative flex items-center justify-center w-48 h-48'>
              <svg className='absolute inset-0 w-full h-full -rotate-90' viewBox='0 0 100 100'>
                <circle
                  cx='50'
                  cy='50'
                  r='46'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  className='text-muted/30'
                />
                <circle
                  cx='50'
                  cy='50'
                  r='46'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='4'
                  strokeDasharray='289'
                  strokeDashoffset={289 - (289 * ((queueState.timeInQueue ?? 0) % 60)) / 60}
                  className='text-primary transition-all duration-1000 ease-linear'
                />
              </svg>
              <div className='flex flex-col items-center justify-center absolute inset-0'>
                <div className='text-5xl font-display font-bold text-primary drop-shadow-[0_0_15px_rgba(10,200,185,0.6)]'>
                  {formatSeconds(queueState.timeInQueue ?? 0)}
                </div>
                <div className='text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-2'>
                  Elapsed
                </div>
              </div>
            </div>
            
            <div className='w-full space-y-4'>
              <div className='flex justify-between items-center bg-background/50 rounded-lg p-3 border border-border'>
                <span className='text-sm text-muted-foreground uppercase tracking-wider'>Estimated</span>
                <span className='text-lg font-mono text-secondary font-semibold'>
                  {formatSeconds(queueState.estimatedQueueTime ?? 0)}
                </span>
              </div>
              
              <div className='text-center text-sm font-semibold text-primary animate-pulse tracking-widest uppercase'>
                {queueState.searchState ?? t(($) => $.connected.searching)}
              </div>
              
              <Button
                variant='outline'
                className='w-full h-12 font-display tracking-widest uppercase border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors'
                disabled={lobbyActionPending}
                onClick={() => {
                  void leaveQueue()
                }}
                type='button'
              >
                {t(($) => $.connected.queueLeave)}
              </Button>
            </div>
          </div>
        ) : (
          <div className='flex h-full min-h-[120px] items-center justify-center'>
            <p className='text-muted-foreground italic'>{t(($) => $.connected.notInQueue)}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
