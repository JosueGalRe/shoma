import { Outlet, createRootRoute } from '@tanstack/react-router'

import { useGlobalSessionReconnect } from './-root-reconnect-utils'
import { readRootRouteLayout } from './-root-utils'

export const Route = createRootRoute({
  component: RootRouteComponent,
})

function RootRouteComponent() {
  useGlobalSessionReconnect()

  if (readRootRouteLayout() === 'outlet-only') {
    return <Outlet />
  }

  return <Outlet />
}
