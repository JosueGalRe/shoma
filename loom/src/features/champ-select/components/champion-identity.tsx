import { SkeletonShimmer } from '@/components/ui/skeleton-shimmer'
import { useChampions } from '@/core/http/ddragon-client'
import { resolveChampionIcon, getChampionName, getChampionTitle } from '@/lib/asset-resolver'
import { cn } from '@/lib/utils'

interface ChampionIdentityProps {
  championId: number
  size?: 'sm' | 'md' | 'lg'
  showTitle?: boolean
}

const sizeClasses = {
  sm: 'size-8',
  md: 'size-12',
  lg: 'size-16',
}

export function ChampionIdentity({ championId, size = 'md', showTitle = false }: ChampionIdentityProps) {
  const { data: champions, isLoading } = useChampions()

  if (isLoading) {
    return (
      <div className='flex items-center gap-3'>
        <SkeletonShimmer className={cn('shrink-0 rounded-full', sizeClasses[size])} />
        <div className='space-y-1'>
          <SkeletonShimmer className='h-4 w-24' />
          {showTitle && <SkeletonShimmer className='h-3 w-32' />}
        </div>
      </div>
    )
  }

  if (!champions || championId <= 0) {
    return (
      <div className='flex items-center gap-3'>
        <div
          className={cn(
            'border-primary/40 bg-background flex shrink-0 items-center justify-center rounded-full border',
            sizeClasses[size],
          )}
        >
          <span className='text-primary'>◇</span>
        </div>
        <div className='min-w-0'>
          <div className='font-display text-foreground truncate text-sm font-medium tracking-[0.14em] uppercase'>
            {championId > 0 ? championId : '—'}
          </div>
        </div>
      </div>
    )
  }

  const iconUrl = resolveChampionIcon(championId, champions)
  const name = getChampionName(championId, champions) || String(championId)
  const title = getChampionTitle(championId, champions)

  return (
    <div className='flex items-center gap-3'>
      <div className={cn('border-primary/40 bg-background shrink-0 overflow-hidden rounded-full border', sizeClasses[size])}>
        <img alt={name} className='h-full w-full object-cover' loading='lazy' src={iconUrl} />
      </div>
      <div className='min-w-0'>
        <div className='font-display text-foreground truncate text-sm font-medium tracking-[0.14em] uppercase'>{name}</div>
        {showTitle && title && <div className='text-muted truncate text-xs capitalize'>{title}</div>}
      </div>
    </div>
  )
}
