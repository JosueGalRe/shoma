import { createFileRoute } from '@tanstack/react-router'

import { ConnectScreen } from '@/features/connect'

export const Route = createFileRoute('/')({
  component: ConnectScreen,
})
