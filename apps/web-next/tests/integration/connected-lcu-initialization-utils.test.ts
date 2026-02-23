import { describe, expect, it } from 'bun:test'

import { MobileOpcode } from '@mimic/protocol-contract'

import { RiftLcuTransport } from '../../src/core/rift/rift-lcu-transport'
import {
  CHAMP_SELECT_PATH,
  createChampSelectObserver,
  createInviteObserver,
  createLobbyObserver,
  createQueueObserver,
  createReadyCheckObserver,
  initializeConnectedLcuObservers,
  INVITES_PATH,
  LOBBY_PATH,
  QUEUE_PATH,
  READY_CHECK_PATH,
} from '../../src/features/connect/hooks/use-connected-lcu-initialization-utils'

describe('connected lcu initialization utils', () => {
  it('createLobbyObserver sets null when observer is inactive or status is not 200', async () => {
    let active = false
    let lobbyDetails: unknown = 'unchanged'

    const handleLobby = createLobbyObserver({
      isActive() {
        return active
      },
      async getQueueDescription() {
        return 'queue'
      },
      async getMapName() {
        return 'map'
      },
      setLobbyDetails(value) {
        lobbyDetails = value
      },
    })

    await handleLobby({ status: 200, content: { members: [] } })
    expect(lobbyDetails).toBe('unchanged')

    active = true
    await handleLobby({ status: 500, content: {} })
    expect(lobbyDetails).toBe(null)
  })

  it('createLobbyObserver enriches lobby details with queue and map names', async () => {
    let lobbyDetails: unknown = null

    const handleLobby = createLobbyObserver({
      isActive() {
        return true
      },
      async getQueueDescription(queueId) {
        return `queue-${queueId}`
      },
      async getMapName(mapId) {
        return `map-${mapId}`
      },
      setLobbyDetails(value) {
        lobbyDetails = value
      },
    })

    await handleLobby({
      status: 200,
      content: {
        members: [{ id: 1 }, { id: 2 }],
        invitations: [{ id: 1 }],
        gameConfig: {
          queueId: 420,
          mapId: 11,
        },
      },
    })

    expect(lobbyDetails).toEqual({
      inviteCount: 1,
      mapId: 11,
      mapName: 'map-11',
      memberCount: 2,
      queueId: 420,
      queueName: 'queue-420',
    })
  })

  it('createQueueObserver sets queue state only when currently in queue', () => {
    let queueState: unknown = 'unchanged'

    const handleQueue = createQueueObserver({
      isActive() {
        return true
      },
      setQueueState(value) {
        queueState = value
      },
    })

    handleQueue({ status: 500, content: {} })
    expect(queueState).toBe(null)

    handleQueue({
      status: 200,
      content: {
        isCurrentlyInQueue: false,
      },
    })
    expect(queueState).toBe(null)

    handleQueue({
      status: 200,
      content: {
        isCurrentlyInQueue: true,
        estimatedQueueTime: 15,
      },
    })
    expect(queueState).toEqual({
      estimatedQueueTime: 15,
      isCurrentlyInQueue: true,
    })
  })

  it('createReadyCheckObserver sets null when status is not 200 and stores parsed state on success', () => {
    let readyCheckState: unknown = 'unchanged'

    const handleReadyCheck = createReadyCheckObserver({
      isActive() {
        return true
      },
      setReadyCheckState(value) {
        readyCheckState = value
      },
    })

    handleReadyCheck({ status: 404, content: {} })
    expect(readyCheckState).toBe(null)

    handleReadyCheck({
      status: 200,
      content: {
        timer: 7,
        state: 'InProgress',
        playerResponse: 'None',
      },
    })
    expect(readyCheckState).toEqual({
      timer: 7,
      state: 'InProgress',
      playerResponse: 'None',
    })
  })

  it('createInviteObserver keeps only pending invites and clears for non-200 responses', () => {
    let invites: unknown = 'unchanged'

    const handleInvites = createInviteObserver({
      isActive() {
        return true
      },
      setInvites(value) {
        invites = value
      },
    })

    handleInvites({ status: 500, content: {} })
    expect(invites).toEqual([])

    handleInvites({
      status: 200,
      content: [
        {
          invitationId: 'pending-1',
          canAcceptInvitation: true,
          fromSummonerId: 101,
          gameConfig: {
            queueId: 420,
            mapId: 11,
          },
          state: 'Pending',
        },
        {
          invitationId: 'declined-1',
          canAcceptInvitation: false,
          fromSummonerId: 102,
          gameConfig: {
            queueId: 450,
            mapId: 12,
          },
          state: 'Declined',
        },
      ],
    })

    expect(invites).toEqual([
      {
        invitationId: 'pending-1',
        canAcceptInvitation: true,
        fromSummonerId: 101,
        gameConfig: {
          queueId: 420,
          mapId: 11,
        },
        state: 'Pending',
      },
    ])
  })

  it('createChampSelectObserver sets null on non-200 and stores parsed champ-select snapshot on success', () => {
    let champSelectState: unknown = 'unchanged'

    const handleChampSelect = createChampSelectObserver({
      isActive() {
        return true
      },
      setChampSelectState(value) {
        champSelectState = value
      },
    })

    handleChampSelect({ status: 404, content: {} })
    expect(champSelectState).toBe(null)

    handleChampSelect({
      status: 200,
      content: {
        localPlayerCellId: 2,
        actions: [
          [
            {
              actorCellId: 2,
              type: 'pick',
              completed: false,
              championId: 238,
            },
          ],
        ],
        timer: {
          phase: 'BAN_PICK',
          adjustedTimeLeftInPhase: 28000,
        },
        myTeam: [
          {
            cellId: 2,
            championId: 238,
          },
        ],
        theirTeam: [{ cellId: 7, championId: 103 }],
      },
    })

    expect(champSelectState).toEqual({
      currentActionChampionId: 238,
      currentActionType: 'pick',
      hasLockedChampion: false,
      isLocalPlayerTurn: true,
      localPlayerCellId: 2,
      localPlayerChampionId: 238,
      myTeamCount: 1,
      phase: 'BAN_PICK',
      theirTeamCount: 1,
      timeLeftInPhaseMs: 28000,
    })
  })

  it('initializeConnectedLcuObservers sends version frame and observes lobby/queue/ready-check/invites/champ-select paths', async () => {
    const sentPayloads: string[] = []
    const observedPaths: string[] = []

    const client = {
      async send(payload: string) {
        sentPayloads.push(payload)
      },
    }

    const lcuTransport = new RiftLcuTransport({
      async send() {
        return
      },
      isConnected() {
        return true
      },
      onMapPathUpdate() {
        return
      },
      onObserverError() {
        return
      },
      onPeer() {
        return
      },
      onQueuePathUpdate() {
        return
      },
    })

    lcuTransport.observe = async (path) => {
      observedPaths.push(path)
    }

    await initializeConnectedLcuObservers({
      client,
      handleChampSelect: () => {
        return
      },
      handleInvites: () => {
        return
      },
      handleLobby: async () => {
        return
      },
      handleQueue: () => {
        return
      },
      handleReadyCheck: () => {
        return
      },
      lcuTransport,
    })

    expect(sentPayloads).toEqual([JSON.stringify([MobileOpcode.VERSION])])
    expect(observedPaths).toEqual([LOBBY_PATH, QUEUE_PATH, READY_CHECK_PATH, INVITES_PATH, CHAMP_SELECT_PATH])
  })
})
