import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef } from 'react'

import { createLcuQueryFactory } from '../../../core/query/query-options'
import { createLcuClient } from '../../../core/rift/lcu-client'
import type { RiftLcuTransport } from '../../../core/rift/rift-lcu-transport'
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
  const queryClientRef = useRef(queryClient)
  const setPeerRef = useRef(setPeer)
  const appendLogRef = useRef(appendLog)
  const lcuTransportRef = useRef<RiftLcuTransport | null>(null)

  useEffect(() => {
    clientRef.current = client
  }, [client])

  useEffect(() => {
    statusRef.current = status
  }, [status])

  useEffect(() => {
    queryClientRef.current = queryClient
  }, [queryClient])

  useEffect(() => {
    setPeerRef.current = setPeer
  }, [setPeer])

  useEffect(() => {
    appendLogRef.current = appendLog
  }, [appendLog])

  if (!lcuTransportRef.current) {
    lcuTransportRef.current = createRiftLcuTransport({
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
      queryClient: queryClientRef.current,
      setPeer: setPeerRef.current,
    })
  }

  const lcuTransport = lcuTransportRef.current

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
