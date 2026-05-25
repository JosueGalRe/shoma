import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { ConnectScreen } from '@/features/connect'
import { useInstallPrompt } from '@/features/install'

function IndexRouteComponent() {
  const { t } = useTranslation()
  const { canInstall, promptInstall } = useInstallPrompt()

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
    />
  )
}

export const Route = createFileRoute('/')({
  component: IndexRouteComponent,
  validateSearch: (search) => {
    return {
      code: typeof search.code === 'string' ? search.code : undefined,
    }
  },
})
