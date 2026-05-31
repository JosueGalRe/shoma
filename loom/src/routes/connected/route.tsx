import { createFileRoute, redirect } from '@tanstack/react-router'

import { useSessionStore } from '@/core/state/session-store'

import { ConnectedRouteComponent } from './-route-component'

export const Route = createFileRoute('/connected')({
  beforeLoad: () => {
    const { connectionCode } = useSessionStore.getState()

    if (!connectionCode || connectionCode.length === 0) {
      throw redirect({ to: '/' })
    }
  },
  component: ConnectedRouteComponent,
})
