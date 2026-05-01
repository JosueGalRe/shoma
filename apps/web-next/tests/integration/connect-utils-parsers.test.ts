import { describe, expect, it } from 'bun:test'

import { RiftClientState } from '../../src/core/rift/rift-client-types'
import {
  deriveStatusFlags,
  parseChampSelectState,
  parseLobbyDetails,
  parseReceivedInvites,
} from '../../src/features/connect/connect-utils'

describe('connect utils parsers', () => {
  it('parseLobbyDetails maps moderation and role preference fields', () => {
    const parsed = parseLobbyDetails({
      canStartActivity: true,
      localMember: {
        summonerId: 10,
        isLeader: true,
      },
      members: [
        {
          summonerId: 10,
          isLeader: true,
          allowedInviteOthers: true,
          firstPositionPreference: 'TOP',
          secondPositionPreference: 'JUNGLE',
        },
        {
          summonerId: 11,
          allowedInviteOthers: false,
        },
      ],
      invitations: [{ id: 'x' }, { id: 'y' }],
      gameConfig: {
        queueId: 420,
        mapId: 11,
        showPositionSelector: true,
      },
    })

    expect(parsed).toEqual({
      canStartActivity: true,
      inviteCount: 2,
      localIsLeader: true,
      localSummonerId: 10,
      mapId: 11,
      mapName: null,
      memberCount: 2,
      members: [
        {
          allowedInviteOthers: true,
          firstPositionPreference: 'TOP',
          isLeader: true,
          isLocalMember: true,
          secondPositionPreference: 'JUNGLE',
          summonerId: 10,
        },
        {
          allowedInviteOthers: false,
          firstPositionPreference: 'UNSELECTED',
          isLeader: false,
          isLocalMember: false,
          secondPositionPreference: 'UNSELECTED',
          summonerId: 11,
        },
      ],
      queueId: 420,
      queueName: null,
      showPositionSelector: true,
    })
  })

  it('parseReceivedInvites returns only pending invites with valid shape', () => {
    const parsed = parseReceivedInvites([
      {
        invitationId: 'valid-pending',
        canAcceptInvitation: true,
        fromSummonerId: 20,
        state: 'Pending',
        gameConfig: {
          queueId: 450,
          mapId: 12,
        },
      },
      {
        invitationId: 'ignored-state',
        canAcceptInvitation: true,
        fromSummonerId: 21,
        state: 'Declined',
        gameConfig: {
          queueId: 450,
          mapId: 12,
        },
      },
      {
        invitationId: 123,
        canAcceptInvitation: true,
        fromSummonerId: 22,
        state: 'Pending',
        gameConfig: {
          queueId: 420,
          mapId: 11,
        },
      },
    ])

    expect(parsed).toEqual([
      {
        invitationId: 'valid-pending',
        canAcceptInvitation: true,
        fromSummonerId: 20,
        state: 'Pending',
        gameConfig: {
          queueId: 450,
          mapId: 12,
        },
      },
    ])
  })

  it('parseChampSelectState extracts current action, bans, bench, and local player details', () => {
    const parsed = parseChampSelectState({
      localPlayerCellId: 2,
      benchEnabled: true,
      benchChampionIds: [63, 157, 'invalid'],
      actions: [
        [
          {
            id: 100,
            actorCellId: 2,
            type: 'pick',
            completed: false,
            championId: 238,
          },
          {
            id: 101,
            actorCellId: 5,
            type: 'ban',
            completed: true,
            championId: 84,
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
          summonerId: 30,
          championId: 238,
          championPickIntent: 21,
          selectedSkinId: 238002,
          spell1Id: 4,
          spell2Id: 14,
        },
      ],
      theirTeam: [{ cellId: 8, championId: 103 }],
    })

    expect(parsed).toEqual({
      bannedChampionIds: [84],
      benchChampionIds: [63, 157],
      benchEnabled: true,
      canCompleteCurrentAction: true,
      currentActionChampionId: 238,
      currentActionId: 100,
      currentActionType: 'pick',
      hasLockedChampion: false,
      hoverActionChampionId: 238,
      hoverActionId: 100,
      isLocalPlayerTurn: true,
      localChampionPickIntentId: 21,
      localPlayerCellId: 2,
      localPlayerChampionId: 238,
      localSelectedSkinId: 238002,
      localSpell1Id: 4,
      localSpell2Id: 14,
      localSummonerId: 30,
      myTeamCount: 1,
      phase: 'BAN_PICK',
      theirTeamCount: 1,
      timeLeftInPhaseMs: 28000,
    })
  })

  it('deriveStatusFlags returns expected visibility and status booleans', () => {
    expect(deriveStatusFlags(null)).toEqual({
      isFailureState: false,
      isPendingState: false,
      shouldShowEntry: true,
    })

    expect(deriveStatusFlags(RiftClientState.CONNECTING)).toEqual({
      isFailureState: false,
      isPendingState: true,
      shouldShowEntry: false,
    })

    expect(deriveStatusFlags(RiftClientState.FAILED_NO_DESKTOP)).toEqual({
      isFailureState: true,
      isPendingState: false,
      shouldShowEntry: false,
    })
  })
})
