import { create } from 'zustand'

import type { InvitationId } from '@/core/types/branded'

export type Invite = {
  gameMode: string
  id: InvitationId
  inviterName: string
}

// @knip
export type InvitesStoreState = {
  invites: Invite[]
}

// @knip
export type InvitesStoreActions = {
  acceptInvite: (id: InvitationId) => void
  addInvite: (invite: Invite) => void
  declineInvite: (id: InvitationId) => void
  removeInvite: (id: InvitationId) => void
}

// @knip
export type InvitesStore = InvitesStoreState & InvitesStoreActions

type InvitesStoreSelector<T> = (state: InvitesStore) => T

const inviteSelectorCache = new Map<InvitationId, InvitesStoreSelector<Invite | undefined>>()

export const selectInvites: InvitesStoreSelector<Invite[]> = (state) => state.invites

export const selectInviteCount: InvitesStoreSelector<number> = (state) => state.invites.length

export const selectHasInvites: InvitesStoreSelector<boolean> = (state) => state.invites.length > 0

export function selectInviteById(id: InvitationId): InvitesStoreSelector<Invite | undefined> {
  const cachedSelector = inviteSelectorCache.get(id)

  if (cachedSelector) {
    return cachedSelector
  }

  const selector: InvitesStoreSelector<Invite | undefined> = (state) => state.invites.find((invite) => invite.id === id)
  inviteSelectorCache.set(id, selector)
  return selector
}

function isSameInvite(left: Invite, right: Invite): boolean {
  return left.id === right.id && left.inviterName === right.inviterName && left.gameMode === right.gameMode
}

function upsertInvite(invites: Invite[], invite: Invite): Invite[] {
  const existingIndex = invites.findIndex((candidate) => candidate.id === invite.id)

  if (existingIndex === -1) {
    return [invite, ...invites]
  }

  const existingInvite = invites[existingIndex]
  if (isSameInvite(existingInvite, invite)) {
    return invites
  }

  return invites.map((candidate, index) => (index === existingIndex ? invite : candidate))
}

function removeInviteById(invites: Invite[], id: InvitationId): Invite[] {
  return invites.filter((invite) => invite.id !== id)
}

// @knip
export const useInvitesStore = create<InvitesStore>()((set) => ({
  invites: [],
  acceptInvite(id) {
    set((state) => ({ invites: removeInviteById(state.invites, id) }))
  },
  addInvite(invite) {
    set((state) => ({ invites: upsertInvite(state.invites, invite) }))
  },
  declineInvite(id) {
    set((state) => ({ invites: removeInviteById(state.invites, id) }))
  },
  removeInvite(id) {
    set((state) => ({ invites: removeInviteById(state.invites, id) }))
  },
}))
