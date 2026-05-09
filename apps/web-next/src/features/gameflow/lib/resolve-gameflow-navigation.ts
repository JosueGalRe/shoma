import { gameflowPhases, type GameflowPhase } from '@/core/state/gameflow-store'
import type { FileRoutesByTo } from '@/routeTree.gen'

type ConnectedRoutePath = Extract<keyof FileRoutesByTo, '/connected'>
type ConnectedGameflowRoute = Extract<keyof FileRoutesByTo, '/connected/lobby' | '/connected/queue' | '/connected/champ-select'>

type GameflowNavigationResult = { shouldNavigate: boolean; targetRoute: ConnectedGameflowRoute | null }

const CONNECTED_GAMEFLOW_ROUTES = [
  '/connected/lobby',
  '/connected/queue',
  '/connected/champ-select',
  '/connected/ready-check',
] as const

const CONNECTED_GAMEFLOW_ROUTE_SET = new Set<string>(CONNECTED_GAMEFLOW_ROUTES)

const GAMEFLOW_ROUTE_BY_PHASE = {
  ChampSelect: '/connected/champ-select',
  InProgress: '/connected/lobby',
  Lobby: '/connected/lobby',
  Matchmaking: '/connected/queue',
  None: '/connected/lobby',
  ReadyCheck: null,
} satisfies Record<GameflowPhase, ConnectedGameflowRoute | null>

export function getGameflowRouteForPhase(phase: GameflowPhase): ConnectedGameflowRoute | null {
  return GAMEFLOW_ROUTE_BY_PHASE[phase]
}

export function isGameflowPhase(value: string | null): value is GameflowPhase {
  return value !== null && gameflowPhases.includes(value as GameflowPhase)
}

export function resolveGameflowNavigation({
  connectedRoutes = ['/connected/lobby', '/connected/queue', '/connected/champ-select'],
  nextPhase,
  pathname,
  previousPhase,
}: {
  nextPhase: string | null
  pathname: string
  previousPhase: string | null
  connectedRoutes?: string[]
}): GameflowNavigationResult {
  if (!isGameflowPhase(nextPhase) || previousPhase === nextPhase) {
    return { shouldNavigate: false, targetRoute: null }
  }

  const canNavigateFromRoute = connectedRoutes.includes(pathname) || CONNECTED_GAMEFLOW_ROUTE_SET.has(pathname)

  if (!canNavigateFromRoute) {
    return { shouldNavigate: false, targetRoute: null }
  }

  const targetRoute = GAMEFLOW_ROUTE_BY_PHASE[nextPhase]

  if (!targetRoute || targetRoute === pathname) {
    return { shouldNavigate: false, targetRoute: null }
  }

  return { shouldNavigate: true, targetRoute }
}
