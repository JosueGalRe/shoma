import type { InvitationId } from '@/core/types/branded'

import type { Invite } from './invites-types'

export function isSameInvite(left: Invite, right: Invite): boolean {
  return left.id === right.id && left.inviterName === right.inviterName && left.gameMode === right.gameMode
}

export function upsertInvite(invites: Invite[], invite: Invite): Invite[] {
  const existingIndex = invites.findIndex((candidate) => { return candidate.id === invite.id; })

  if (existingIndex === -1) {
    return [invite, ...invites]
  }

  const existingInvite = invites[existingIndex]
  if (isSameInvite(existingInvite, invite)) {
    return invites
  }

  return invites.map((candidate, index) => {return (index === existingIndex ? invite : candidate)})
}

export function removeInviteById(invites: Invite[], id: InvitationId): Invite[] {
  return invites.filter((invite) => { return invite.id !== id; })
}
