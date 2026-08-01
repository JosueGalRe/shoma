import { createFileRoute } from '@tanstack/react-router'

import { gameQueuesDescriptor, lobbySessionDescriptor, platformConfigDescriptor } from '@/core/lcu/queries'
import { ensureLcuRouteData } from '@/core/relay/route-loader'

import { CreateLobbyRouteComponent } from './-route-component'

export const Route = createFileRoute('/connected/create-lobby')({
  component: CreateLobbyRouteComponent,
  loader: async ({ context }) => {
    await ensureLcuRouteData(context.queryClient, [
      gameQueuesDescriptor,
      platformConfigDescriptor('LcuSocial', 'EnabledGameQueues'),
      platformConfigDescriptor('LcuSocial', 'DefaultGameQueues'),
      lobbySessionDescriptor,
    ])
  },
})
