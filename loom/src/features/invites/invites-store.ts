import { create } from 'zustand'

import type { InvitationId } from '@/core/types/branded'

import type { Invite, InvitesStore, InvitesStoreState } from './invites-types'
import { removeInviteById, upsertInvite } from './invites-utils'

type InvitesStoreSelector<T> = (state: InvitesStore) => T

const inviteSelectorCache = new Map<InvitationId, InvitesStoreSelector<Invite | undefined>>()

export const selectInvites: InvitesStoreSelector<InvitesStoreState['invites']> = (state) => state.invites

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
