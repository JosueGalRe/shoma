import { useTranslation } from 'react-i18next'

import { ConnectScreen } from '@/features/connect'
import { useInstallPrompt } from '@/features/install'

import { Route } from './route'

export function IndexRouteComponent() {
  const { t } = useTranslation()
  const { canInstall, promptInstall } = useInstallPrompt()
  const { variant } = Route.useSearch()

  const showInstallButton = canInstall || Boolean(variant)

  return (
    <ConnectScreen
      installButtonLabel={showInstallButton ? t('pwa.install') : undefined}
      onInstallClick={
        showInstallButton
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
