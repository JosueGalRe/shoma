import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { ConnectScreen } from '@/features/connect'

function IndexRouteComponent() {
  const { t } = useTranslation()

  return <ConnectScreen subtitle={t('connection.subtitle')} title={t('connection.title')} />
}

export const Route = createFileRoute('/')({
  component: IndexRouteComponent,
})
