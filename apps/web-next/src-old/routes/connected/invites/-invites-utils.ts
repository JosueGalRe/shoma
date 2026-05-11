import type { InvitesRouteCopy } from './-invites-types'

export function readInvitesRouteCopy(): InvitesRouteCopy {
  return {
    title: 'Invites route extracted',
    body: 'Invite controls are still hosted in the lobby route while the Connected route is split into nested pages.',
    cta: 'Open Lobby',
  }
}
