export const INVITE_RECEIVED_EVENT = 'invite-received' as const
export const MATCH_FOUND_EVENT = 'match-found' as const
export const READY_CHECK_EVENT = 'ready-check' as const
export const YOUR_TURN_PICK_EVENT = 'your-turn-pick' as const
export const YOUR_TURN_BAN_EVENT = 'your-turn-ban' as const
export const LOW_TIMER_EVENT = 'low-timer' as const
export const QUEUE_STARTED_EVENT = 'queue-started' as const
export const QUEUE_CANCELLED_EVENT = 'queue-cancelled' as const

export const NOTIFICATION_EVENTS = {
  INVITE_RECEIVED: INVITE_RECEIVED_EVENT,
  LOW_TIMER: LOW_TIMER_EVENT,
  MATCH_FOUND: MATCH_FOUND_EVENT,
  QUEUE_CANCELLED: QUEUE_CANCELLED_EVENT,
  QUEUE_STARTED: QUEUE_STARTED_EVENT,
  READY_CHECK: READY_CHECK_EVENT,
  YOUR_TURN_BAN: YOUR_TURN_BAN_EVENT,
  YOUR_TURN_PICK: YOUR_TURN_PICK_EVENT,
} as const

export type NotificationEvent = (typeof NOTIFICATION_EVENTS)[keyof typeof NOTIFICATION_EVENTS]

export const CHAT_MESSAGE_EVENT = 'chat' as const
export const SYSTEM_MESSAGE_EVENT = 'system' as const
export const JOINED_ROOM_MARKER = 'joined_room' as const
export const LEFT_ROOM_MARKER = 'left_room' as const
export const INVITED_ROOM_MARKER = 'invited_room' as const
export const JOINED_ROOM_PREFIX = 'joined_' as const
export const LEFT_ROOM_PREFIX = 'left_' as const
export const INVITED_ROOM_PREFIX = 'invited_' as const

export const CHAT_MARKERS = {
  CHAT: CHAT_MESSAGE_EVENT,
  INVITED_PREFIX: INVITED_ROOM_PREFIX,
  INVITED_ROOM: INVITED_ROOM_MARKER,
  JOINED_PREFIX: JOINED_ROOM_PREFIX,
  JOINED_ROOM: JOINED_ROOM_MARKER,
  LEFT_PREFIX: LEFT_ROOM_PREFIX,
  LEFT_ROOM: LEFT_ROOM_MARKER,
  SYSTEM: SYSTEM_MESSAGE_EVENT,
} as const

export type ChatMarker = (typeof CHAT_MARKERS)[keyof typeof CHAT_MARKERS]
