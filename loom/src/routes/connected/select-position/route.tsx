import { createFileRoute } from '@tanstack/react-router'

import { lobbySessionDescriptor } from '@/core/lcu/queries'
import { ensureLcuRouteData } from '@/core/relay/route-loader'

import { SelectPositionRouteComponent } from './-route-component'

export const Route = createFileRoute('/connected/select-position')({
  component: SelectPositionRouteComponent,
  loader: async ({ context }) => {
    await ensureLcuRouteData(context.queryClient, [lobbySessionDescriptor])
  },
})
