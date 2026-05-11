import type { QueryClient } from '@tanstack/react-query'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'

import { useLcuCacheClear } from '@/core/lcu/use-lcu-cache-clear'
import { useGlobalSessionReconnect } from '@/lib/reconnect-utils'

function RootRouteComponent() {
  useGlobalSessionReconnect()
  useLcuCacheClear()

  return <Outlet />
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  component: RootRouteComponent,
})
