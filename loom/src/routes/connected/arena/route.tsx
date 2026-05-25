import { createFileRoute } from '@tanstack/react-router'

import { ArenaRouteComponent } from './-route-component'

export const Route = createFileRoute('/connected/arena')({
  component: ArenaRouteComponent,
})
