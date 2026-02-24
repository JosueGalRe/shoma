import { Outlet, createRootRoute } from '@tanstack/react-router'

import { readRootRouteLayout } from './-root-utils'

export const Route = createRootRoute({
  component: RootRouteComponent,
})

function RootRouteComponent() {
  if (readRootRouteLayout() === 'outlet-only') {
    return <Outlet />
  }

  return <Outlet />
}
