import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { LcuHttpMethod, type LcuHttpMethodValue, type LcuResult } from '@mimic/protocol-contract'

import { createLCUTransport, type LcuTransport } from '@/core/rift/lcu-transport'
import { RiftClient, RiftClientState, type RiftClientOptions, type RiftClientState as RiftClientStateValue } from '@/core/rift/rift-client'

type LcuHookState<TContent> = {
  data: TContent | null
  error: Error | null
  isLoading: boolean
}

export type UseRiftClientOptions = Omit<RiftClientOptions, 'onClose' | 'onData' | 'onOpen' | 'onStateChange'> & {
  enabled?: boolean
}

export type UseRiftClientResult = {
  client: RiftClient | null
  state: RiftClientStateValue
}

export type LcuRequestState<TContent> = LcuHookState<TContent> & {
  refetch: () => void
  refetchWithBody: (nextBody: unknown) => Promise<LcuResult<TContent> | null>
}

function normalizeError(error: unknown, fallback: string): Error {
  return error instanceof Error ? error : new Error(fallback)
}

export function useRiftClient(options: UseRiftClientOptions): UseRiftClientResult {
  const [state, setState] = useState<RiftClientStateValue>(RiftClientState.DISCONNECTED)
  const client = useMemo(() => {
    if (options.enabled === false || options.code.length === 0) {
      return null
    }

    return new RiftClient({ ...options, onStateChange: setState })
  }, [options])

  useEffect(() => {
    if (!client) {
      setState(RiftClientState.DISCONNECTED)
      return undefined
    }

    setState(client.state)
    return () => client.close()
  }, [client])

  return { client, state }
}

export function useLCURequest<TContent = unknown>(
  transport: LcuTransport | null,
  path: string,
  method: LcuHttpMethodValue = LcuHttpMethod.GET,
  body?: unknown,
): LcuRequestState<TContent> {
  const [state, setState] = useState<LcuHookState<TContent>>({ data: null, error: null, isLoading: Boolean(transport) })
  const [version, setVersion] = useState(0)
  const requestIdRef = useRef(0)

  const refetch = useCallback(() => {
    setVersion((current) => current + 1)
  }, [])

  const refetchWithBody = useCallback(
    async (nextBody: unknown) => {
      if (!transport) {
        return null
      }

      const requestId = requestIdRef.current + 1
      requestIdRef.current = requestId
      setState((current) => ({ ...current, error: null, isLoading: true }))

      try {
        const result = await transport.request<TContent>(path, method, nextBody)
        if (requestIdRef.current === requestId) {
          setState({ data: result.content, error: null, isLoading: false })
        }
        return result
      } catch (error) {
        if (requestIdRef.current === requestId) {
          setState((current) => ({ ...current, error: normalizeError(error, 'LCU request failed.'), isLoading: false }))
        }
        return null
      }
    },
    [method, path, transport],
  )

  useEffect(() => {
    if (!transport) {
      setState({ data: null, error: null, isLoading: false })
      return undefined
    }

    let isActive = true
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setState((current) => ({ ...current, error: null, isLoading: true }))

    transport
      .request<TContent>(path, method, body)
      .then((result) => {
        if (isActive && requestIdRef.current === requestId) {
          setState({ data: result.content, error: null, isLoading: false })
        }
      })
      .catch((error: unknown) => {
        if (isActive && requestIdRef.current === requestId) {
          setState((current) => ({ ...current, error: normalizeError(error, 'LCU request failed.'), isLoading: false }))
        }
      })

    const unsubscribeReconnect = transport.onReconnect(refetch)
    const unsubscribeDisconnect = transport.onDisconnect(() => {
      if (isActive) {
        setState((current) => ({ ...current, isLoading: true }))
      }
    })

    return () => {
      isActive = false
      unsubscribeReconnect()
      unsubscribeDisconnect()
    }
  }, [body, method, path, refetch, transport, version])

  return { ...state, refetch, refetchWithBody }
}

export function useLCUObserver<TContent = unknown>(transport: LcuTransport | null, path: string): LcuHookState<LcuResult<TContent>> {
  const [state, setState] = useState<LcuHookState<LcuResult<TContent>>>({ data: null, error: null, isLoading: Boolean(transport) })

  useEffect(() => {
    if (!transport) {
      setState({ data: null, error: null, isLoading: false })
      return undefined
    }

    let isActive = true
    let disposeObserver: (() => void) | null = null
    setState((current) => ({ ...current, error: null, isLoading: current.data === null }))

    transport
      .observe<TContent>(path, (result) => {
        if (isActive) {
          setState({ data: result, error: null, isLoading: false })
        }
      })
      .then((unsubscribe) => {
        disposeObserver = unsubscribe
      })
      .catch((error: unknown) => {
        if (isActive) {
          setState((current) => ({ ...current, error: normalizeError(error, 'LCU observer failed.'), isLoading: false }))
        }
      })

    const unsubscribeDisconnect = transport.onDisconnect(() => {
      if (isActive) {
        setState((current) => ({ ...current, isLoading: true }))
      }
    })
    const unsubscribeReconnect = transport.onReconnect(() => {
      if (isActive) {
        setState((current) => ({ ...current, error: null, isLoading: current.data === null }))
      }
    })

    return () => {
      isActive = false
      disposeObserver?.()
      unsubscribeDisconnect()
      unsubscribeReconnect()
    }
  }, [path, transport])

  return state
}

export function useLCUTransport(client: RiftClient | null): LcuTransport | null {
  return useMemo(() => (client ? createLCUTransport(client) : null), [client])
}
