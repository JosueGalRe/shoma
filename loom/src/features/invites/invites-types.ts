import type { InvitationId } from '@/core/types/branded'

export interface Invite {
  gameMode: string
  id: InvitationId
  inviterName: string
}

export interface InvitesStoreState {
  invites: Invite[]
}

export interface InvitesStoreActions {
  acceptInvite: (id: InvitationId) => void
  addInvite: (invite: Invite) => void
  declineInvite: (id: InvitationId) => void
  removeInvite: (id: InvitationId) => void
}

export type InvitesStore = InvitesStoreState & InvitesStoreActions

export interface UseInvitesResult {
  acceptInvite: (id: InvitationId) => Promise<boolean>
  declineInvite: (id: InvitationId) => Promise<boolean>
  error: Error | null
  invites: Invite[]
  isLoading: boolean
}
