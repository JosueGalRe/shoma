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
  const optionsRef = useRef(options)

  useEffect(() => {
    optionsRef.current = options
  })

  /* eslint-disable react-doctor/no-adjust-state-on-prop-change, react-doctor/no-cascading-set-state -- Relay client state machine requires setting client + state atomically on connection lifecycle events */
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

    const relayClient = new RelayClient({
      ...optionsRef.current,
      autoConnect: false,
      autoReconnect: false,
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
  }, [code, enabled])

  return { client, state }
}
