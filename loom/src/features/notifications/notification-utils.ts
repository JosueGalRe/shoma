import { i18n } from '@/i18n'

import type { NotificationEvent } from './notification-types'
import type { NotificationTemplate } from './notification-types'

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
  }
}

export const notificationTemplates: Record<NotificationEvent, NotificationTemplate> = {
  'invite-received': {
    bodyKey: 'notifications.inviteReceived.body',
    titleKey: 'notifications.inviteReceived.title',
    vibrate: [120, 60, 120],
  },
  'match-found': {
    bodyKey: 'notifications.matchFound.body',
    titleKey: 'notifications.matchFound.title',
    vibrate: [200, 100, 200],
  },
  'ready-check': {
    bodyKey: 'notifications.readyCheck.body',
    titleKey: 'notifications.readyCheck.title',
    vibrate: [200, 100, 200],
  },
  'your-turn-pick': { bodyKey: 'notifications.yourTurnPick.body', titleKey: 'notifications.yourTurnPick.title', vibrate: 100 },
  'your-turn-ban': { bodyKey: 'notifications.yourTurnBan.body', titleKey: 'notifications.yourTurnBan.title', vibrate: 100 },
  'low-timer': { bodyKey: 'notifications.lowTimer.body', titleKey: 'notifications.lowTimer.title', vibrate: [50] },
  'queue-started': { bodyKey: 'notifications.queueStarted.body', titleKey: 'notifications.queueStarted.title', vibrate: [80] },
  'queue-cancelled': {
    bodyKey: 'notifications.queueCancelled.body',
    titleKey: 'notifications.queueCancelled.title',
    vibrate: [40],
  },
}

let audioUnlocked = false
let audioUnlockListenersRegistered = false

export function isIOSDevice(): boolean {
  return typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)
}

export function getAudioContextConstructor(): typeof AudioContext | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }

  return window.AudioContext ?? window.webkitAudioContext
}

export function unlockAudio(): void {
  if (audioUnlocked) {
    return
  }

  const AudioContextConstructor = getAudioContextConstructor()

  if (!AudioContextConstructor) {
    return
  }

  const audioContext = new AudioContextConstructor()
  void audioContext
    .resume()
    .then(() => {
      audioUnlocked = true
    })
    .catch(() => {})
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
  if (typeof Audio === 'undefined') {
    return
  }

  if (isIOSDevice() && !audioUnlocked) {
    return
  }

  const audio = new Audio('/queue-pop.mp3')
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

  new Notification(title, options)
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
