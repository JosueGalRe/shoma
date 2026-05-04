import { i18n } from '@/i18n'

export type NotificationEvent =
  | 'invite-received'
  | 'match-found'
  | 'ready-check'
  | 'your-turn-pick'
  | 'your-turn-ban'
  | 'low-timer'
  | 'queue-started'
  | 'queue-cancelled'

type NotificationTemplate = {
  bodyKey: string
  titleKey: string
  vibrate?: number | number[]
}

const notificationTemplates: Record<NotificationEvent, NotificationTemplate> = {
  'invite-received': { bodyKey: 'notifications.inviteReceived.body', titleKey: 'notifications.inviteReceived.title', vibrate: [120, 60, 120] },
  'match-found': { bodyKey: 'notifications.matchFound.body', titleKey: 'notifications.matchFound.title', vibrate: [200, 100, 200] },
  'ready-check': { bodyKey: 'notifications.readyCheck.body', titleKey: 'notifications.readyCheck.title', vibrate: [200, 100, 200] },
  'your-turn-pick': { bodyKey: 'notifications.yourTurnPick.body', titleKey: 'notifications.yourTurnPick.title', vibrate: 100 },
  'your-turn-ban': { bodyKey: 'notifications.yourTurnBan.body', titleKey: 'notifications.yourTurnBan.title', vibrate: 100 },
  'low-timer': { bodyKey: 'notifications.lowTimer.body', titleKey: 'notifications.lowTimer.title', vibrate: [50] },
  'queue-started': { bodyKey: 'notifications.queueStarted.body', titleKey: 'notifications.queueStarted.title', vibrate: [80] },
  'queue-cancelled': { bodyKey: 'notifications.queueCancelled.body', titleKey: 'notifications.queueCancelled.title', vibrate: [40] },
}

function hasNotificationApi(): boolean {
  return typeof Notification !== 'undefined'
}

function hasVibrateApi(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
}

export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!hasNotificationApi()) {
    console.warn('[notifications] Notification API is not available.')
    return Promise.resolve('denied')
  }

  if (Notification.permission !== 'default') {
    return Promise.resolve(Notification.permission)
  }

  return Notification.requestPermission()
}

export function showNotification(title: string, options: NotificationOptions = {}): void {
  if (!hasNotificationApi()) {
    console.warn('[notifications] Notification API is not available.', title)
    return
  }

  if (Notification.permission !== 'granted') {
    console.warn('[notifications] Notification permission is not granted.', title)
    return
  }

  new Notification(title, options)
}

export function vibrate(pattern: number | number[] = 80): void {
  if (!hasVibrateApi()) {
    return
  }

  navigator.vibrate(pattern)
}

export function notify(event: NotificationEvent, data: Record<string, string> = {}): void {
  const template = notificationTemplates[event]
  const title = i18n.t(template.titleKey, data)
  const body = i18n.t(template.bodyKey, data)

  showNotification(title, { body, tag: event })
  vibrate(template.vibrate)
}
