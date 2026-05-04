import type { ReactNode } from 'react'
import { LandscapeWarning } from './LandscapeWarning'
import { SafeArea } from './SafeArea'

interface AppShellProps {
  children: ReactNode
  className?: string
}

export function AppShell({ children, className = '' }: AppShellProps) {
  return (
    <SafeArea className={`relative flex min-h-screen flex-col ${className}`}>
      <LandscapeWarning />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </SafeArea>
  )
}
