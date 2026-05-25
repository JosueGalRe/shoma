import { useNavigate } from '@tanstack/react-router'

import { LobbyCreationContent } from '@/features/lobby/components/lobby-creation-content'

export function CreateLobbyRouteComponent() {
  const navigate = useNavigate({ from: '/connected/create-lobby' })

  return (
    <LobbyCreationContent
      showBackToLobby
      onBackToLobby={() => {
        return void navigate({ to: '/connected/lobby' })
      }}
      onCreated={() => {
        return void navigate({ to: '/connected/lobby' })
      }}
    />
  )
}
