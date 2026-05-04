import { createFileRoute } from '@tanstack/react-router'

function InvitesRouteComponent() {
  return <div>Hello Mimic</div>
}

export const Route = createFileRoute('/connected/invites')({
  component: InvitesRouteComponent,
})
