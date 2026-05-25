import * as React from 'react'

import { cn } from '../lib/cn'

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('bg-muted animate-pulse rounded-md', className)} {...props} />
}

function SkeletonShimmer({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const [showFallback, setShowFallback] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowFallback(true)
    }, 3000)

    return () => {
      return clearTimeout(timer)
    }
  }, [])

  if (showFallback) {
    return <div className={cn('bg-secondary rounded-md', className)} {...props} />
  }

  return (
    <div
      className={cn(
        'from-background via-secondary to-background motion-safe:animate-shimmer rounded-md bg-gradient-to-r bg-[length:200%_100%]',
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton, SkeletonShimmer }
