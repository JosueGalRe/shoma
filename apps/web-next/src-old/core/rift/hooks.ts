import { useCallback, useEffect, useRef, useState } from 'react'

import { createLCUClient } from './lcu-transport'
import { createObserverRegistry, type ObserverRegistry } from './observer'

type LcuHookState<TContent> = {
  data: TContent | null
  error: Error | null
  isLoading: boolean
}

type LcuRequestState<TContent> = LcuHookState<TContent> & {
  refetch: () => void
}

let defaultRegistry: ObserverRegistry | null = null

function resolveDefaultRegistry(): ObserverRegistry {
  if (!defaultRegistry) {
    defaultRegistry = createObserverRegistry(createLCUClient({ connectOnCreate: false }))
  }

  return defaultRegistry
}

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error('LCU operation failed.')
}

export function useLCUObserver<TContent = unknown>(path: string): LcuHookState<TContent> {
  const [state, setState] = useState<LcuHookState<TContent>>({
    data: null,
    error: null,
    isLoading: true,
  })

  useEffect(() => {
    const registry = resolveDefaultRegistry()
    let isActive = true

    setState((current) => ({ ...current, error: null, isLoading: current.data === null }))

    const unsubscribeObserver = registry.subscribe<TContent>(path, (data) => {
      if (!isActive) {
        return
      }

      setState({ data, error: null, isLoading: false })
    })
    const unsubscribeDisconnect = registry.onDisconnect(() => {
      if (isActive) {
        setState((current) => ({ ...current, isLoading: true }))
      }
    })
    const unsubscribeReconnect = registry.onReconnect(() => {
      if (isActive) {
        setState((current) => ({ ...current, error: null, isLoading: current.data === null }))
      }
    })

    return () => {
      isActive = false
      unsubscribeObserver()
      unsubscribeDisconnect()
      unsubscribeReconnect()
    }
  }, [path])

  return state
}

export function useLCURequest<TContent = unknown>(path: string, method: string, body?: unknown): LcuRequestState<TContent> {
  const [state, setState] = useState<LcuHookState<TContent>>({
    data: null,
    error: null,
    isLoading: true,
  })
  const [requestVersion, setRequestVersion] = useState(0)
  const requestIdRef = useRef(0)

  const refetch = useCallback(() => {
    setRequestVersion((current) => current + 1)
  }, [])

  useEffect(() => {
    const registry = resolveDefaultRegistry()
    let isActive = true
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    setState((current) => ({ ...current, error: null, isLoading: true }))

    registry
      .request<TContent>(path, method, body)
      .then((result) => {
        if (!isActive || requestIdRef.current !== requestId) {
          return
        }

        setState({ data: result.content, error: null, isLoading: false })
      })
      .catch((error: unknown) => {
        if (!isActive || requestIdRef.current !== requestId) {
          return
        }

        setState((current) => ({ ...current, error: normalizeError(error), isLoading: false }))
      })

    const unsubscribeDisconnect = registry.onDisconnect(() => {
      if (isActive) {
        setState((current) => ({ ...current, isLoading: true }))
      }
    })
    const unsubscribeReconnect = registry.onReconnect(() => {
      if (isActive) {
        refetch()
      }
    })

    return () => {
      isActive = false
      unsubscribeDisconnect()
      unsubscribeReconnect()
    }
  }, [body, method, path, refetch, requestVersion])

  return {
    ...state,
    refetch,
  }
}
