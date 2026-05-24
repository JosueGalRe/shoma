import type { NotificationEvent } from './notification-types'
import {
  notificationTemplates,
  playMatchFoundAudio,
  hasNotificationApi,
  registerAudioUnlockListeners,
  showNotification,
  translateNotification,
  vibrate,
} from './notification-utils'

registerAudioUnlockListeners()

export { showNotification, vibrate } from './notification-utils'

export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!hasNotificationApi()) {
    return Promise.resolve('denied')
  }

  if (Notification.permission !== 'default') {
    return Promise.resolve(Notification.permission)
  }

  return Notification.requestPermission()
}

export function notify(event: NotificationEvent, data: Record<string, string> = {}): void {
  const template = notificationTemplates[event]
  const translated = translateNotification(event, data)

  showNotification(translated.title, { body: translated.body, tag: event })
  vibrate(template.vibrate)

  if (event === 'match-found') {
    playMatchFoundAudio()
  }
}
