import { createFileRoute } from '@tanstack/react-router'

import { QueueScreen } from '@features/queue/components/queue-screen'

export const Route = createFileRoute('/connected/queue')({
  component: ConnectedQueueRoute,
})

function ConnectedQueueRoute() {
  return <QueueScreen />
}
