import type { QueryClient } from '@tanstack/react-query'

import { mapInfoQuery, queueInfoQuery } from '../../../core/query/query-options'
import type { RiftClientState } from '../../../core/rift/rift-client-types'
import { RiftLcuTransport } from '../../../core/rift/rift-lcu-transport'

type RiftClientSender = {
  send: (payload: string) => Promise<void>
}

type CreateRiftLcuTransportOptions = {
  getClient: () => RiftClientSender | null
  isConnected: () => boolean
  queryClient: QueryClient
  setPeer: (version: string | null, name: string | null) => void
  appendLog: (line: string) => void
}

type ReadLcuConnectionStateOptions = {
  clientRef: { current: RiftClientSender | null }
  statusRef: { current: RiftClientState | null }
  connectedState: RiftClientState
}

export function readLcuConnectionState({ clientRef, statusRef, connectedState }: ReadLcuConnectionStateOptions): boolean {
  return Boolean(clientRef.current) && statusRef.current === connectedState
}

export function invalidateQueueInfo(queryClient: QueryClient, queueId: number): void {
  void queryClient.invalidateQueries({ queryKey: queueInfoQuery.queryKey(queueId) })
}

export function invalidateMapInfo(queryClient: QueryClient, mapId: number): void {
  void queryClient.invalidateQueries({ queryKey: mapInfoQuery.queryKey(mapId) })
}

export function createRiftLcuTransport({
  getClient,
  isConnected,
  queryClient,
  setPeer,
  appendLog,
}: CreateRiftLcuTransportOptions) {
  return new RiftLcuTransport({
    async send(payload) {
      const activeClient = getClient()
      if (!activeClient) {
        throw new Error('No active connection.')
      }

      await activeClient.send(payload)
    },
    isConnected,
    onPeer(version, name) {
      setPeer(version, name)
    },
    onQueuePathUpdate(queueId) {
      invalidateQueueInfo(queryClient, queueId)
    },
    onMapPathUpdate(mapId) {
      invalidateMapInfo(queryClient, mapId)
    },
    onObserverError(matcher) {
      appendLog(`observer error: ${matcher}`)
    },
  })
}
