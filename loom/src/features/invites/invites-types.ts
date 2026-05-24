import type { InvitationId } from '@/core/types/branded'

export type Invite = {
  gameMode: string
  id: InvitationId
  inviterName: string
}

export type InvitesStoreState = {
  invites: Invite[]
}

export type InvitesStoreActions = {
  acceptInvite: (id: InvitationId) => void
  addInvite: (invite: Invite) => void
  declineInvite: (id: InvitationId) => void
  removeInvite: (id: InvitationId) => void
}

export type InvitesStore = InvitesStoreState & InvitesStoreActions

export type UseInvitesResult = {
  acceptInvite: (id: InvitationId) => Promise<boolean>
  declineInvite: (id: InvitationId) => Promise<boolean>
  error: Error | null
  invites: Invite[]
  isLoading: boolean
}
