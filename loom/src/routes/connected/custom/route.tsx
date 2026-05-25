import { createFileRoute } from '@tanstack/react-router'

import { CustomRouteComponent } from './-route-component'

export const Route = createFileRoute('/connected/custom')({
  component: CustomRouteComponent,
})
