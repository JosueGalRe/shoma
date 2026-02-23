import { useEffect } from 'react'

import { MobileOpcode } from '@mimic/protocol-contract'

import { logError, logEvent } from '../../../core/logging/app-logger'
import { RiftClientState } from '../../../core/rift/rift-client-types'
import { RiftLcuTransport } from '../../../core/rift/rift-lcu-transport'
import type { LobbyDetails, QueueState } from '../../../core/rift/rift-lcu-types'
import { parseLobbyDetails, parseQueueState } from '../connect-utils'

type UseConnectedLcuInitializationOptions = {
  status: RiftClientState | null
  client: { send: (payload: string) => Promise<void> } | null
  lcuTransport: RiftLcuTransport
  setLobbyDetails: (value: LobbyDetails | null) => void
  setQueueState: (value: QueueState | null) => void
  setErrorBanner: (value: string | null) => void
  appendLog: (line: string) => void
  getQueueDescription: (queueId: number) => Promise<string | null>
  getMapName: (mapId: number) => Promise<string | null>
  initializationFailedMessage: string
}

export function useConnectedLcuInitialization({
  status,
  client,
  lcuTransport,
  setLobbyDetails,
  setQueueState,
  setErrorBanner,
  appendLog,
  getQueueDescription,
  getMapName,
  initializationFailedMessage,
}: UseConnectedLcuInitializationOptions) {
  useEffect(() => {
    if (status !== RiftClientState.CONNECTED || !client) {
      return
    }

    let active = true

    const initializeConnectedState = async () => {
      await client.send(JSON.stringify([MobileOpcode.VERSION]))

      const handleLobby = async (result: { status: number; content: unknown }) => {
        if (!active) {
          return
        }

        if (result.status !== 200) {
          setLobbyDetails(null)
          return
        }

        const parsed = parseLobbyDetails(result.content)
        if (!parsed) {
          setLobbyDetails(null)
          return
        }

        let queueName: string | null = null
        let mapName: string | null = null

        if (parsed.queueId !== null) {
          queueName = await getQueueDescription(parsed.queueId)
        }

        if (parsed.mapId !== null) {
          mapName = await getMapName(parsed.mapId)
        }

        setLobbyDetails({
          ...parsed,
          queueName,
          mapName,
        })
      }

      const handleQueue = (result: { status: number; content: unknown }) => {
        if (!active) {
          return
        }

        if (result.status !== 200) {
          setQueueState(null)
          return
        }

        const parsed = parseQueueState(result.content)
        if (!parsed || !parsed.isCurrentlyInQueue) {
          setQueueState(null)
          return
        }

        setQueueState(parsed)
      }

      await lcuTransport.observe('/lol-lobby/v2/lobby', handleLobby)
      await lcuTransport.observe('/lol-matchmaking/v1/search', handleQueue)
      logEvent('lcu_observers_ready')
    }

    initializeConnectedState().catch((error) => {
      logError('lcu_observer_init_failed', error)
      setErrorBanner(initializationFailedMessage)
      appendLog('failed to initialize LCU observers')
    })

    return () => {
      active = false
      void lcuTransport.unobserve('/lol-lobby/v2/lobby')
      void lcuTransport.unobserve('/lol-matchmaking/v1/search')
    }
  }, [
    appendLog,
    client,
    getMapName,
    getQueueDescription,
    initializationFailedMessage,
    lcuTransport,
    setErrorBanner,
    setLobbyDetails,
    setQueueState,
    status,
  ])
}
