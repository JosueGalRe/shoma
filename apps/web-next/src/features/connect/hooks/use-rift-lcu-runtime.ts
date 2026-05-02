import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef } from 'react'

import { createLcuQueryFactory } from '../../../core/query/query-options'
import { createLcuClient } from '../../../core/rift/lcu-client'
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

  const appendLogRef = useRef(appendLog)
  useEffect(() => {
    appendLogRef.current = appendLog
  }, [appendLog])

  const lcuTransport = useMemo(
    () =>
      createRiftLcuTransport({
        appendLog(line) {
          appendLogRef.current(line)
        },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, setPeer],
  )

  const lcuClient = useMemo(() => {
    return createLcuClient(lcuTransport)
  }, [lcuTransport])

  const lcuQueries = useMemo(() => {
    return createLcuQueryFactory(lcuClient)
  }, [lcuClient])

  const getQueueDescription = useCallback(async (queueId: number): Promise<string | null> => {
    const queueInfo = await queryClient.ensureQueryData(lcuQueries.queueInfo.options(queueId))

    return queueInfo
  }, [lcuQueries.queueInfo, queryClient])

  const getMapName = useCallback(async (mapId: number): Promise<string | null> => {
    const mapInfo = await queryClient.ensureQueryData(lcuQueries.mapInfo.options(mapId))

    return mapInfo
  }, [lcuQueries.mapInfo, queryClient])

  return {
    getMapName,
    getQueueDescription,
    lcuClient,
    lcuTransport,
  }
}
