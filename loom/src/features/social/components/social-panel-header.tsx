import { Check, Settings, WifiOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface SocialPanelHeaderProps {
  isDisconnected: boolean
  showOfflineGroup: boolean
  toggleShowOfflineGroup: () => void
}

export function SocialPanelHeader({ isDisconnected, showOfflineGroup, toggleShowOfflineGroup }: SocialPanelHeaderProps) {
  const { t } = useTranslation()

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted">SHO&apos;MA</p>
          <h2 className="font-display text-lg tracking-wider text-primary">Social</h2>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium',
              isDisconnected
                ? 'border-accent/30 bg-accent/10 text-accent'
                : 'border-primary/30 bg-primary/10 text-primary'
            )}
          >
            <span className={cn('h-2 w-2 rounded-full', isDisconnected ? 'bg-accent' : 'bg-primary')} />
            {isDisconnected ? 'Offline' : 'Online'}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="size-7 rounded-full border-border bg-secondary hover:bg-secondary" aria-label="Settings">
                <Settings className="size-3.5 text-muted" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border-border bg-secondary text-foreground">
              <DropdownMenuLabel className="text-muted">Settings</DropdownMenuLabel>
              <DropdownMenuItem onClick={toggleShowOfflineGroup} className="cursor-pointer hover:bg-secondary focus:bg-secondary">
                <div className="flex w-full items-center justify-between">
                  <span>{t('social.settings.showOfflineGroup')}</span>
                  {showOfflineGroup && <Check className="size-4 text-primary" />}
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isDisconnected ? (
        <div className="mt-3 flex items-center gap-2 rounded-sm border border-border bg-background/80 px-3 py-2 text-xs text-muted">
          <WifiOff className="size-3.5 text-accent" aria-hidden="true" />
          Connect to your League client to see friends and chat.
        </div>
      ) : null}
    </>
  )
}
