import { Trans, useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ReadyCheckState } from '@core/rift/rift-lcu-types'

interface ReadyCheckCardProps {
  readyCheckVisible: boolean
  readyCheckState: ReadyCheckState | null
  readyCheckPending: boolean
  readyCheckResponded: boolean
  acceptReadyCheck: () => Promise<void>
  declineReadyCheck: () => Promise<void>
}

export function ReadyCheckCard({
  readyCheckVisible,
  readyCheckState,
  readyCheckPending,
  readyCheckResponded,
  acceptReadyCheck,
  declineReadyCheck,
}: ReadyCheckCardProps) {
  const { t } = useTranslation()

  return (
    <Card className={readyCheckVisible ? `animate-ready-check-enter ${readyCheckState && readyCheckState.timer < 5 ? 'animate-countdown-pulse' : 'animate-ready-check-glow'}` : ''}>
      <CardHeader className='pb-3'>
        <CardTitle className='font-display text-xs uppercase tracking-[0.2em] text-primary'>
          {t(($) => $.connected.readyCheck)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {readyCheckVisible && readyCheckState ? (
          <div className='space-y-3'>
            <div className='flex justify-between items-center border-b border-gold-dim/20 pb-2 text-sm text-muted-foreground'>
              <Trans
                components={{ value: <span className='text-foreground font-semibold font-mono ml-auto' /> }}
                i18nKey={($) => $.connected.readyCheckTimerValue}
                values={{ value: String(readyCheckState.timer) }}
              />
            </div>
            <div className='flex justify-between items-center border-b border-gold-dim/20 pb-2 text-sm text-muted-foreground'>
              <Trans
                components={{ value: <span className='text-foreground font-semibold ml-auto' /> }}
                i18nKey={($) => $.connected.readyCheckResponseValue}
                values={{ value: readyCheckState.playerResponse }}
              />
            </div>
            <div className='flex gap-3 pt-2'>
              <Button
                variant='hextech'
                className='flex-1 font-display tracking-wider uppercase'
                disabled={readyCheckPending || readyCheckResponded}
                onClick={() => {
                  void acceptReadyCheck()
                }}
                type='button'
              >
                {t(($) => $.connected.readyCheckAccept)}
              </Button>
              <Button
                variant='destructive'
                className='flex-1 font-display tracking-wider uppercase'
                disabled={readyCheckPending || readyCheckResponded}
                onClick={() => {
                  void declineReadyCheck()
                }}
                type='button'
              >
                {t(($) => $.connected.readyCheckDecline)}
              </Button>
            </div>
          </div>
        ) : (
          <div className='flex h-full min-h-[120px] items-center justify-center'>
            <p className='text-muted-foreground italic'>{t(($) => $.connected.readyCheckNone)}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
