import type { HTMLAttributes } from 'react'

import { cn } from '../lib/cn'

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  label?: string
}

export function Spinner({ className, label = 'Loading', ...props }: SpinnerProps) {
  return (
    <div
      className={cn(
        'text-primary inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent',
        className,
      )}
      {...props}
    >
      <span className="sr-only">{label}</span>
    </div>
  )
}
