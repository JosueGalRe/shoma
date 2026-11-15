import type { FileRoutesByTo } from '@/routeTree.gen'

export type ConnectedGameflowRoute = Extract<keyof FileRoutesByTo, '/connected/lobby' | '/connected/champ-select'>

export interface GameflowNavigationResult {
  shouldNavigate: boolean
  targetRoute: ConnectedGameflowRoute | null
}

export interface ResolveGameflowNavigationInput {
  nextPhase: string | null
  pathname: string
  previousPhase: string | null
  connectedRoutes?: readonly string[]
  // The champ select session's skipChampionSelect (Swift Play): the client goes straight to the game
  skipsChampSelect?: boolean
}
