import { createFileRoute } from '@tanstack/react-router'

import { InvitesRouteComponent } from './-route-component'

export const Route = createFileRoute('/connected/invites')({
  component: InvitesRouteComponent,
})
