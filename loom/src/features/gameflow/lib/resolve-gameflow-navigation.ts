import type {
  ConnectedGameflowRoute,
  GameflowNavigationResult,
  ResolveGameflowNavigationInput,
} from './resolve-gameflow-navigation-types'
import type { GameflowPhase } from '@/core/state/gameflow-store'

const CONNECTED_GAMEFLOW_ROUTES: readonly ConnectedGameflowRoute[] = ['/connected/lobby', '/connected/champ-select']

const CONNECTED_GAMEFLOW_ROUTE_SET = new Set<string>(CONNECTED_GAMEFLOW_ROUTES)

const GAMEFLOW_ROUTE_BY_PHASE = {
  ChampSelect: '/connected/champ-select',
  InProgress: '/connected/lobby',
  Lobby: '/connected/lobby',
  Matchmaking: '/connected/lobby',
  None: '/connected/lobby',
  ReadyCheck: null,
} satisfies Record<GameflowPhase, ConnectedGameflowRoute | null>

export function isGameflowPhase(value: string | null): value is GameflowPhase {
  return value !== null && value in GAMEFLOW_ROUTE_BY_PHASE
}

export function resolveGameflowNavigation({
  connectedRoutes = ['/connected/lobby', '/connected/champ-select'],
  nextPhase,
  pathname,
  previousPhase,
}: ResolveGameflowNavigationInput): GameflowNavigationResult {
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
