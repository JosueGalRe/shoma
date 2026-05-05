import type { ReactNode } from 'react'
import { LandscapeWarning } from './LandscapeWarning'
import { SafeArea } from './SafeArea'

interface AppShellProps {
  children: ReactNode
  className?: string
}

export function AppShell({ children, className = '' }: AppShellProps) {
  return (
    <div className="bg-gradient-to-b from-lol-navy-950 via-lol-bg-base to-lol-navy-900 min-h-screen overflow-x-hidden text-lol-text-primary">
      <SafeArea className={`relative flex min-h-screen flex-col ${className}`}>
        <LandscapeWarning />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SafeArea>
    </div>
  )
}
