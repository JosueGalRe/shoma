import type { ConnectedNavItem } from './-connected-layout-types'

export function readConnectedNavItems(): ConnectedNavItem[] {
  return [
    {
      label: 'Lobby',
      to: '/connected/lobby',
    },
    {
      label: 'Invites',
      to: '/connected/invites',
    },
    {
      label: 'Champ Select',
      to: '/connected/champ-select',
    },
  ]
}
