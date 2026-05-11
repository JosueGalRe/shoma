import { createFileRoute } from '@tanstack/react-router'

import { ReadyCheckModal } from '@features/ready-check/components/ready-check-modal'

export const Route = createFileRoute('/connected/ready-check')({
  component: ConnectedReadyCheckRoute,
})

function ConnectedReadyCheckRoute() {
  return <ReadyCheckModal />
}
