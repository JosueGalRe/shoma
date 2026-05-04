import { create } from 'zustand'

export type Invite = {
  gameMode: string
  id: string
  inviterName: string
}

export type InvitesStoreState = {
  invites: Invite[]
}

export type InvitesStoreActions = {
  acceptInvite: (id: string) => void
  addInvite: (invite: Invite) => void
  declineInvite: (id: string) => void
  removeInvite: (id: string) => void
}

export type InvitesStore = InvitesStoreState & InvitesStoreActions

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

function removeInviteById(invites: Invite[], id: string): Invite[] {
  return invites.filter((invite) => invite.id !== id)
}

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
