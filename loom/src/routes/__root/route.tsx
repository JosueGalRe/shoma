import { createRootRouteWithContext } from '@tanstack/react-router'

import { RootRouteComponent } from './-route-component'

import type { QueryClient } from '@tanstack/react-query'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  component: RootRouteComponent,
})
