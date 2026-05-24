export type NotificationEvent =
  | 'invite-received'
  | 'match-found'
  | 'ready-check'
  | 'your-turn-pick'
  | 'your-turn-ban'
  | 'low-timer'
  | 'queue-started'
  | 'queue-cancelled'

export type NotificationTemplate = {
  bodyKey: string
  titleKey: string
  vibrate?: number | number[]
}
