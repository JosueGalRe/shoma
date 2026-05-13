import type { ConnectedNavItem } from './-connected-layout-types'

export function readConnectedNavItems(): ConnectedNavItem[] {
  return [
    {
      label: 'Lobby',
      to: '/connected/lobby',
    },
    {
      label: 'Queue',
      to: '/connected/queue',
    },
    {
      label: 'Ready Check',
      to: '/connected/ready-check',
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
