import { Outlet, createFileRoute } from '@tanstack/react-router'

function ConnectedRouteComponent() {
  return <Outlet />
}

export const Route = createFileRoute('/connected')({
  component: ConnectedRouteComponent,
})
