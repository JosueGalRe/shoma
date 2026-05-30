import { Outlet } from '@tanstack/react-router'

import { AppShell } from '@/components/layout'
import { UpdatePrompt } from '@/components/update-prompt'
import { useLcuCacheClear } from '@/core/lcu/use-lcu-cache-clear'
import { usePwaUpdate } from '@/core/pwa/use-pwa-update'
import { useGlobalSessionReconnect } from '@/lib/reconnect-utils'

export function RootRouteComponent() {
  useGlobalSessionReconnect()
  useLcuCacheClear()

  const { needsRefresh, update, dismiss } = usePwaUpdate()

  return (
    <AppShell>
      <Outlet />

      {needsRefresh ? <UpdatePrompt onDismiss={dismiss} onUpdate={update} /> : null}
    </AppShell>
  )
}
