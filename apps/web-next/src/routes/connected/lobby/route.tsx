import { createFileRoute } from '@tanstack/react-router'

function LobbyRouteComponent() {
  return <div>Hello Mimic</div>
}

export const Route = createFileRoute('/connected/lobby')({
  component: LobbyRouteComponent,
})
