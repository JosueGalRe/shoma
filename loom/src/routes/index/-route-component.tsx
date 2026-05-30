import { useTranslation } from 'react-i18next'

import { ConnectScreen } from '@/features/connect'
import { useInstallPrompt } from '@/features/install'

import { Route } from './route'

export function IndexRouteComponent() {
  const { t } = useTranslation()
  const { canInstall, promptInstall } = useInstallPrompt()
  const { variant } = Route.useSearch()

  return (
    <ConnectScreen
      installButtonLabel={canInstall ? t('pwa.install') : undefined}
      onInstallClick={
        canInstall
          ? () => {
              return void promptInstall()
            }
          : undefined
      }
      title="SHO'MA"
      variant={variant}
    />
  )
}
