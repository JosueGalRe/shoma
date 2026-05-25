import { createFileRoute } from '@tanstack/react-router'

import {
  currentSummonerDescriptor,
  gameQueuesDescriptor,
  invitesDescriptor,
  lobbySessionDescriptor,
  platformConfigDescriptor,
  queueDescriptor,
  queueSearchDescriptor,
  sentInvitesDescriptor,
} from '@/core/lcu/lcu-queries'
import { ensureLcuRouteData } from '@/core/relay/route-loader'

import { LobbyRouteComponent } from './-route-component'

export const Route = createFileRoute('/connected/lobby')({
  component: LobbyRouteComponent,
  loader: async ({ context }) => {
    await ensureLcuRouteData(context.queryClient, [
      lobbySessionDescriptor,
      queueDescriptor,
      queueSearchDescriptor,
      invitesDescriptor,
      sentInvitesDescriptor,
      currentSummonerDescriptor,
      gameQueuesDescriptor,
      platformConfigDescriptor('LcuSocial', 'EnabledGameQueues'),
      platformConfigDescriptor('LcuSocial', 'DefaultGameQueues'),
    ])
  },
})
