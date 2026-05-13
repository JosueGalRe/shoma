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
      onInstallClick={canInstall ? () => void promptInstall() : undefined}
      subtitle="Control your game from the shadows."
      title="SHO'MA"
    />
  )
}

export const Route = createFileRoute('/')({
  validateSearch: (search) => ({
    code: typeof search.code === 'string' ? search.code : undefined,
  }),
  component: IndexRouteComponent,
})
