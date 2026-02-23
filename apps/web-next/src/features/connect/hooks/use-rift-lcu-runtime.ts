import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef } from 'react'

import { createLcuQueryFactory } from '../../../core/query/query-options'
import { RiftClientState } from '../../../core/rift/rift-client-types'
import { createRiftLcuTransport, readLcuConnectionState } from './use-rift-lcu-runtime-utils'

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
      createRiftLcuTransport({
        appendLog,
        getClient() {
          return clientRef.current
        },
        isConnected() {
          return readLcuConnectionState({
            clientRef,
            connectedState: RiftClientState.CONNECTED,
            statusRef,
          })
        },
        queryClient,
        setPeer,
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
