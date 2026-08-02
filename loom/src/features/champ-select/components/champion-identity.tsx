import { SkeletonShimmer } from '@/components/ui/skeleton-shimmer'
import { useChampions } from '@/core/http/ddragon'
import { getChampionName, getChampionTitle, resolveChampionIcon } from '@/lib/asset-resolver'
import { cn } from '@/lib/shared-utils'

import { championIdentityStyles } from './champion-identity-styles'
import { sizeClasses } from './champion-identity-utils'

import type { ChampionIdentityProps } from './champion-identity-types'

export function ChampionIdentity({ championId, size = 'md', showTitle = false }: ChampionIdentityProps) {
  const { data: champions, isLoading } = useChampions()
  const styles = championIdentityStyles()

  if (isLoading) {
    return (
      <div className={styles.root()}>
        <SkeletonShimmer className={cn('shrink-0 rounded-full', sizeClasses[size])} />

        <div className={styles.loadingText()}>
          <SkeletonShimmer className="h-4 w-24" />

          {showTitle && <SkeletonShimmer className="h-3 w-32" />}
        </div>
      </div>
    )
  }

  if (!champions || championId <= 0) {
    return (
      <div className={styles.root()}>
        <div className={cn(styles.fallback(), sizeClasses[size])}>
          <span className={styles.fallbackIcon()}>◇</span>
        </div>

        <div className="min-w-0">
          <div className={styles.name()}>{championId > 0 ? championId : '—'}</div>
        </div>
      </div>
    )
  }

  const iconUrl = resolveChampionIcon(championId, champions)
  const name = getChampionName(championId, champions) || String(championId)
  const title = getChampionTitle(championId, champions)

  return (
    <div className={styles.root()}>
      <div className={cn('border-primary/40 bg-background shrink-0 overflow-hidden rounded-full border', sizeClasses[size])}>
        <img alt={name} className="h-full w-full object-cover" loading="lazy" src={iconUrl} />
      </div>

      <div className="min-w-0">
        <div className={styles.name()}>{name}</div>

        {showTitle && title && <div className={styles.title()}>{title}</div>}
      </div>
    </div>
  )
}
