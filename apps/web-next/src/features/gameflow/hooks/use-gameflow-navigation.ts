import { useEffect, useRef, useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { useNavigate, useRouterState } from '@tanstack/react-router'

import { createLcuQueryOptions, gameflowPhaseDescriptor } from '@/core/lcu/lcu-queries'
import { useLcuObserverSync } from '@/core/lcu/lcu-observer-sync'
import { useSharedLCUTransport } from '@/core/rift/rift-client-provider'
import { type GameflowPhase } from '@/core/state/gameflow-store'
import type { FileRoutesByTo } from '@/routeTree.gen'

import { isGameflowPhase, resolveGameflowNavigation } from '../lib/resolve-gameflow-navigation'

type ConnectedRoutePath = Extract<keyof FileRoutesByTo, '/connected'>
type ConnectedGameflowRoute = Extract<keyof FileRoutesByTo, '/connected/lobby' | '/connected/queue' | '/connected/champ-select'>

type GameflowNavigationState = {
  phase: GameflowPhase | null
  isTransitioning: boolean
  transitionTarget: ConnectedGameflowRoute | null
}

export function useGameflowNavigation(from: ConnectedRoutePath): GameflowNavigationState {
  const transport = useSharedLCUTransport()
  const navigate = useNavigate({ from })
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const previousPhase = useRef<GameflowPhase | null>(null)
  const [transition, setTransition] = useState<{ targetRoute: ConnectedGameflowRoute; id: number } | null>(null)
  const transitionIdRef = useRef(0)

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
      const id = ++transitionIdRef.current
      setTransition({ targetRoute: navigation.targetRoute, id })

      void navigate({ replace: true, to: navigation.targetRoute })
    }
  }, [navigate, nextPhase, pathname])

  useEffect(() => {
    if (transition && transition.targetRoute === pathname) {
      const timer = setTimeout(() => {
        setTransition(null)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [pathname, transition])

  return {
    phase: isGameflowPhase(nextPhase) ? nextPhase : null,
    isTransitioning: transition !== null,
    transitionTarget: transition?.targetRoute ?? null,
  }
}
