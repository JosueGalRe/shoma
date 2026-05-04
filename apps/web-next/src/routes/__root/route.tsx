import { Outlet, createRootRoute } from '@tanstack/react-router'

import { useGlobalSessionReconnect } from '@/lib/reconnect-utils'

function RootRouteComponent() {
  useGlobalSessionReconnect()

  return <Outlet />
}

export const Route = createRootRoute({
  component: RootRouteComponent,
})
