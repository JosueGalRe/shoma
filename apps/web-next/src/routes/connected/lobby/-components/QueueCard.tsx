import { Trans, useTranslation } from 'react-i18next'

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

  return (
    <Card className={`relative overflow-hidden ${queueState ? 'animate-queue-active' : ''}`}>
      {mapIconUrl && (
        <>
          <img src={mapIconUrl} alt='' className='absolute inset-0 h-full w-full object-cover opacity-20' />
          <div className='absolute inset-0 bg-[#010a13]/80' />
        </>
      )}
      <CardHeader className='relative z-10 pb-3'>
        <CardTitle className='font-display text-xs uppercase tracking-[0.2em] text-[#c8a96e]'>
          {t(($) => $.connected.queue)}
        </CardTitle>
      </CardHeader>
      <CardContent className='relative z-10'>
        {queueState ? (
          <div className='space-y-3'>
            <div className='flex justify-between items-center border-b border-[#785a28]/20 pb-2 text-sm text-[#a09b8c]'>
              <Trans
                components={{ value: <span className='text-[#f0e6d2] font-semibold ml-auto' /> }}
                i18nKey={($) => $.connected.stateValue}
                values={{ value: queueState.searchState ?? t(($) => $.connected.searching) }}
              />
            </div>
            <div className='flex justify-between items-center border-b border-[#785a28]/20 pb-2 text-sm text-[#a09b8c]'>
              <Trans
                components={{ value: <span className='text-[#f0e6d2] font-semibold font-mono ml-auto' /> }}
                i18nKey={($) => $.connected.elapsedValue}
                values={{ value: formatSeconds(queueState.timeInQueue ?? 0) }}
              />
            </div>
            <div className='flex justify-between items-center border-b border-[#785a28]/20 pb-2 text-sm text-[#a09b8c]'>
              <Trans
                components={{ value: <span className='text-[#f0e6d2] font-semibold font-mono ml-auto' /> }}
                i18nKey={($) => $.connected.estimatedValue}
                values={{ value: formatSeconds(queueState.estimatedQueueTime ?? 0) }}
              />
            </div>
            <Button
              variant='destructive'
              className='w-full mt-4 font-display tracking-wider uppercase'
              disabled={lobbyActionPending}
              onClick={() => {
                void leaveQueue()
              }}
              type='button'
            >
              {t(($) => $.connected.queueLeave)}
            </Button>
          </div>
        ) : (
          <div className='flex h-full min-h-[120px] items-center justify-center'>
            <p className='text-[#a09b8c] italic'>{t(($) => $.connected.notInQueue)}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
