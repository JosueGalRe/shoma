import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { createLCUTransport } from '@/core/relay/lcu-transport';
import type { LcuTransport } from '@/core/relay/lcu-transport';
import { RelayClient, RelayClientState } from '@/core/relay/relay-client';
import type { RelayClientOptions } from '@/core/relay/relay-client';
import type { RelayClientState as RelayClientStateValue } from '@/core/relay/relay-client';
import { LcuHttpMethod } from '@shoma/protocol-contract';
import type { LCUEndpoints } from '@shoma/protocol-contract';
import type { LcuHttpMethodValue } from '@shoma/protocol-contract';
import type { LcuResult } from '@shoma/protocol-contract';
import type { LcuResponse } from '@shoma/protocol-contract';
import type { TypedLcuPaths } from '@shoma/protocol-contract';

type LcuHookState<TContent> = {
  data: TContent | null
  error: Error | null
  isLoading: boolean
}

type LcuContentParser<TContent> = (content: unknown) => TContent | null

type TypedLcuPath = (typeof TypedLcuPaths)[keyof typeof TypedLcuPaths]

export type UseRelayClientOptions = Omit<RelayClientOptions, 'onClose' | 'onData' | 'onOpen' | 'onStateChange'> & {
  enabled?: boolean
}

export type UseRelayClientResult = {
  client: RelayClient | null
  state: RelayClientStateValue
}

// @knip
export type LcuRequestState<TContent> = LcuHookState<TContent> & {
  refetch: () => void
  refetchWithBody: (nextBody: unknown) => Promise<LcuResult<TContent> | null>
}

function normalizeError(error: unknown, fallback: string): Error {
  return error instanceof Error ? error : new Error(fallback)
}

function createParseError(path: string): Error {
  return new Error(`LCU response for ${path} did not match the expected shape.`)
}

/* eslint-disable @typescript-eslint/no-redundant-type-constituents -- Conditional return: with parser returns TContent|null, without parser returns raw unknown content */
function parseResponseContent<TContent>(
  content: unknown,
  parse: LcuContentParser<TContent> | undefined,
): TContent | null | unknown {
  return parse ? parse(content) : content
}
/* eslint-enable @typescript-eslint/no-redundant-type-constituents */

export function useRelayClient(options: UseRelayClientOptions): UseRelayClientResult {
  const [state, setState] = useState<RelayClientStateValue>(RelayClientState.DISCONNECTED)
  const [client, setClient] = useState<RelayClient | null>(null)
  const clientRef = useRef<RelayClient | null>(null)

  // Keep a stable reference to the state setter so we can register it once.
  const setStateRef = useRef(setState)
  setStateRef.current = setState

  const { code, enabled } = options
  const optionsRef = useRef(options)
  optionsRef.current = options

  /* eslint-disable react-doctor/no-cascading-set-state -- Relay client state machine requires setting client + state atomically on connection lifecycle events */
  // External system sync: Relay client lifecycle (WebSocket connection)
  useEffect(() => {
    if (enabled === false || code.length === 0) {
      if (clientRef.current) {
        clientRef.current.close()
        clientRef.current = null
      }
      setClient(null)
      setState(RelayClientState.DISCONNECTED)
      return undefined
    }

    const client = new RelayClient({
      ...optionsRef.current,
      autoConnect: false,
      autoReconnect: false,
      onStateChange: (newState) => { return setStateRef.current(newState); },
    })
    clientRef.current = client
    setClient(client)
    client.connect()

    return () => {
      client.close()
      if (clientRef.current === client) {
        clientRef.current = null
        setClient(null)
      }
    }
  }, [code, enabled])

  return { client, state }
}

