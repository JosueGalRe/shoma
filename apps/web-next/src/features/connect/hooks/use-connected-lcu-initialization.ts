import { useEffect, useRef } from 'react'

import { logError, logEvent } from '../../../core/logging/app-logger'
import { RiftClientState } from '../../../core/rift/rift-client-types'
import { RiftLcuTransport } from '../../../core/rift/rift-lcu-transport'
import type { ChampSelectState, LobbyDetails, QueueState, ReadyCheckState, ReceivedInvite } from '../../../core/rift/rift-lcu-types'
import {
  createChampSelectObserver,
  createInviteObserver,
  createLobbyObserver,
  createQueueObserver,
  createReadyCheckObserver,
  initializeConnectedLcuObservers,
} from './use-connected-lcu-initialization-utils'

type UseConnectedLcuInitializationOptions = {
  status: RiftClientState | null
  client: { send: (payload: string) => Promise<void> } | null
  lcuTransport: RiftLcuTransport
  setLobbyDetails: (value: LobbyDetails | null) => void
  setQueueState: (value: QueueState | null) => void
  setReadyCheckState: (value: ReadyCheckState | null) => void
  setInvites: (value: ReceivedInvite[]) => void
  setChampSelectState: (value: ChampSelectState | null) => void
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
  setReadyCheckState,
  setInvites,
  setChampSelectState,
  setErrorBanner,
  appendLog,
  getQueueDescription,
  getMapName,
  initializationFailedMessage,
}: UseConnectedLcuInitializationOptions) {
  const initializedClientRef = useRef<UseConnectedLcuInitializationOptions['client']>(null)

  useEffect(() => {
    if (status !== RiftClientState.CONNECTED || !client) {
      initializedClientRef.current = null
      return
    }

    if (initializedClientRef.current === client) {
      return
    }

    initializedClientRef.current = client

    const initializeConnectedState = async () => {
      const isActive = () => {
        return initializedClientRef.current === client
      }

      const handleLobby = createLobbyObserver({
        getMapName,
        getQueueDescription,
        isActive,
        setLobbyDetails,
      })

      const handleQueue = createQueueObserver({
        isActive,
        setQueueState,
      })

      const handleReadyCheck = createReadyCheckObserver({
        isActive,
        setReadyCheckState,
      })

      const handleInvites = createInviteObserver({
        isActive,
        setInvites,
      })

      const handleChampSelect = createChampSelectObserver({
        isActive,
        setChampSelectState,
      })

      await initializeConnectedLcuObservers({
        client,
        handleChampSelect,
        handleInvites,
        handleLobby,
        handleQueue,
        handleReadyCheck,
        lcuTransport,
      })

      logEvent('lcu_observers_ready')
    }

    initializeConnectedState().catch((error) => {
      logError('lcu_observer_init_failed', error)
      setErrorBanner(initializationFailedMessage)
      appendLog('failed to initialize LCU observers')
    })
  }, [
    appendLog,
    client,
    getMapName,
    getQueueDescription,
    initializationFailedMessage,
    lcuTransport,
    setChampSelectState,
    setErrorBanner,
    setInvites,
    setLobbyDetails,
    setQueueState,
    setReadyCheckState,
    status,
  ])
}
