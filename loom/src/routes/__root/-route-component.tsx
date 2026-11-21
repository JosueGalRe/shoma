import { Outlet, useRouterState } from '@tanstack/react-router'

import { AppShell } from '@/components/layout'
import { UpdatePrompt } from '@/components/update-prompt'
import { useLcuCacheClear } from '@/core/lcu/use-lcu-cache-clear'
import { usePwaUpdate } from '@/core/pwa/use-pwa-update'
import { useSocialDocked } from '@/features/social/hooks/use-social-docked'
import { useGlobalSessionReconnect } from '@/lib/reconnect-utils'

export function RootRouteComponent() {
  useGlobalSessionReconnect()
  useLcuCacheClear()

  const { needsRefresh, update, dismiss } = usePwaUpdate()
  const isConnected = useRouterState({
    select: (state) => {
      return state.location.pathname.startsWith('/connected')
    },
  })
  const docked = useSocialDocked()

  return (
    <AppShell wide={isConnected && docked}>
      <Outlet />

      <UpdatePrompt open={needsRefresh} onDismiss={dismiss} onUpdate={update} />
    </AppShell>
  )
}
