import { createFileRoute } from '@tanstack/react-router'

import { ConnectedIndexRouteComponent } from './-route-component'

export const Route = createFileRoute('/connected/')({
  component: ConnectedIndexRouteComponent,
})
