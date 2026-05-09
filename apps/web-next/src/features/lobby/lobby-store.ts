import { create } from 'zustand'

import type { LcuPaths, LcuResponse } from '@mimic/protocol-contract'
import type { InvitationId, QueueId, SummonerId } from '@/core/types/branded'

// @knip
export const lobbyRoles = ['UNSELECTED', 'FILL', 'TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'] as const

export type LobbyRole = (typeof lobbyRoles)[number]

export type LobbyMember = {
  allowedInviteOthers: boolean
  displayName: string
  firstPositionPreference: LobbyRole
  iconUrl: string | null
  isLeader: boolean
  isLocalMember: boolean
  profileIconId: number | null
  secondPositionPreference: LobbyRole
  summonerId: SummonerId
}

export type LobbyQueueStatus = {
  isSearching: boolean
  queueId: QueueId | null
  searchState: string | null
}

type LobbyReceivedInvitation = LcuResponse<typeof LcuPaths.lobby.receivedInvitations, 'get'>[number]

export type LobbyInvite = {
  fromSummonerId: SummonerId | null
  fromSummonerName: LobbyReceivedInvitation['fromSummonerName']
  id: InvitationId
  state: string | null
}

export type LobbySentInvite = {
  id: InvitationId
  state: string | null
  toSummonerId: SummonerId | null
  toSummonerName: string
}

export type LobbyRolePreferences = {
  first: LobbyRole
  second: LobbyRole
}

// @knip
export type LobbyStoreState = {
  invites: LobbyInvite[]
  isOwner: boolean
  members: LobbyMember[]
  queueStatus: LobbyQueueStatus
  rolePreferences: LobbyRolePreferences
  sentInvites: LobbySentInvite[]
}

// @knip
export type LobbyStoreActions = {
  setInvites: (invites: LobbyInvite[]) => void
  setIsOwner: (isOwner: boolean) => void
  setMembers: (members: LobbyMember[]) => void
  setQueueStatus: (queueStatus: LobbyQueueStatus) => void
  setRolePreferences: (rolePreferences: LobbyRolePreferences) => void
  setSentInvites: (sentInvites: LobbySentInvite[]) => void
  updateRole: (slot: keyof LobbyRolePreferences, role: LobbyRole) => void
}

// @knip
export type LobbyStore = LobbyStoreState & LobbyStoreActions

export const emptyLobbyQueueStatus: LobbyQueueStatus = {
  isSearching: false,
  queueId: null,
  searchState: null,
}

export const defaultLobbyRolePreferences: LobbyRolePreferences = {
  first: 'UNSELECTED',
  second: 'UNSELECTED',
}

// @knip
export const initialLobbyStoreState: LobbyStoreState = {
  invites: [],
  isOwner: false,
  members: [],
  queueStatus: emptyLobbyQueueStatus,
  rolePreferences: defaultLobbyRolePreferences,
  sentInvites: [],
}

// @knip
export const useLobbyStore = create<LobbyStore>()((set) => ({
  ...initialLobbyStoreState,
  setInvites(invites) {
    set({ invites })
  },
  setIsOwner(isOwner) {
    set({ isOwner })
  },
  setMembers(members) {
    set({ members })
  },
  setQueueStatus(queueStatus) {
    set({ queueStatus })
  },
  setRolePreferences(rolePreferences) {
    set({ rolePreferences })
  },
  setSentInvites(sentInvites) {
    set({ sentInvites })
  },
  updateRole(slot, role) {
    set((state) => ({
      rolePreferences: {
        ...state.rolePreferences,
        [slot]: role,
      },
    }))
  },
}))
