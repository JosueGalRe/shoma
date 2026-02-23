import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef } from 'react'

import { createLcuQueryFactory, mapInfoQuery, queueInfoQuery } from '../../../core/query/query-options'
import { RiftClientState } from '../../../core/rift/rift-client-types'
import { RiftLcuTransport } from '../../../core/rift/rift-lcu-transport'

type UseRiftLcuRuntimeOptions = {
  client: { send: (payload: string) => Promise<void> } | null
  status: RiftClientState | null
  setPeer: (version: string | null, name: string | null) => void
  appendLog: (line: string) => void
}

export function useRiftLcuRuntime({ client, status, setPeer, appendLog }: UseRiftLcuRuntimeOptions) {
  const queryClient = useQueryClient()
  const clientRef = useRef<null | { send: (payload: string) => Promise<void> }>(null)
  const statusRef = useRef<RiftClientState | null>(null)

  useEffect(() => {
    clientRef.current = client
  }, [client])

  useEffect(() => {
    statusRef.current = status
  }, [status])

  const lcuTransport = useMemo(
    () =>
      new RiftLcuTransport({
        async send(payload) {
          const activeClient = clientRef.current
          if (!activeClient) {
            throw new Error('No active connection.')
          }

          await activeClient.send(payload)
        },
        isConnected() {
          return Boolean(clientRef.current) && statusRef.current === RiftClientState.CONNECTED
        },
        onPeer(version, name) {
          setPeer(version, name)
        },
        onQueuePathUpdate(queueId) {
          void queryClient.invalidateQueries({ queryKey: queueInfoQuery.queryKey(queueId) })
        },
        onMapPathUpdate(mapId) {
          void queryClient.invalidateQueries({ queryKey: mapInfoQuery.queryKey(mapId) })
        },
        onObserverError(matcher) {
          appendLog(`observer error: ${matcher}`)
        },
      }),
    [appendLog, queryClient, setPeer],
  )

  const lcuQueries = useMemo(
    () =>
      createLcuQueryFactory((path, method = 'GET', body) => {
        return lcuTransport.request(path, method, body)
      }),
    [lcuTransport],
  )

  async function getQueueDescription(queueId: number): Promise<string | null> {
    const queueInfo = await queryClient.ensureQueryData(lcuQueries.queueInfo.options(queueId))

    return queueInfo
  }

  async function getMapName(mapId: number): Promise<string | null> {
    const mapInfo = await queryClient.ensureQueryData(lcuQueries.mapInfo.options(mapId))

    return mapInfo
  }

  return {
    getMapName,
    getQueueDescription,
    lcuTransport,
  }
}
