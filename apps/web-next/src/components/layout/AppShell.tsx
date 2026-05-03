import type { ReactNode } from 'react'
import { LandscapeWarning } from './LandscapeWarning'
import { SafeArea } from './SafeArea'

interface AppShellProps {
  header?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
}

export function AppShell({ header, footer, children, className = '' }: AppShellProps) {
  return (
    <SafeArea className="relative flex min-h-screen flex-col">
      <LandscapeWarning />
      {header && <div className="shrink-0">{header}</div>}
      <main className={`flex-1 overflow-auto ${className}`}>
        {children}
      </main>
      {footer && <div className="shrink-0">{footer}</div>}
    </SafeArea>
  )
}
