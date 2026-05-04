import { Outlet, createRootRoute } from '@tanstack/react-router'

import { useGlobalSessionReconnect } from './-root-reconnect-utils'

function RootRouteComponent() {
  useGlobalSessionReconnect()

  return <Outlet />
}

export const Route = createRootRoute({
  component: RootRouteComponent,
})
