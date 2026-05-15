import type { ReactNode } from 'react'

import { AmbientBackground } from '@/components/ui/ambient-background'

import { LandscapeWarning } from './LandscapeWarning'
import { SafeArea } from './SafeArea'

interface AppShellProps {
  children: ReactNode
  className?: string
}

export function AppShell({ children, className = '' }: AppShellProps) {
  return (
    <div className="h-[100dvh] overflow-x-hidden text-foreground">
      <SafeArea className={`relative flex h-[100dvh] flex-col ${className}`}>
        <LandscapeWarning />
        <AmbientBackground className="flex-1">
          {children}
        </AmbientBackground>
      </SafeArea>
    </div>
  )
}
