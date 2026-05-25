import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useSyncExternalStore } from 'react'
import { useRouterState } from '@tanstack/react-router'

import { useLcuObserverSync } from '@/core/lcu/lcu-observer-sync'
import { createLcuQueryOptions, gameflowPhaseDescriptor } from '@/core/lcu/lcu-queries'
import { useSharedLCUTransport } from '@/core/relay/relay-client-provider'
import type { GameflowPhase } from '@/core/state/gameflow-store'

import { isGameflowPhase, resolveGameflowNavigation } from '../lib/resolve-gameflow-navigation'
import type { ConnectedGameflowRoute } from './use-gameflow-navigation-types'
import type { GameflowNavigationState } from './use-gameflow-navigation-types'

const TRANSITION_DURATION_MS = 300
const TRANSITION_TICK_MS = 50

let currentTimestamp = Date.now()
const timestampSubscribers = new Set<() => void>()
let timestampInterval: ReturnType<typeof setInterval> | null = null

function subscribeToTimestampUpdates(onStoreChange: () => void): () => void {
  timestampSubscribers.add(onStoreChange)

  if (timestampInterval === null) {
    timestampInterval = setInterval(() => {
      currentTimestamp = Date.now()
      timestampSubscribers.forEach((listener) => {
        listener()
      })
    }, TRANSITION_TICK_MS)
  }

  return () => {
    timestampSubscribers.delete(onStoreChange)

    if (timestampSubscribers.size === 0 && timestampInterval !== null) {
      clearInterval(timestampInterval)
      timestampInterval = null
    }
  }
}

function getCurrentTimestamp(): number {
  return currentTimestamp
}

export function useGameflowNavigation(): GameflowNavigationState {
  const transport = useSharedLCUTransport()
  const pathname = useRouterState({
    select: (state) => {
      return state.location.pathname
    },
  })
  const previousPhase = useRef<GameflowPhase | null>(null)
  const transitionTargetRef = useRef<ConnectedGameflowRoute | null>(null)
  const transitionStartedAtRef = useRef<number | null>(null)
  const now = useSyncExternalStore(subscribeToTimestampUpdates, getCurrentTimestamp, getCurrentTimestamp)

  const gameflowQuery = useQuery(createLcuQueryOptions(gameflowPhaseDescriptor, transport))
  useLcuObserverSync(gameflowPhaseDescriptor, transport)

  const nextPhase = gameflowQuery.data ?? null
  const navigation = resolveGameflowNavigation({
    nextPhase,
    pathname,
    previousPhase: previousPhase.current,
  })

  if (isGameflowPhase(nextPhase) && previousPhase.current !== nextPhase) {
    previousPhase.current = nextPhase
  }

  if (navigation.shouldNavigate && navigation.targetRoute && transitionTargetRef.current !== navigation.targetRoute) {
    transitionTargetRef.current = navigation.targetRoute
    transitionStartedAtRef.current = Date.now()
  }

  const transitionTarget =
    transitionTargetRef.current !== null &&
    transitionStartedAtRef.current !== null &&
    now - transitionStartedAtRef.current < TRANSITION_DURATION_MS
      ? transitionTargetRef.current
      : null

  useEffect(() => {
    if (transitionTarget === null || transitionTarget !== pathname) {
      return undefined
    }

    /* eslint-disable react-doctor/no-adjust-state-on-prop-change -- Timer cleanup for transition UI */
    const timer = setTimeout(() => {
      transitionTargetRef.current = null
      transitionStartedAtRef.current = null
    }, 300)

    return () => {
      return clearTimeout(timer)
    }
  }, [pathname, transitionTarget])

  const isTransitioning = transitionTarget !== null

  return {
    phase: isGameflowPhase(nextPhase) ? nextPhase : null,
    isTransitioning,
    transitionTarget,
  }
}
