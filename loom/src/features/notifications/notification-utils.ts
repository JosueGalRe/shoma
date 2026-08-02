import { i18n } from '@/i18n'

import type { NotificationEvent, NotificationTemplate } from './notification-types'

export const notificationTemplates: Record<NotificationEvent, NotificationTemplate> = {
  'invite-received': {
    bodyKey: 'notifications.inviteReceived.body',
    titleKey: 'notifications.inviteReceived.title',
    vibrate: [120, 60, 120],
  },
  'low-timer': { bodyKey: 'notifications.lowTimer.body', titleKey: 'notifications.lowTimer.title', vibrate: [50] },
  'match-found': {
    bodyKey: 'notifications.matchFound.body',
    titleKey: 'notifications.matchFound.title',
    vibrate: [200, 100, 200],
  },
  'queue-cancelled': {
    bodyKey: 'notifications.queueCancelled.body',
    titleKey: 'notifications.queueCancelled.title',
    vibrate: [40],
  },
  'queue-started': { bodyKey: 'notifications.queueStarted.body', titleKey: 'notifications.queueStarted.title', vibrate: [80] },
  'ready-check': {
    bodyKey: 'notifications.readyCheck.body',
    titleKey: 'notifications.readyCheck.title',
    vibrate: [200, 100, 200],
  },
  'your-turn-ban': { bodyKey: 'notifications.yourTurnBan.body', titleKey: 'notifications.yourTurnBan.title', vibrate: 100 },
  'your-turn-pick': { bodyKey: 'notifications.yourTurnPick.body', titleKey: 'notifications.yourTurnPick.title', vibrate: 100 },
}

let audioUnlocked = false
let audioUnlockListenersRegistered = false

export function isIOSDevice(): boolean {
  return typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)
}

let queuePopAudio: HTMLAudioElement | null = null

function getQueuePopAudio(): HTMLAudioElement | null {
  if (typeof Audio === 'undefined') {
    return null
  }

  queuePopAudio ??= new Audio('/queue-pop.mp3')

  return queuePopAudio
}

export function unlockAudio(): void {
  if (audioUnlocked) {
    return
  }

  const audio = getQueuePopAudio()

  if (!audio) {
    return
  }

  // IOS requires unlocking the exact element that will later play: a muted
  // Play/pause inside the user gesture marks it as user-activated.
  audioUnlocked = true
  audio.muted = true

  void audio
    .play()
    .then(() => {
      audio.pause()
      audio.currentTime = 0
      audio.muted = false
    })
    .catch(() => {
      audio.muted = false
    })
}

export function registerAudioUnlockListeners(): void {
  if (audioUnlockListenersRegistered || typeof document === 'undefined') {
    return
  }

  document.addEventListener('click', unlockAudio, { once: true })
  document.addEventListener('touchstart', unlockAudio, { once: true, passive: true })
  audioUnlockListenersRegistered = true
}

export function playMatchFoundAudio(): void {
  const audio = getQueuePopAudio()

  if (!audio || (isIOSDevice() && !audioUnlocked)) {
    return
  }

  audio.currentTime = 0

  void audio.play().catch(() => {})
}

export function hasNotificationApi(): boolean {
  return typeof Notification !== 'undefined'
}

export function hasVibrateApi(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
}

export function canVibrate(): boolean {
  return (typeof document === 'undefined' || !document.hidden) && hasVibrateApi()
}

export function showNotification(title: string, options: NotificationOptions = {}): void {
  if (!hasNotificationApi()) {
    return
  }

  if (Notification.permission !== 'granted') {
    return
  }

  const notification = new Notification(title, options)

  void notification
}

export function vibrate(pattern: number | number[] = 80): void {
  if (!canVibrate()) {
    return
  }

  try {
    navigator.vibrate?.(pattern)
  } catch {
    return
  }
}

export function translateNotification(
  event: NotificationEvent,
  data: Record<string, string> = {},
): { body: string; title: string } {
  const template = notificationTemplates[event]

  return {
    body: i18n.t(template.bodyKey, data),
    title: i18n.t(template.titleKey, data),
  }
}
