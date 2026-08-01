import { create } from 'zustand'

import {
  emptyLobbyQueueStatus,
  type LobbyInvite,
  type LobbyMember,
  type LobbyQueueStatus,
  type LobbyRole,
  lobbyRoles,
  type LobbySentInvite,
} from '@/core/lcu/parsers/lobby'
import { createPersistedStore } from '@/core/state/create-persisted-store'
import { type GameMode, gameModes } from '@/features/modes/mode-engine'

export { emptyLobbyQueueStatus, lobbyRoles }

export type { LobbyInvite, LobbyMember, LobbyQueueStatus, LobbyRole, LobbySentInvite }

export interface LobbyRolePreferences {
  fifth?: LobbyRole
  first: LobbyRole
  fourth?: LobbyRole
  second: LobbyRole
  third?: LobbyRole
}

interface LobbyStoreState {
  invites: LobbyInvite[]
  isOwner: boolean
  members: LobbyMember[]
  partyType: string | null
  queueStatus: LobbyQueueStatus
  rolePreferences: LobbyRolePreferences
  sentInvites: LobbySentInvite[]
}

interface LobbyStoreActions {
  setInvites: (invites: LobbyInvite[]) => void
  setIsOwner: (isOwner: boolean) => void
  setMembers: (members: LobbyMember[]) => void
  setPartyType: (partyType: string | null) => void
  setQueueStatus: (queueStatus: LobbyQueueStatus) => void
  setRolePreferences: (rolePreferences: LobbyRolePreferences) => void
  setSentInvites: (sentInvites: LobbySentInvite[]) => void
  updateRole: (slot: keyof LobbyRolePreferences, role: LobbyRole) => void
}

type LobbyStore = LobbyStoreState & LobbyStoreActions

export const defaultLobbyRolePreferences: LobbyRolePreferences = {
  first: 'UNSELECTED',
  second: 'UNSELECTED',
}

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
  return gameModes.some((mode) => {
    return mode === value
  })
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

export const useLobbyStore = create<LobbyStore>()((set) => {
  return {
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
  }
})

export interface StickyLobbyState {
  lobbyCreationTime: number | null
  stickyMembers: LobbyMember[]
  stickyMode: GameMode
}

export interface StickyLobbyActions {
  setLobbyCreationTime: (lobbyCreationTime: number | null) => void
  setStickyMembers: (members: LobbyMember[]) => void
  setStickyMode: (mode: GameMode) => void
  syncStickyLobby: (stickyLobby: StickyLobbyState) => void
  clearStickyLobby: () => void
}

export const useStickyLobbyStore = createPersistedStore<StickyLobbyState & StickyLobbyActions>(
  (set) => {
    return {
      clearStickyLobby() {
        set({ lobbyCreationTime: null, stickyMembers: [], stickyMode: 'normal-draft' })
      },
      lobbyCreationTime: null,
      setLobbyCreationTime(lobbyCreationTime) {
        set({ lobbyCreationTime })
      },
      setStickyMembers(members) {
        set({ stickyMembers: members })
      },
      setStickyMode(mode) {
        set({ stickyMode: mode })
      },
      stickyMembers: [],
      stickyMode: 'normal-draft',
      syncStickyLobby(stickyLobby) {
        set(stickyLobby)
      },
    }
  },
  {
    migrate: readStickyLobbyState,
    name: 'shoma:lobby:sticky',
    partialize: ({ lobbyCreationTime, stickyMembers, stickyMode }) => {
      return { lobbyCreationTime, stickyMembers, stickyMode }
    },
    storage: 'sessionStorage',
    version: 2,
  },
)
