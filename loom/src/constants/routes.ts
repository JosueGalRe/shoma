export const ROOT_ROUTE = '/' as const
export const CONNECTED_ROUTE = '/connected' as const
export const CONNECTED_ARENA_ROUTE = '/connected/arena' as const
export const CONNECTED_CHAMP_SELECT_ROUTE = '/connected/champ-select' as const
export const CONNECTED_CLASH_ROUTE = '/connected/clash' as const
export const CONNECTED_CREATE_LOBBY_ROUTE = '/connected/create-lobby' as const
export const CONNECTED_CUSTOM_ROUTE = '/connected/custom' as const
export const CONNECTED_INVITES_ROUTE = '/connected/invites' as const
export const CONNECTED_LOBBY_ROUTE = '/connected/lobby' as const
export const CONNECTED_QUEUE_ROUTE = '/connected/queue' as const
export const CONNECTED_SWIFTPLAY_ROUTE = '/connected/swiftplay' as const

export const ROUTES = {
  CONNECTED: CONNECTED_ROUTE,
  CONNECTED_ARENA: CONNECTED_ARENA_ROUTE,
  CONNECTED_CHAMP_SELECT: CONNECTED_CHAMP_SELECT_ROUTE,
  CONNECTED_CLASH: CONNECTED_CLASH_ROUTE,
  CONNECTED_CREATE_LOBBY: CONNECTED_CREATE_LOBBY_ROUTE,
  CONNECTED_CUSTOM: CONNECTED_CUSTOM_ROUTE,
  CONNECTED_INVITES: CONNECTED_INVITES_ROUTE,
  CONNECTED_LOBBY: CONNECTED_LOBBY_ROUTE,
  CONNECTED_QUEUE: CONNECTED_QUEUE_ROUTE,
  CONNECTED_SWIFTPLAY: CONNECTED_SWIFTPLAY_ROUTE,
  ROOT: ROOT_ROUTE,
} as const

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES]
