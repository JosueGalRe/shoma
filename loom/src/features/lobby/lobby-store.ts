import { create } from 'zustand'

import { createPersistedStore } from '@/core/state/create-persisted-store'
import type { InvitationId } from '@/core/types/branded';
import type { QueueId } from '@/core/types/branded';
import type { SummonerId } from '@/core/types/branded';
import type { GameMode } from '@/features/modes/mode-engine'
import { gameModes } from '@/features/modes/mode-engine'
import type { LcuPaths } from '@shoma/protocol-contract';
import type { LcuResponse } from '@shoma/protocol-contract';

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
  showClimbIndicator?: boolean
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
  partyType: string | null
  queueStatus: LobbyQueueStatus
  rolePreferences: LobbyRolePreferences
  sentInvites: LobbySentInvite[]
}

// @knip
export type LobbyStoreActions = {
  setInvites: (invites: LobbyInvite[]) => void
  setIsOwner: (isOwner: boolean) => void
  setMembers: (members: LobbyMember[]) => void
  setPartyType: (partyType: string | null) => void
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
  partyType: null,
  queueStatus: emptyLobbyQueueStatus,
  rolePreferences: defaultLobbyRolePreferences,
  sentInvites: [],
}

function isGameMode(value: string): value is GameMode {
  return gameModes.some((mode) => {return mode === value})
}

function readStickyLobbyState(persistedState: unknown): StickyLobbyState {
  if (typeof persistedState !== 'object' || persistedState === null) {
    return {
      lobbyCreationTime: null,
      stickyMembers: [],
      stickyMode: 'normal-draft',
    }
  }

  const lobbyCreationTime = Reflect.get(persistedState, 'lobbyCreationTime')
  const stickyMembers = Reflect.get(persistedState, 'stickyMembers')
  const stickyMode = Reflect.get(persistedState, 'stickyMode')

  return {
    lobbyCreationTime: typeof lobbyCreationTime === 'number' ? lobbyCreationTime : null,
    stickyMembers: Array.isArray(stickyMembers) ? stickyMembers : [],
    stickyMode: typeof stickyMode === 'string' && isGameMode(stickyMode) ? stickyMode : 'normal-draft',
  }
}

// @knip
export const useLobbyStore = create<LobbyStore>()((set) => {return {
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
  setPartyType(partyType) {
    set({ partyType })
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
    set((state) => {
      return {
        rolePreferences: {
          ...state.rolePreferences,
          [slot]: role,
        },
      }
    })
  },
}})

export type StickyLobbyState = {
  lobbyCreationTime: number | null
  stickyMembers: LobbyMember[]
  stickyMode: GameMode
}

export type StickyLobbyActions = {
  setLobbyCreationTime: (lobbyCreationTime: number | null) => void
  setStickyMembers: (members: LobbyMember[]) => void
  setStickyMode: (mode: GameMode) => void
  clearStickyLobby: () => void
}

export const useStickyLobbyStore = createPersistedStore<StickyLobbyState & StickyLobbyActions>(
  (set) => {return {
    lobbyCreationTime: null,
    stickyMembers: [],
    stickyMode: 'normal-draft',
    setLobbyCreationTime(lobbyCreationTime) {
      set({ lobbyCreationTime })
    },
    setStickyMembers(members) {
      set({ stickyMembers: members })
    },
    setStickyMode(mode) {
      set({ stickyMode: mode })
    },
    clearStickyLobby() {
      set({ lobbyCreationTime: null, stickyMembers: [], stickyMode: 'normal-draft' })
    },
  }},
  {
    name: 'shoma:lobby:sticky',
    migrate: readStickyLobbyState,
    partialize: ({ lobbyCreationTime, stickyMembers, stickyMode }) => {return { lobbyCreationTime, stickyMembers, stickyMode }},
    storage: 'sessionStorage',
    version: 2,
  },
)
