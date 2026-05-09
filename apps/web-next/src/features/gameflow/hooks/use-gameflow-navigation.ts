import { useEffect, useRef } from 'react'

import { useQuery } from '@tanstack/react-query'
import { useNavigate, useRouterState } from '@tanstack/react-router'

import { createLcuQueryOptions, gameflowPhaseDescriptor } from '@/core/lcu/lcu-queries'
import { useLcuObserverSync } from '@/core/lcu/lcu-observer-sync'
import { useSharedLCUTransport } from '@/core/rift/rift-client-provider'
import { gameflowPhases, type GameflowPhase } from '@/core/state/gameflow-store'
import type { FileRoutesByTo } from '@/routeTree.gen'

type ConnectedRoutePath = Extract<keyof FileRoutesByTo, '/connected'>
type ConnectedGameflowRoute = Extract<keyof FileRoutesByTo, '/connected/lobby' | '/connected/queue' | '/connected/champ-select'>

const GAMEFLOW_ROUTE_BY_PHASE = {
  ChampSelect: '/connected/champ-select',
  InProgress: '/connected/lobby',
  Lobby: '/connected/lobby',
  Matchmaking: '/connected/queue',
  None: '/connected/lobby',
  ReadyCheck: null,
} satisfies Record<GameflowPhase, ConnectedGameflowRoute | null>

function isGameflowPhase(value: string | null): value is GameflowPhase {
  return value !== null && gameflowPhases.includes(value as GameflowPhase)
}

export function useGameflowNavigation(from: ConnectedRoutePath): GameflowPhase | null {
  const transport = useSharedLCUTransport()
  const navigate = useNavigate({ from })
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const previousPhase = useRef<GameflowPhase | null>(null)

  const gameflowQuery = useQuery(createLcuQueryOptions(gameflowPhaseDescriptor, transport))
  useLcuObserverSync(gameflowPhaseDescriptor, transport)

  const nextPhase = gameflowQuery.data ?? null

  useEffect(() => {
    if (!isGameflowPhase(nextPhase)) {
      return
    }

    if (previousPhase.current === nextPhase) {
      return
    }

    previousPhase.current = nextPhase

    if (pathname !== from && !pathname.startsWith(from + '/')) {
      return
    }

    const targetRoute = GAMEFLOW_ROUTE_BY_PHASE[nextPhase]

    if (!targetRoute || pathname === targetRoute) {
      return
    }

    void navigate({ replace: true, to: targetRoute })
  }, [from, navigate, nextPhase, pathname])

  return isGameflowPhase(nextPhase) ? nextPhase : null
}
