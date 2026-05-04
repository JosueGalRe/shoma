import { create } from 'zustand'

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
  summonerId: number
}

export type LobbyQueueStatus = {
  isSearching: boolean
  queueId: number | null
  searchState: string | null
}

export type LobbyInvite = {
  fromSummonerId: number | null
  fromSummonerName: string
  id: string
  state: string | null
}

export type LobbyRolePreferences = {
  first: LobbyRole
  second: LobbyRole
}

export type LobbyStoreState = {
  invites: LobbyInvite[]
  isOwner: boolean
  members: LobbyMember[]
  queueStatus: LobbyQueueStatus
  rolePreferences: LobbyRolePreferences
}

export type LobbyStoreActions = {
  setInvites: (invites: LobbyInvite[]) => void
  setIsOwner: (isOwner: boolean) => void
  setMembers: (members: LobbyMember[]) => void
  setQueueStatus: (queueStatus: LobbyQueueStatus) => void
  setRolePreferences: (rolePreferences: LobbyRolePreferences) => void
  updateRole: (slot: keyof LobbyRolePreferences, role: LobbyRole) => void
}

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

export const initialLobbyStoreState: LobbyStoreState = {
  invites: [],
  isOwner: false,
  members: [],
  queueStatus: emptyLobbyQueueStatus,
  rolePreferences: defaultLobbyRolePreferences,
}

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
  updateRole(slot, role) {
    set((state) => ({
      rolePreferences: {
        ...state.rolePreferences,
        [slot]: role,
      },
    }))
  },
}))
