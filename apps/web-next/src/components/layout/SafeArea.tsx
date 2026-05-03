import type { ReactNode } from 'react'

interface SafeAreaProps {
  children: ReactNode
  className?: string
}

export function SafeArea({ children, className = '' }: SafeAreaProps) {
  return (
    <div className={`safe-area-padding ${className}`}>
      {children}
    </div>
  )
}
