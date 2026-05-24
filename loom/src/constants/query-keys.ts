export const LCU_QUERY_KEY = 'lcu' as const
export const DDRAGON_QUERY_KEY = 'ddragon' as const
export const GROUPS_QUERY_KEY = 'groups' as const
export const SESSION_QUERY_KEY = 'session' as const
export const CURRENT_QUERY_KEY = 'current' as const
export const SEARCH_STATE_QUERY_KEY = 'search-state' as const
export const LATEST_VERSION_QUERY_KEY = 'latest-version' as const
export const PROFILE_ICON_QUERY_KEY = 'profile-icon' as const
export const CHAMPIONS_QUERY_KEY = 'champions' as const
export const RUNES_QUERY_KEY = 'runes' as const
export const CHAMPION_DETAIL_QUERY_KEY = 'champion-detail' as const
export const CHAMPION_SKINS_QUERY_KEY = 'champion-skins' as const
export const LOBBY_QUERY_KEY = 'lobby' as const
export const SUMMONERS_QUERY_KEY = 'summoners' as const
export const GAMEFLOW_QUERY_KEY = 'gameflow' as const
export const INVITES_QUERY_KEY = 'invites' as const
export const QUEUE_QUERY_KEY = 'queue' as const
export const QUEUE_SEARCH_QUERY_KEY = 'queue-search' as const
export const READY_CHECK_QUERY_KEY = 'ready-check' as const
export const SENT_INVITES_QUERY_KEY = 'sent-invites' as const

export const QUERY_KEYS = {
  CHAMPION_DETAIL: CHAMPION_DETAIL_QUERY_KEY,
  CHAMPION_SKINS: CHAMPION_SKINS_QUERY_KEY,
  CHAMPIONS: CHAMPIONS_QUERY_KEY,
  CURRENT: CURRENT_QUERY_KEY,
  DDRAGON: DDRAGON_QUERY_KEY,
  GAMEFLOW: GAMEFLOW_QUERY_KEY,
  GROUPS: GROUPS_QUERY_KEY,
  INVITES: INVITES_QUERY_KEY,
  LATEST_VERSION: LATEST_VERSION_QUERY_KEY,
  LCU: LCU_QUERY_KEY,
  LOBBY: LOBBY_QUERY_KEY,
  PROFILE_ICON: PROFILE_ICON_QUERY_KEY,
  QUEUE: QUEUE_QUERY_KEY,
  QUEUE_SEARCH: QUEUE_SEARCH_QUERY_KEY,
  READY_CHECK: READY_CHECK_QUERY_KEY,
  RUNES: RUNES_QUERY_KEY,
  SEARCH_STATE: SEARCH_STATE_QUERY_KEY,
  SENT_INVITES: SENT_INVITES_QUERY_KEY,
  SESSION: SESSION_QUERY_KEY,
  SUMMONERS: SUMMONERS_QUERY_KEY,
} as const

export const queryKeys = {
  championDetail: (championId: string | number) => [DDRAGON_QUERY_KEY, CHAMPION_DETAIL_QUERY_KEY, championId] as const,
  championSkins: (championId: string | number) => [DDRAGON_QUERY_KEY, CHAMPION_SKINS_QUERY_KEY, championId] as const,
  champions: () => [DDRAGON_QUERY_KEY, CHAMPIONS_QUERY_KEY] as const,
  currentSummoner: () => [LCU_QUERY_KEY, 'summoner', CURRENT_QUERY_KEY] as const,
  ddragon: () => [DDRAGON_QUERY_KEY] as const,
  gameflow: () => [GAMEFLOW_QUERY_KEY] as const,
  groups: () => [LCU_QUERY_KEY, GROUPS_QUERY_KEY] as const,
  invites: () => [INVITES_QUERY_KEY] as const,
  latestVersion: () => [DDRAGON_QUERY_KEY, LATEST_VERSION_QUERY_KEY] as const,
  lcu: () => [LCU_QUERY_KEY] as const,
  lobby: () => [LOBBY_QUERY_KEY] as const,
  profileIcon: () => [DDRAGON_QUERY_KEY, PROFILE_ICON_QUERY_KEY] as const,
  queue: () => [QUEUE_QUERY_KEY] as const,
  queueSearch: () => [QUEUE_SEARCH_QUERY_KEY] as const,
  readyCheck: () => [READY_CHECK_QUERY_KEY] as const,
  runes: () => [DDRAGON_QUERY_KEY, RUNES_QUERY_KEY] as const,
  searchState: () => [LCU_QUERY_KEY, SEARCH_STATE_QUERY_KEY] as const,
  sentInvites: () => [SENT_INVITES_QUERY_KEY] as const,
  session: () => [LCU_QUERY_KEY, 'lobby', SESSION_QUERY_KEY] as const,
  summoner: (summonerId: string | number) => [LCU_QUERY_KEY, SUMMONERS_QUERY_KEY, summonerId] as const,
} as const

export type QueryKey = ReturnType<(typeof queryKeys)[keyof typeof queryKeys]>
