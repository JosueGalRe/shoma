import type { GameflowPhase } from '@/core/state/gameflow-store'
import type { FileRoutesByTo } from '@/routeTree.gen'

export type ConnectedRoutePath = Extract<keyof FileRoutesByTo, '/connected'>
export type ConnectedGameflowRoute = Extract<
  keyof FileRoutesByTo,
  '/connected/lobby' | '/connected/queue' | '/connected/champ-select'
>

export type GameflowNavigationState = {
  phase: GameflowPhase | null
  isTransitioning: boolean
  transitionTarget: ConnectedGameflowRoute | null
}
