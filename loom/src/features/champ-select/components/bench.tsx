import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SkeletonShimmer } from '@/components/ui/skeleton-shimmer'
import { useChampions } from '@/core/http/ddragon-client'
import type { ChampionId } from '@/core/types/branded'
import { getChampionName } from '@/lib/asset-resolver'

import { ChampionIdentity } from './champion-identity'

interface BenchProps {
  bench: ChampionId[]
  canReroll: boolean
  rerollCount: number
  isLoading: boolean
  onReroll: () => void
  onSwap: (championId: ChampionId) => void
}

function BenchItem({ championId, onSwap }: { championId: ChampionId; onSwap: (id: ChampionId) => void }) {
  const { t } = useTranslation()
  const { data: champions, isLoading } = useChampions()
  const name = champions
    ? getChampionName(championId, champions) || t('champSelect.unknownChampion', 'Unknown champion')
    : t('champSelect.unknownChampion', 'Unknown champion')

  if (isLoading) {
    return (
      <div className='border-border bg-secondary/60 flex min-w-[200px] shrink-0 items-center justify-between gap-3 rounded-md border p-2'>
        <ChampionIdentity championId={championId} size='sm' />
        <SkeletonShimmer className='h-8 w-16 rounded-md' />
      </div>
    )
  }

  return (
    <div className='border-border bg-secondary/60 flex min-w-[200px] shrink-0 items-center justify-between gap-3 rounded-md border p-2'>
      <ChampionIdentity championId={championId} size='sm' />
      <Button
        className='min-h-[44px] min-w-[44px]'
        onClick={() => onSwap(championId)}
        size='sm'
        variant='secondary'
        aria-label={`Swap to ${name}`}
      >
        {t('champSelect.swap', 'Swap')}
      </Button>
    </div>
  )
}

export function Bench({ bench, canReroll, rerollCount, isLoading, onReroll, onSwap }: BenchProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('champSelect.bench')}</CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        <Button className='min-h-[44px] w-full' disabled={!canReroll || isLoading} onClick={onReroll}>
          {t('champSelect.reroll')} ({rerollCount})
        </Button>
        <div className='scrollbar-hide flex [scrollbar-width:none] gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'>
          {bench.map((championId) => (
            <BenchItem key={championId} championId={championId} onSwap={onSwap} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
