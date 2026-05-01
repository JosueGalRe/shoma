import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('animate-pulse bg-[#1e2328]', className)}
      {...props}
    />
  )
}

export { Skeleton }
