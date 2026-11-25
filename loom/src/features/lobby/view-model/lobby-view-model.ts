import { type QueueRestriction, readDisplayName } from '@/core/lcu/parsers/lobby'
import { type GameMode, getModeRules } from '@/features/modes/mode-engine'
import { MULTITEAM_LOBBY_CONFIG } from '@/features/modes/multiteam-lobby'

import type { LobbyInvite, LobbyMember, LobbyQueueStatus, LobbyRolePreferences, LobbySentInvite } from '../lobby-store'
import type { SummonerId } from '@/core/types/branded'

export interface CurrentSummonerPayload {
  displayName?: string
  gameName?: string
  name?: string
  profileIconId?: number
  summonerId?: SummonerId
  tagLine?: string
}

export interface LobbyViewModelInputs {
  canStartActivity: boolean
  gameflowPhase: string | null
  lobbyCreationTime: number | null
  lobbyMembers: LobbyMember[] | null
  liveLobbyMode: GameMode | null
  liveLobbyQueueId: number | null
  stickyMembers: LobbyMember[]
  stickyMode: GameMode
  queueStatus: LobbyQueueStatus
  restrictions: QueueRestriction[]
  isLobbyGracePeriodActive: boolean
  currentSummoner: CurrentSummonerPayload | null
  summonersById: Record<SummonerId, CurrentSummonerPayload>
  iconUrls: Record<number, string | null>
  invites: LobbyInvite[] | null
  partyType: string | null
  dodgePenalty: number
  isConnected: boolean
  sentInvites: LobbySentInvite[] | null
}

export interface LobbyViewModel {
  members: LobbyMember[]
  mode: GameMode
  queueId: number | null
  partyType: string | null
  queueStatus: LobbyQueueStatus
  rolePreferences: LobbyRolePreferences
  isOwner: boolean
  canInvite: boolean
  canJoinQueue: boolean
  hasLobby: boolean
  isLobbyFull: boolean
  invites: LobbyInvite[]
  lobbyCreationTime: number | null
  restrictions: QueueRestriction[]
  sentInvites: LobbySentInvite[]
  dodgePenalty: number
}

function getLocalRolePreferences(members: LobbyMember[]): LobbyRolePreferences {
  const localMember = members.find((member) => {
    return member.isLocalMember
  })

  if (!localMember) {
    return {
      first: 'UNSELECTED',
      second: 'UNSELECTED',
    }
  }

  return {
    fifth: localMember.fifthPositionPreference,
    first: localMember.firstPositionPreference,
    fourth: localMember.fourthPositionPreference,
    second: localMember.secondPositionPreference,
    third: localMember.thirdPositionPreference,
  }
}

function getMembersForDisplay(inputs: LobbyViewModelInputs): LobbyMember[] {
  if (inputs.gameflowPhase === 'None') {
    return []
  }

  if (inputs.gameflowPhase === 'ChampSelect') {
    return inputs.stickyMembers
  }

  if (inputs.lobbyMembers && inputs.lobbyMembers.length > 0) {
    return inputs.lobbyMembers
  }

  return inputs.stickyMembers
}

export function createLobbyViewModel(inputs: LobbyViewModelInputs): LobbyViewModel {
  let mode: GameMode

  if (inputs.liveLobbyMode) {
    mode = inputs.liveLobbyMode
  } else if (inputs.stickyMembers.length > 0 || inputs.queueStatus.isSearching) {
    mode = inputs.stickyMode
  } else {
    mode = 'normal-draft'
  }

  const membersForDisplay = getMembersForDisplay(inputs)

  const membersWithCurrentSummoner = membersForDisplay.map((member) => {
    if (member.displayName === 'Unknown summoner' && member.isLocalMember && inputs.currentSummoner) {
      return { ...member, displayName: readDisplayName(inputs.currentSummoner) }
    }

    return member
  })

  const membersWithSummoners = membersWithCurrentSummoner.map((member) => {
    const summoner = inputs.summonersById[member.summonerId] ?? null
    const enrichedName = summoner ? readDisplayName(summoner) : member.displayName
    const enrichedIconId = summoner?.profileIconId ?? null

    return {
      ...member,
      displayName: member.displayName === 'Unknown summoner' ? enrichedName : member.displayName,
      profileIconId: member.profileIconId ?? enrichedIconId,
    }
  })

  const members = membersWithSummoners.map((member) => {
    return {
      ...member,
      iconUrl: member.profileIconId === null ? member.iconUrl : (inputs.iconUrls[member.profileIconId] ?? member.iconUrl),
    }
  })

  const memberCount = members.length
  const modeRules = getModeRules(mode)
  // Arena's lobby holds every team of the game, so its size is the client's table's, not the mode's
  const multiteam = inputs.liveLobbyQueueId === null ? undefined : MULTITEAM_LOBBY_CONFIG[inputs.liveLobbyQueueId]
  const maxPartySize = multiteam ? multiteam.playerSlotCount * multiteam.subteamCount : modeRules.maxPartySize
  const isLobbyFull = memberCount >= maxPartySize
  const isOwner = Boolean(
    members.find((member) => {
      return member.isLocalMember
    })?.isLeader,
  )
  const rolePreferences = getLocalRolePreferences(members)
  const localMember =
    members.find((member) => {
      return member.isLocalMember
    }) ?? null
  const canInvite = (isOwner || Boolean(localMember?.allowedInviteOthers)) && memberCount < maxPartySize
  const hasValidRoleSelection =
    !modeRules.requiresRoleSelection ||
    (rolePreferences.first !== 'UNSELECTED' && (rolePreferences.first === 'FILL' || rolePreferences.second !== 'UNSELECTED'))
  const canJoinQueue =
    isOwner &&
    inputs.isConnected &&
    !inputs.queueStatus.isSearching &&
    !inputs.isLobbyGracePeriodActive &&
    memberCount >= modeRules.minPartySize &&
    inputs.dodgePenalty <= 0 &&
    hasValidRoleSelection &&
    // As in the client, any restriction blocks the search, even while the lobby still says it can start
    inputs.canStartActivity &&
    inputs.restrictions.length === 0
  const isInGame = inputs.gameflowPhase === 'InProgress'
  const hasLobby = !isInGame && (members.length > 0 || inputs.queueStatus.isSearching || inputs.isLobbyGracePeriodActive)

  return {
    canInvite,
    canJoinQueue,
    dodgePenalty: inputs.dodgePenalty,
    hasLobby,
    invites: inputs.invites ?? [],
    isLobbyFull,
    isOwner,
    lobbyCreationTime: hasLobby ? inputs.lobbyCreationTime : null,
    members,
    mode,
    partyType: inputs.partyType,
    queueId: inputs.liveLobbyQueueId,
    queueStatus: inputs.queueStatus,
    restrictions: inputs.restrictions,
    rolePreferences,
    sentInvites: inputs.sentInvites ?? [],
  }
}
