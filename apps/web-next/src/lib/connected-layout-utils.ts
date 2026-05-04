export type ConnectedNavItem = {
  labelKey: 'lobby.title' | 'queue.title' | 'readyCheck.title' | 'invites.title' | 'champSelect.title' | 'swiftplay.title'
  to: string
  icon?: string
}

export function readConnectedNavItems(): ConnectedNavItem[] {
  return [
    {
      labelKey: 'lobby.title',
      to: '/connected/lobby',
    },
    {
      labelKey: 'swiftplay.title',
      to: '/connected/swiftplay',
    },
    {
      labelKey: 'queue.title',
      to: '/connected/queue',
    },
    {
      labelKey: 'readyCheck.title',
      to: '/connected/ready-check',
    },
    {
      labelKey: 'invites.title',
      to: '/connected/invites',
    },
    {
      labelKey: 'champSelect.title',
      to: '/connected/champ-select',
    },
  ]
}

export function isRouteActive(currentPath: string, targetPath: string): boolean {
  return currentPath.startsWith(targetPath)
}
