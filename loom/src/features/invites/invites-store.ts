import { create } from 'zustand'

import { removeInviteById, upsertInvite } from './invites-utils'

import type { Invite, InvitesStore } from './invites-types';

import type { InvitesStoreState } from './invites-types'
import type { InvitationId } from '@/core/types/branded'

type InvitesStoreSelector<T> = (state: InvitesStore) => T

const inviteSelectorCache = new Map<InvitationId, InvitesStoreSelector<Invite | undefined>>()

export function selectInvites(state: InvitesStore): InvitesStoreState['invites'] {
  return state.invites
}

export function selectInviteCount(state: InvitesStore): number {
  return state.invites.length
}

export function selectHasInvites(state: InvitesStore): boolean {
  return state.invites.length > 0
}

export function selectInviteById(id: InvitationId): InvitesStoreSelector<Invite | undefined> {
  const cachedSelector = inviteSelectorCache.get(id)

  if (cachedSelector) {
    return cachedSelector
  }

  function selector(state: InvitesStore): Invite | undefined {
    return state.invites.find((invite) => {
      return invite.id === id
    })
  }

  inviteSelectorCache.set(id, selector)

  return selector
}

// @knip
export const useInvitesStore = create<InvitesStore>()((set) => {
  return {
    acceptInvite(id) {
      set((state) => {
        return { invites: removeInviteById(state.invites, id) }
      })
    },
    addInvite(invite) {
      set((state) => {
        return { invites: upsertInvite(state.invites, invite) }
      })
    },
    declineInvite(id) {
      set((state) => {
        return { invites: removeInviteById(state.invites, id) }
      })
    },
    invites: [],
    removeInvite(id) {
      set((state) => {
        return { invites: removeInviteById(state.invites, id) }
      })
    },
  }
})
