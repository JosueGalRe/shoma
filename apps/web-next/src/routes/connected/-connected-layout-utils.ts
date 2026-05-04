export type ConnectedNavItem = {
  label: string
  to: string
  icon?: string
}

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

export function isRouteActive(currentPath: string, targetPath: string): boolean {
  return currentPath.startsWith(targetPath)
}

