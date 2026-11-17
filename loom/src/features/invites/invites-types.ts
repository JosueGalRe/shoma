import type { InvitationId } from '@/core/types/branded'

export interface Invite {
  gameMode: string
  id: InvitationId
  inviterName: string
  queueId: number | null
}

export interface UseInvitesResult {
  acceptInvite: (id: InvitationId) => Promise<boolean>
  declineInvite: (id: InvitationId) => Promise<boolean>
  error: Error | null
  invites: Invite[]
  isLoading: boolean
}
