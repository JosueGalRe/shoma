import { AmbientBackground } from '@/components/ui/ambient-background'

import type { AppShellProps } from './app-shell-types'
import { LandscapeWarning } from './landscape-warning'
import { SafeArea } from './safe-area'

export function AppShell({ children, className = '' }: AppShellProps) {
  return (
    <div className='text-foreground h-[100dvh] overflow-x-hidden'>
      <SafeArea className={`relative flex h-[100dvh] flex-col ${className}`}>
        <LandscapeWarning />
        <AmbientBackground className='flex-1'>{children}</AmbientBackground>
      </SafeArea>
    </div>
  )
}
