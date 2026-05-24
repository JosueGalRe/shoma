export const READY_CHECK_PENDING_STATUS = 'pending' as const
export const READY_CHECK_ACCEPTED_STATUS = 'accepted' as const
export const READY_CHECK_DECLINED_STATUS = 'declined' as const
export const READY_CHECK_EXPIRED_STATUS = 'expired' as const

export const READY_CHECK_STATUSES = {
  ACCEPTED: READY_CHECK_ACCEPTED_STATUS,
  DECLINED: READY_CHECK_DECLINED_STATUS,
  EXPIRED: READY_CHECK_EXPIRED_STATUS,
  PENDING: READY_CHECK_PENDING_STATUS,
} as const

export type ReadyCheckStatus = (typeof READY_CHECK_STATUSES)[keyof typeof READY_CHECK_STATUSES]

export const RELAY_IDLE_STATUS = 'idle' as const
export const RELAY_CONNECTING_STATUS = 'connecting' as const
export const RELAY_CONNECTED_STATUS = 'connected' as const
export const RELAY_DISCONNECTED_STATUS = 'disconnected' as const
export const RELAY_ERROR_STATUS = 'error' as const

export const RELAY_STATUSES = {
  CONNECTED: RELAY_CONNECTED_STATUS,
  CONNECTING: RELAY_CONNECTING_STATUS,
  DISCONNECTED: RELAY_DISCONNECTED_STATUS,
  ERROR: RELAY_ERROR_STATUS,
  IDLE: RELAY_IDLE_STATUS,
} as const

export type RelayStatus = (typeof RELAY_STATUSES)[keyof typeof RELAY_STATUSES]

export const SOCIAL_ONLINE_STATUS = 'online' as const
export const SOCIAL_AWAY_STATUS = 'away' as const
export const SOCIAL_OFFLINE_STATUS = 'offline' as const

export const SOCIAL_STATUSES = {
  AWAY: SOCIAL_AWAY_STATUS,
  OFFLINE: SOCIAL_OFFLINE_STATUS,
  ONLINE: SOCIAL_ONLINE_STATUS,
} as const

export type SocialStatus = (typeof SOCIAL_STATUSES)[keyof typeof SOCIAL_STATUSES]
