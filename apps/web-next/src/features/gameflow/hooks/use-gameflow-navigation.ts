import { useEffect, useRef } from 'react'

import { useQuery } from '@tanstack/react-query'
import { useNavigate, useRouterState } from '@tanstack/react-router'

import { createLcuQueryOptions, gameflowPhaseDescriptor } from '@/core/lcu/lcu-queries'
import { useLcuObserverSync } from '@/core/lcu/lcu-observer-sync'
import { useSharedLCUTransport } from '@/core/rift/rift-client-provider'
import { type GameflowPhase } from '@/core/state/gameflow-store'
import type { FileRoutesByTo } from '@/routeTree.gen'

import { isGameflowPhase, resolveGameflowNavigation } from '../lib/resolve-gameflow-navigation'

type ConnectedRoutePath = Extract<keyof FileRoutesByTo, '/connected'>

export function useGameflowNavigation(from: ConnectedRoutePath): GameflowPhase | null {
  const transport = useSharedLCUTransport()
  const navigate = useNavigate({ from })
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const previousPhase = useRef<GameflowPhase | null>(null)

  const gameflowQuery = useQuery(createLcuQueryOptions(gameflowPhaseDescriptor, transport))
  useLcuObserverSync(gameflowPhaseDescriptor, transport)

  const nextPhase = gameflowQuery.data ?? null

  useEffect(() => {
    const navigation = resolveGameflowNavigation({
      nextPhase,
      pathname,
      previousPhase: previousPhase.current,
    })

    if (isGameflowPhase(nextPhase) && previousPhase.current !== nextPhase) {
      previousPhase.current = nextPhase
    }

    if (navigation.shouldNavigate && navigation.targetRoute) {
      void navigate({ replace: true, to: navigation.targetRoute })
    }
  }, [navigate, nextPhase, pathname])

  return isGameflowPhase(nextPhase) ? nextPhase : null
}
