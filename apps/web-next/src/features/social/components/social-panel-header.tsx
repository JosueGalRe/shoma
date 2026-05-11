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
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-lol-text-muted">Mimic</p>
          <h2 className="font-display text-lg tracking-wider text-lol-gold">Social</h2>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium',
              isDisconnected
                ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300'
                : 'border-green-500/30 bg-green-500/10 text-green-300'
            )}
          >
            <span className={cn('h-2 w-2 rounded-full', isDisconnected ? 'bg-yellow-400' : 'bg-green-400')} />
            {isDisconnected ? 'Offline' : 'Online'}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="size-7 rounded-full border-lol-border-subtle bg-lol-navy-800 hover:bg-lol-navy-700" aria-label="Settings">
                <Settings className="size-3.5 text-lol-text-secondary" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border-lol-border-subtle bg-lol-navy-900 text-lol-text-primary">
              <DropdownMenuLabel className="text-lol-text-muted">Settings</DropdownMenuLabel>
              <DropdownMenuItem onClick={toggleShowOfflineGroup} className="cursor-pointer hover:bg-lol-navy-800 focus:bg-lol-navy-800">
                <div className="flex w-full items-center justify-between">
                  <span>{t('social.settings.showOfflineGroup')}</span>
                  {showOfflineGroup && <Check className="size-4 text-lol-gold" />}
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isDisconnected ? (
        <div className="mt-3 flex items-center gap-2 rounded-sm border border-lol-border-subtle bg-lol-navy-950/80 px-3 py-2 text-xs text-lol-text-secondary">
          <WifiOff className="size-3.5 text-yellow-300" aria-hidden="true" />
          Connect to your League client to see friends and chat.
        </div>
      ) : null}
    </>
  )
}
