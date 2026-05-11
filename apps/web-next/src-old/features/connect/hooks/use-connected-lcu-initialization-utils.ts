import { LcuPaths, MobileOpcode } from '@mimic/protocol-contract'

import { RiftLcuTransport } from '../../../core/rift/rift-lcu-transport'
import type { ChampSelectState, LobbyDetails, QueueState, ReadyCheckState, ReceivedInvite } from '../../../core/rift/rift-lcu-types'
import { parseChampSelectState, parseLobbyDetails, parseQueueState, parseReadyCheckState, parseReceivedInvites } from '../connect-utils'

type LcuObserverResult = {
  status: number
  content: unknown
}

type IsActive = () => boolean

type CreateLobbyObserverOptions = {
  isActive: IsActive
  getQueueDescription: (queueId: number) => Promise<string | null>
  getMapName: (mapId: number) => Promise<string | null>
  setLobbyDetails: (value: LobbyDetails | null) => void
}

type CreateQueueObserverOptions = {
  isActive: IsActive
  setQueueState: (value: QueueState | null) => void
}

type CreateReadyCheckObserverOptions = {
  isActive: IsActive
  setReadyCheckState: (value: ReadyCheckState | null) => void
}

type CreateInviteObserverOptions = {
  isActive: IsActive
  setInvites: (value: ReceivedInvite[]) => void
}

type CreateChampSelectObserverOptions = {
  isActive: IsActive
  setChampSelectState: (value: ChampSelectState | null) => void
}

type InitializeConnectedLcuObserversOptions = {
  client: { send: (payload: string) => Promise<void> }
  lcuTransport: RiftLcuTransport
  handleLobby: (result: LcuObserverResult) => Promise<void>
  handleQueue: (result: LcuObserverResult) => void
  handleReadyCheck: (result: LcuObserverResult) => void
  handleInvites: (result: LcuObserverResult) => void
  handleChampSelect: (result: LcuObserverResult) => void
}

export const LOBBY_PATH = LcuPaths.lobby.lobby
export const QUEUE_PATH = LcuPaths.matchmaking.search
export const READY_CHECK_PATH = LcuPaths.matchmaking.readyCheck
export const INVITES_PATH = LcuPaths.lobby.receivedInvitations
export const CHAMP_SELECT_PATH = LcuPaths.champSelect.session

export function createLobbyObserver({
  isActive,
  getQueueDescription,
  getMapName,
  setLobbyDetails,
}: CreateLobbyObserverOptions) {
  return async (result: LcuObserverResult) => {
    if (!isActive()) {
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
}

export function createQueueObserver({ isActive, setQueueState }: CreateQueueObserverOptions) {
  return (result: LcuObserverResult) => {
    if (!isActive()) {
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
}

export function createReadyCheckObserver({ isActive, setReadyCheckState }: CreateReadyCheckObserverOptions) {
  return (result: LcuObserverResult) => {
    if (!isActive()) {
      return
    }

    if (result.status !== 200) {
      setReadyCheckState(null)
      return
    }

    const parsed = parseReadyCheckState(result.content)
    if (!parsed) {
      setReadyCheckState(null)
      return
    }

    setReadyCheckState(parsed)
  }
}

export function createInviteObserver({ isActive, setInvites }: CreateInviteObserverOptions) {
  return (result: LcuObserverResult) => {
    if (!isActive()) {
      return
    }

    if (result.status !== 200) {
      setInvites([])
      return
    }

    setInvites(parseReceivedInvites(result.content))
  }
}

export function createChampSelectObserver({ isActive, setChampSelectState }: CreateChampSelectObserverOptions) {
  return (result: LcuObserverResult) => {
    if (!isActive()) {
      return
    }

    if (result.status !== 200) {
      setChampSelectState(null)
      return
    }

    const parsed = parseChampSelectState(result.content)
    if (!parsed) {
      setChampSelectState(null)
      return
    }

    setChampSelectState(parsed)
  }
}

export async function initializeConnectedLcuObservers({
  client,
  lcuTransport,
  handleLobby,
  handleQueue,
  handleReadyCheck,
  handleInvites,
  handleChampSelect,
}: InitializeConnectedLcuObserversOptions) {
  await client.send(JSON.stringify([MobileOpcode.VERSION]))
  await lcuTransport.observe(LOBBY_PATH, handleLobby)
  await lcuTransport.observe(QUEUE_PATH, handleQueue)
  await lcuTransport.observe(READY_CHECK_PATH, handleReadyCheck)
  await lcuTransport.observe(INVITES_PATH, handleInvites)
  await lcuTransport.observe(CHAMP_SELECT_PATH, handleChampSelect)
}
