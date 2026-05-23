import { readDisplayName } from '@/core/lcu/parsers/lobby'
import type { SummonerId } from '@/core/types/branded'
import { getModeRules, type GameMode } from '@/features/modes/mode-engine'

import type { LobbyInvite, LobbyMember, LobbyQueueStatus, LobbyRolePreferences, LobbySentInvite } from '../lobby-store'

export type CurrentSummonerPayload = {
  displayName?: string
  gameName?: string
  name?: string
  profileIconId?: number
  summonerId?: SummonerId
  tagLine?: string
}

export type LobbyViewModelInputs = {
  gameflowPhase: string | null
  lobbyCreationTime: number | null
  lobbyMembers: LobbyMember[] | null
  liveLobbyMode: GameMode | null
  stickyMembers: LobbyMember[]
  stickyMode: GameMode
  queueStatus: LobbyQueueStatus
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

export type LobbyViewModel = {
  members: LobbyMember[]
  mode: GameMode
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
  sentInvites: LobbySentInvite[]
  dodgePenalty: number
}

function getLocalRolePreferences(members: LobbyMember[]): LobbyRolePreferences {
  const localMember = members.find((member) => member.isLocalMember)

  if (!localMember) {
    return {
      first: 'UNSELECTED',
      second: 'UNSELECTED',
    }
  }

  return {
    first: localMember.firstPositionPreference,
    second: localMember.secondPositionPreference,
  }
}

export function createLobbyViewModel(inputs: LobbyViewModelInputs): LobbyViewModel {
  const mode =
    inputs.liveLobbyMode ??
    (inputs.stickyMembers.length > 0 || inputs.queueStatus.isSearching ? inputs.stickyMode : 'normal-draft')
  const membersForDisplay =
    inputs.gameflowPhase === 'None'
      ? []
      : inputs.gameflowPhase === 'ChampSelect'
        ? inputs.stickyMembers
        : inputs.lobbyMembers && inputs.lobbyMembers.length > 0
          ? inputs.lobbyMembers
          : inputs.stickyMembers

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

  const members = membersWithSummoners.map((member) => ({
    ...member,
    iconUrl: member.profileIconId === null ? member.iconUrl : (inputs.iconUrls[member.profileIconId] ?? member.iconUrl),
  }))

  const memberCount = members.length
  const modeRules = getModeRules(mode)
  const isLobbyFull = memberCount >= modeRules.maxPartySize
  const isOwner = Boolean(members.find((member) => member.isLocalMember)?.isLeader)
  const rolePreferences = getLocalRolePreferences(members)
  const localMember = members.find((member) => member.isLocalMember) ?? null
  const canInvite = (isOwner || Boolean(localMember?.allowedInviteOthers)) && memberCount < modeRules.maxPartySize
  const canJoinQueue =
    isOwner &&
    inputs.isConnected &&
    !inputs.queueStatus.isSearching &&
    !inputs.isLobbyGracePeriodActive &&
    memberCount >= modeRules.minPartySize &&
    inputs.dodgePenalty <= 0 &&
    (!modeRules.requiresRoleSelection || rolePreferences.first !== 'UNSELECTED')
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
    queueStatus: inputs.queueStatus,
    rolePreferences,
    sentInvites: inputs.sentInvites ?? [],
  }
}
