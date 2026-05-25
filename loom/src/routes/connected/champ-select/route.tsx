import { createFileRoute } from '@tanstack/react-router'

import { ChampSelectRouteComponent } from './-route-component'

export const Route = createFileRoute('/connected/champ-select')({
  component: ChampSelectRouteComponent,
})
