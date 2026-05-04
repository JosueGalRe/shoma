import { createFileRoute } from '@tanstack/react-router'

import { InvitesToast } from '@features/invites/components/invites-toast'

export const Route = createFileRoute('/connected/invites')({
  component: ConnectedInvitesRoute,
})

function ConnectedInvitesRoute() {
  return <InvitesToast />
}
