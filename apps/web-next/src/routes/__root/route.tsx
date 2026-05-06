import type { QueryClient } from '@tanstack/react-query'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'

import { useGlobalSessionReconnect } from '@/lib/reconnect-utils'

function RootRouteComponent() {
  useGlobalSessionReconnect()

  return <Outlet />
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  component: RootRouteComponent,
})
