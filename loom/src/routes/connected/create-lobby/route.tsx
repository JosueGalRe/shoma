import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { gameQueuesDescriptor, lobbySessionDescriptor, platformConfigDescriptor } from '@/core/lcu/lcu-queries'
import { ensureLcuRouteData } from '@/core/relay/route-loader'
import { LobbyCreationContent } from '@/features/lobby/components/lobby-creation-content'

function CreateLobbyRouteComponent() {
  const navigate = useNavigate({ from: Route.fullPath })
  return (
    <LobbyCreationContent
      showBackToLobby
      onBackToLobby={() => void navigate({ to: '/connected/lobby' })}
      onCreated={() => void navigate({ to: '/connected/lobby' })}
    />
  )
}

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
