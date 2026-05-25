import { createFileRoute, Navigate } from '@tanstack/react-router'

function ConnectedIndexRouteComponent() {
  return <Navigate to='/connected/lobby' replace />
}

export const Route = createFileRoute('/connected/')({
  component: ConnectedIndexRouteComponent,
})
