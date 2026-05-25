import { Outlet } from '@tanstack/react-router'

import { AppShell } from '@/components/layout'
import { useLcuCacheClear } from '@/core/lcu/use-lcu-cache-clear'
import { useGlobalSessionReconnect } from '@/lib/reconnect-utils'

export function RootRouteComponent() {
  useGlobalSessionReconnect()
  useLcuCacheClear()

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
