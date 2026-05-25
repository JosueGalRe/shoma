import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { SkeletonShimmer } from '@/components/ui/skeleton-shimmer'
import { useChampions } from '@/core/http/ddragon-client'
import { getChampionName } from '@/lib/asset-resolver'

import { benchStyles } from './bench-styles'
import { ChampionIdentity } from './champion-identity'

import type { BenchItemProps } from './bench-types'

export function BenchItem({ championId, onSwap }: BenchItemProps) {
  const { t } = useTranslation()
  const { data: champions, isLoading } = useChampions()
  const name = champions
    ? getChampionName(championId, champions) || t('champSelect.unknownChampion', 'Unknown champion')
    : t('champSelect.unknownChampion', 'Unknown champion')

  if (isLoading) {
    return (
      <div className={benchStyles.itemContainer}>
        <ChampionIdentity championId={championId} size='sm' />

        <SkeletonShimmer className='h-8 w-16 rounded-md' />
      </div>
    )
  }

  return (
    <div className={benchStyles.itemContainer}>
      <ChampionIdentity championId={championId} size='sm' />

      <Button
        className={benchStyles.itemButton}
        onClick={() => {
          return onSwap(championId)
        }}
        size='sm'
        variant='secondary'
        aria-label={`Swap to ${name}`}
      >
        {t('champSelect.swap', 'Swap')}
      </Button>
    </div>
  )
}
