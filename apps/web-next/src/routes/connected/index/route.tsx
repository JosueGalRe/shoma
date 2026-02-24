import { Navigate, createFileRoute } from '@tanstack/react-router'

import { readConnectedIndexDestination } from './-connected-index-utils'

export const Route = createFileRoute('/connected/')({
  component: ConnectedIndexRoute,
})

function ConnectedIndexRoute() {
  return <Navigate to={readConnectedIndexDestination()} />
}
