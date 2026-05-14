import type { ReactNode } from 'react'

interface SafeAreaProps {
  children: ReactNode
  className?: string
}

export function SafeArea({ children, className = '' }: SafeAreaProps) {
  return (
    <div
      className={className}
      style={{
        paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)',
        paddingRight: 'calc(env(safe-area-inset-right) + 1rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)',
        paddingLeft: 'calc(env(safe-area-inset-left) + 1rem)',
      }}
    >
      {children}
    </div>
  )
}
