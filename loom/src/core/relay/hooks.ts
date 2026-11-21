import { useEffect, useRef, useState } from 'react'

import {
  RelayClient,
  type RelayClientOptions,
  RelayClientState,
  type RelayClientState as RelayClientStateValue,
} from '@/core/relay/relay-client'

export type UseRelayClientOptions = Omit<RelayClientOptions, 'onClose' | 'onData' | 'onOpen' | 'onStateChange'> & {
  enabled?: boolean
}

export interface UseRelayClientResult {
  client: RelayClient | null
  state: RelayClientStateValue
}

export function useRelayClient(options: UseRelayClientOptions): UseRelayClientResult {
  const [state, setState] = useState<RelayClientStateValue>(RelayClientState.DISCONNECTED)
  const [client, setClient] = useState<RelayClient | null>(null)
  const clientRef = useRef<RelayClient | null>(null)

  const { code, enabled } = options
  const isEnabled = enabled !== false && code.length > 0
  const optionsRef = useRef(options)

  useEffect(() => {
    optionsRef.current = options
  })

  // External system sync: Relay client lifecycle (WebSocket connection). Disabling closes the last client in its
  // Cleanup, and the render reads as disconnected meanwhile
  useEffect(() => {
    if (!isEnabled) {
      return undefined
    }

    const relayClient = new RelayClient({
      ...optionsRef.current,
      autoConnect: false,
      autoReconnect: true,
      code,
      onStateChange: setState,
    })

    clientRef.current = relayClient
    setClient(relayClient)
    relayClient.connect()

    return () => {
      relayClient.close()

      if (clientRef.current === relayClient) {
        clientRef.current = null
        setClient(null)
      }
    }
  }, [code, isEnabled])

  return isEnabled ? { client, state } : { client: null, state: RelayClientState.DISCONNECTED }
}
