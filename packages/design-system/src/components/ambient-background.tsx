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
        className='bg-primary pointer-events-none absolute -top-16 -left-16 h-[300px] w-[300px] animate-[pulse_4s_ease-in-out_infinite] rounded-full opacity-25 blur-[80px]'
        aria-hidden='true'
      />
      <div
        className='bg-accent pointer-events-none absolute -right-16 -bottom-16 h-[300px] w-[300px] animate-[pulse_5s_ease-in-out_infinite] rounded-full opacity-20 blur-[80px]'
        aria-hidden='true'
      />
      <div
        className='bg-border-gold pointer-events-none absolute -bottom-24 -left-24 h-[250px] w-[250px] animate-[pulse_6s_ease-in-out_infinite] rounded-full opacity-15 blur-[60px]'
        aria-hidden='true'
      />

      <div className='relative z-10 flex h-full w-full flex-col overflow-hidden'>{children}</div>
    </div>
  )
}
