import { createFileRoute } from '@tanstack/react-router'

import { ConnectedRouteComponent } from './-route-component'

export const Route = createFileRoute('/connected')({
  component: ConnectedRouteComponent,
})
