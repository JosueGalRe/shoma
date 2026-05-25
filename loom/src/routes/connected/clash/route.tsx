import { createFileRoute } from '@tanstack/react-router'

import { ClashRouteComponent } from './-route-component'

export const Route = createFileRoute('/connected/clash')({
  component: ClashRouteComponent,
})
