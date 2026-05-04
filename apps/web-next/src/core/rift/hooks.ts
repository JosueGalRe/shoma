import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { LcuHttpMethod, type LCUEndpoints, type LcuHttpMethodValue, type LcuResult, type LcuResponse, type TypedLcuPaths } from '@mimic/protocol-contract'

import { createLCUTransport, type LcuTransport } from '@/core/rift/lcu-transport'
import { RiftClient, RiftClientState, type RiftClientOptions, type RiftClientState as RiftClientStateValue } from '@/core/rift/rift-client'

type LcuHookState<TContent> = {
  data: TContent | null
  error: Error | null
  isLoading: boolean
}

type TypedLcuPath = (typeof TypedLcuPaths)[keyof typeof TypedLcuPaths]

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
  const clientRef = useRef<RiftClient | null>(null)

  // Keep a stable reference to the state setter so we can register it once.
  const setStateRef = useRef(setState)
  useEffect(() => {
    setStateRef.current = setState
  })

  useEffect(() => {
    if (options.enabled === false || options.code.length === 0) {
      if (clientRef.current) {
        clientRef.current.close()
        clientRef.current = null
      }
      setState(RiftClientState.DISCONNECTED)
      return undefined
    }

    const client = new RiftClient({
      ...options,
      autoConnect: false,
      onStateChange: (newState) => setStateRef.current(newState),
    })
    clientRef.current = client
    client.connect()

    return () => {
      client.close()
      clientRef.current = null
    }
  }, [options.code, options.enabled, options.wsBaseUrl])

  return { client: clientRef.current, state }
}

export function useLCURequest<TContent = unknown>(
  transport: LcuTransport | null,
  path: string,
  method?: LcuHttpMethodValue,
  body?: unknown,
): LcuRequestState<TContent>
export function useLCURequest<TPath extends TypedLcuPath>(
  transport: LcuTransport | null,
  path: TPath,
): LcuRequestState<LcuResponse<TPath, Extract<'get', keyof LCUEndpoints[TPath]>>>
export function useLCURequest<TPath extends TypedLcuPath, TMethod extends LcuHttpMethodValue>(
  transport: LcuTransport | null,
  path: TPath,
  method: TMethod,
  body?: unknown,
): LcuRequestState<LcuResponse<TPath, Extract<Lowercase<TMethod>, keyof LCUEndpoints[TPath]>>>
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
        const result = (await transport.request(path, method, nextBody)) as LcuResult<TContent>
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
      .request(path, method, body)
      .then((result) => {
        if (isActive && requestIdRef.current === requestId) {
          setState({ data: result.content as TContent, error: null, isLoading: false })
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
