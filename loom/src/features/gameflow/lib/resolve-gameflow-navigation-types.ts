import type { FileRoutesByTo } from '@/routeTree.gen'

export type ConnectedGameflowRoute = Extract<keyof FileRoutesByTo, '/connected/lobby' | '/connected/champ-select'>

export type GameflowNavigationResult = { shouldNavigate: boolean; targetRoute: ConnectedGameflowRoute | null }

export type ResolveGameflowNavigationInput = {
  nextPhase: string | null
  pathname: string
  previousPhase: string | null
  connectedRoutes?: readonly string[]
}
