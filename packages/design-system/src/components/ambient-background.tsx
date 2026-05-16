import type { ReactNode } from 'react'

import { cn } from '../lib/cn'

export interface AmbientBackgroundProps {
  children: ReactNode
  className?: string
}

export function AmbientBackground({ children, className }: AmbientBackgroundProps) {
  return (
    <div className={cn('bg-surface text-text relative flex h-full w-full flex-col overflow-hidden', className)}>
      <div
        className='bg-primary/10 pointer-events-none absolute top-0 -left-40 h-[500px] w-[500px] animate-[pulse_4s_ease-in-out_infinite] rounded-full blur-[150px]'
        aria-hidden='true'
      />
      <div
        className='bg-accent/10 pointer-events-none absolute -right-40 bottom-0 h-[500px] w-[500px] animate-[pulse_5s_ease-in-out_infinite] rounded-full blur-[150px]'
        aria-hidden='true'
      />
      <div
        className='bg-border-gold/10 pointer-events-none absolute top-1/3 left-1/3 h-96 w-96 animate-[pulse_6s_ease-in-out_infinite] rounded-full blur-[120px]'
        aria-hidden='true'
      />

      <div className='relative z-10 flex h-full w-full flex-col overflow-hidden'>{children}</div>
    </div>
  )
}
