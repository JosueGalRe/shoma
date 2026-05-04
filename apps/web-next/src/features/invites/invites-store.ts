import { LcuPaths } from '@mimic/protocol-contract'
import { create } from 'zustand'

import { useGameflowStore } from '@core/state/gameflow-store'

export type InviteState = 'Pending' | 'Accepted' | 'Declined' | 'Expired' | string

export type LobbyInvite = {
  invitationId: string
  canAcceptInvitation: boolean
  fromSummonerId: number
  state: InviteState
  gameConfig?: {
    queueId?: number
    mapId?: number
  }
  expirationTimestamp?: number | string | null
  expiresAt?: number | string | null
  timestamp?: number | string | null
}

export type InviteOperation = (invite: LobbyInvite) => Promise<void>

export type InvitesStoreState = {
  receivedInvites: LobbyInvite[]
  pendingInvites: LobbyInvite[]
  isLoading: boolean
  error: Error | null
}

export type InvitesStoreActions = {
  acceptInvite: (inviteId: string, requestAccept?: InviteOperation) => Promise<boolean>
  addInvite: (invite: LobbyInvite) => void
  declineInvite: (inviteId: string, requestDecline?: InviteOperation) => Promise<boolean>
  removeExpiredInvites: (now?: number) => void
  removeInvite: (inviteId: string) => void
  reset: () => void
  setError: (error: unknown) => void
  setInvites: (invites: LobbyInvite[] | null | undefined) => void
  setLoading: (isLoading: boolean) => void
}

export type InvitesStore = InvitesStoreState & InvitesStoreActions

export const initialInvitesState: InvitesStoreState = {
  error: null,
  isLoading: true,
  pendingInvites: [],
  receivedInvites: [],
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error
  }

  if (typeof error === 'string') {
    return new Error(error)
  }

  return new Error('Invite operation failed.')
}

function readInviteExpiration(invite: LobbyInvite): number | null {
  const rawExpiration = invite.expiresAt ?? invite.expirationTimestamp
  if (rawExpiration === null || rawExpiration === undefined) {
    return null
  }

  if (typeof rawExpiration === 'number') {
    return rawExpiration
  }

  const parsedExpiration = Date.parse(rawExpiration)
  return Number.isNaN(parsedExpiration) ? null : parsedExpiration
}

export function isInviteExpired(invite: LobbyInvite, now = Date.now()): boolean {
  if (invite.state === 'Expired') {
    return true
  }

  const expiration = readInviteExpiration(invite)
  return expiration !== null && expiration <= now
}

export function canRespondToInvite(invite: LobbyInvite, now = Date.now()): boolean {
  return invite.state === 'Pending' && invite.canAcceptInvitation && !isInviteExpired(invite, now)
}

function normalizeInvites(invites: LobbyInvite[], now = Date.now()): LobbyInvite[] {
  return invites.map((invite) => (isInviteExpired(invite, now) ? { ...invite, state: 'Expired', canAcceptInvitation: false } : invite))
}

function readPendingInvites(invites: LobbyInvite[], now = Date.now()): LobbyInvite[] {
  return invites.filter((invite) => canRespondToInvite(invite, now))
}

function upsertInvite(invites: LobbyInvite[], invite: LobbyInvite): LobbyInvite[] {
  const existingIndex = invites.findIndex((candidate) => candidate.invitationId === invite.invitationId)
  if (existingIndex === -1) {
    return [invite, ...invites]
  }

  return invites.map((candidate, index) => (index === existingIndex ? { ...candidate, ...invite } : candidate))
}

async function defaultAcceptInvite(): Promise<void> {
  useGameflowStore.getState().setPhase('lobby')
}

async function defaultDeclineInvite(): Promise<void> {
  useGameflowStore.getState().setPhase('connected')
}

export function createInvitesStore() {
  return create<InvitesStore>()((set, get) => ({
    ...initialInvitesState,
    async acceptInvite(inviteId, requestAccept = defaultAcceptInvite) {
      const invite = get().receivedInvites.find((candidate) => candidate.invitationId === inviteId)
      if (!invite) {
        set({ error: new Error('Invite not found.') })
        return false
      }

      if (!canRespondToInvite(invite)) {
        set((state) => {
          const receivedInvites = state.receivedInvites.filter((candidate) => candidate.invitationId !== inviteId)
          return {
            error: new Error('Invite has expired.'),
            isLoading: false,
            pendingInvites: readPendingInvites(receivedInvites),
            receivedInvites,
          }
        })
        return false
      }

      set({ error: null, isLoading: true })
      try {
        await requestAccept(invite)
        set((state) => {
          const receivedInvites = state.receivedInvites.filter((candidate) => candidate.invitationId !== inviteId)
          return {
            error: null,
            isLoading: false,
            pendingInvites: readPendingInvites(receivedInvites),
            receivedInvites,
          }
        })
        useGameflowStore.getState().setPhase('lobby')
        return true
      } catch (error) {
        set({ error: normalizeError(error), isLoading: false })
        return false
      }
    },
    addInvite(invite) {
      set((state) => {
        const receivedInvites = normalizeInvites(upsertInvite(state.receivedInvites, invite))
        return {
          error: null,
          isLoading: false,
          pendingInvites: readPendingInvites(receivedInvites),
          receivedInvites,
        }
      })
    },
    async declineInvite(inviteId, requestDecline = defaultDeclineInvite) {
      const invite = get().receivedInvites.find((candidate) => candidate.invitationId === inviteId)
      if (!invite) {
        set({ error: new Error('Invite not found.') })
        return false
      }

      set({ error: null, isLoading: true })
      try {
        await requestDecline(invite)
        set((state) => {
          const receivedInvites = state.receivedInvites.filter((candidate) => candidate.invitationId !== inviteId)
          return {
            error: null,
            isLoading: false,
            pendingInvites: readPendingInvites(receivedInvites),
            receivedInvites,
          }
        })
        return true
      } catch (error) {
        set({ error: normalizeError(error), isLoading: false })
        return false
      }
    },
    removeExpiredInvites(now = Date.now()) {
      set((state) => {
        const receivedInvites = state.receivedInvites.filter((invite) => !isInviteExpired(invite, now))
        return {
          pendingInvites: readPendingInvites(receivedInvites, now),
          receivedInvites,
        }
      })
    },
    removeInvite(inviteId) {
      set((state) => {
        const receivedInvites = state.receivedInvites.filter((candidate) => candidate.invitationId !== inviteId)
        return {
          pendingInvites: readPendingInvites(receivedInvites),
          receivedInvites,
        }
      })
    },
    reset() {
      set({ ...initialInvitesState })
    },
    setError(error) {
      set({ error: normalizeError(error), isLoading: false })
    },
    setInvites(invites) {
      const receivedInvites = normalizeInvites(invites ?? [])
      set({
        error: null,
        isLoading: false,
        pendingInvites: readPendingInvites(receivedInvites),
        receivedInvites,
      })
    },
    setLoading(isLoading) {
      set({ isLoading })
    },
  }))
}

export const invitesRequestPaths = {
  accept: LcuPaths.lobby.receivedInvitationAccept,
  decline: LcuPaths.lobby.receivedInvitationDecline,
  observer: LcuPaths.lobby.receivedInvitations,
} as const

export const useInvitesStore = createInvitesStore()