// @knip
export function useLCURequest(
  transport: LcuTransport | null,
  path: string,
  method?: LcuHttpMethodValue,
  body?: unknown,
): LcuRequestState<unknown>
export function useLCURequest<TContent>(
  transport: LcuTransport | null,
  path: string,
  method: LcuHttpMethodValue | undefined,
  body: unknown,
  parse: LcuContentParser<TContent>,
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
export function useLCURequest(
  transport: LcuTransport | null,
  path: string,
  method: LcuHttpMethodValue = LcuHttpMethod.GET,
  body?: unknown,
  parse?: LcuContentParser<unknown>,
): LcuRequestState<unknown> {
  const [state, setState] = useState<LcuHookState<unknown>>({ data: null, error: null, isLoading: Boolean(transport) })
  const [version, setVersion] = useState(0)
  const requestIdRef = useRef(0)

  const refetch = useCallback(() => {
    setVersion((current) => {return current + 1})
  }, [])

  const refetchWithBody = useCallback(
    async (nextBody: unknown) => {
      if (!transport) {
        return null
      }

      const requestId = requestIdRef.current + 1
      requestIdRef.current = requestId
      setState((current) => {return { ...current, error: null, isLoading: true }})

      try {
        const result = await transport.request(path, method, nextBody)
        const parsedContent = parseResponseContent(result.content, parse)
        if (parsedContent === null) {
          if (requestIdRef.current === requestId) {
            setState((current) => {return { ...current, error: createParseError(path), isLoading: false }})
          }
          return null
        }

        const parsedResult: LcuResult<unknown> = { ...result, content: parsedContent }
        if (requestIdRef.current === requestId) {
          setState({ data: parsedContent, error: null, isLoading: false })
        }
        return parsedResult
      } catch (error) {
        if (requestIdRef.current === requestId) {
          setState((current) => {return { ...current, error: normalizeError(error, 'LCU request failed.'), isLoading: false }})
        }
        return null
      }
    },
    [method, parse, path, transport],
  )

  /* eslint-disable react-doctor/no-cascading-set-state -- LCU request hook sets loading + data/error atomically on a single request lifecycle */
  // External system sync: LCU request lifecycle and reconnect listeners
  useEffect(() => {
    if (!transport) {
      setState({ data: null, error: null, isLoading: false })
      return undefined
    }

    let isActive = true
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setState((current) => {return { ...current, error: null, isLoading: true }})

    transport
      .request(path, method, body)
      .then((result) => {
        if (isActive && requestIdRef.current === requestId) {
          const parsedContent = parseResponseContent(result.content, parse)
          if (parsedContent === null) {
            setState((current) => {return { ...current, error: createParseError(path), isLoading: false }})
            return
          }

          setState({ data: parsedContent, error: null, isLoading: false })
        }
      })
      .catch((error: unknown) => {
        if (isActive && requestIdRef.current === requestId) {
          setState((current) => {return { ...current, error: normalizeError(error, 'LCU request failed.'), isLoading: false }})
        }
      })

    const unsubscribeReconnect = transport.onReconnect(refetch)
    const unsubscribeDisconnect = transport.onDisconnect(() => {
      if (isActive) {
        setState((current) => {return { ...current, isLoading: true }})
      }
    })

    return () => {
      isActive = false
      unsubscribeReconnect()
      unsubscribeDisconnect()
    }
  }, [body, method, parse, path, refetch, transport, version])

  return { ...state, refetch, refetchWithBody }
}

// @knip
export function useLCUObserver<TContent = unknown>(
  transport: LcuTransport | null,
  path: string,
): LcuHookState<LcuResult<TContent>> {
  const [state, setState] = useState<LcuHookState<LcuResult<TContent>>>({
    data: null,
    error: null,
    isLoading: Boolean(transport),
  })

  /* eslint-disable react-doctor/no-cascading-set-state -- LCU observer hook sets loading + data/error atomically on a single subscription lifecycle */
  // External system sync: LCU observer subscription lifecycle
  useEffect(() => {
    if (!transport) {
      setState({ data: null, error: null, isLoading: false })
      return undefined
    }

    let isActive = true
    let disposeObserver: (() => void) | null = null
    setState((current) => {return { ...current, error: null, isLoading: current.data === null }})

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
          setState((current) => {return { ...current, error: normalizeError(error, 'LCU observer failed.'), isLoading: false }})
        }
      })

    const unsubscribeDisconnect = transport.onDisconnect(() => {
      if (isActive) {
        setState((current) => {return { ...current, isLoading: true }})
      }
    })
    const unsubscribeReconnect = transport.onReconnect(() => {
      if (isActive) {
        setState((current) => {return { ...current, error: null, isLoading: current.data === null }})
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

// @knip
export function useLCUTransport(client: RelayClient | null): LcuTransport | null {
  return useMemo(() => {return (client ? createLCUTransport(client) : null)}, [client])
}
