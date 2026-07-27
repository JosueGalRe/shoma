import { Check, Settings, WifiOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { socialConnectionDotStyles, socialPanelHeaderStyles, socialStatusBadgeStyles } from '../social-styles'

import type { SocialPanelHeaderProps } from '../social-types'

export function SocialPanelHeader({ isDisconnected, showOfflineGroup, toggleShowOfflineGroup }: SocialPanelHeaderProps) {
  const styles = socialPanelHeaderStyles()
  const { t } = useTranslation()

  return (
    <>
      <div className={styles.root()}>
        <div className={styles.actions()}>
          <div className={socialStatusBadgeStyles({ disconnected: isDisconnected })}>
            <span className={socialConnectionDotStyles({ disconnected: isDisconnected })} />

            {isDisconnected ? 'Offline' : 'Online'}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className={styles.settingsButton()} aria-label="Settings">
                <Settings className={styles.settingsIcon()} />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className={styles.settingsContent()}>
              <DropdownMenuLabel className={styles.settingsLabel()}>Settings</DropdownMenuLabel>

              <DropdownMenuItem onClick={toggleShowOfflineGroup} className={styles.settingsItem()}>
                <div className="flex w-full items-center justify-between">
                  <span>{t('social.settings.showOfflineGroup')}</span>

                  {showOfflineGroup && <Check className="text-primary size-4" />}
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isDisconnected ? (
        <div className={styles.offlineNotice()}>
          <WifiOff className={styles.offlineIcon()} aria-hidden="true" />
          Connect to your League client to see friends and chat.
        </div>
      ) : null}
    </>
  )
}
