import type { ReactNode } from 'react'
import { LandscapeWarning } from './LandscapeWarning'
import { SafeArea } from './SafeArea'

interface AppShellProps {
  children: ReactNode
  className?: string
}

export function AppShell({ children, className = '' }: AppShellProps) {
  return (
    <div className="h-[100dvh] overflow-x-hidden bg-background text-foreground">
      <SafeArea className={`relative flex h-[100dvh] flex-col ${className}`}>
        <LandscapeWarning />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </SafeArea>
    </div>
  )
}
