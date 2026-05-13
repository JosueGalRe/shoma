import { useTranslation } from 'react-i18next'

import type { FriendStatus } from '../social-store'

export function useTranslatedStatusLabels() {
  const { t } = useTranslation()
  return {
    away: t('social.status.away'),
    offline: t('social.status.offline'),
    online: t('social.status.online'),
  }
}

export function translateGroupName(group: string, t: (key: string) => string): string {
  if (group === '__offline__') {
    return t('social.group.offline')
  }
  const cleaned = group.replace(/^\*+/, '').trim()
  const normalized = cleaned.toUpperCase()
  if (normalized === 'DEFAULT' || normalized === 'GENERAL') {
    return t('social.group.default')
  }
  return cleaned
}

export const statusDotClasses: Record<FriendStatus, string> = {
  away: 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.45)]',
  offline: 'bg-lol-text-muted',
  online: 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.45)]',
}

export function profileIconUrl(version: string | undefined, iconId?: number): string | undefined {
  if (!version || iconId === undefined || iconId < 0) {
    return undefined
  }

  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${iconId}.png`
}

const messageTimeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
})

export function formatMessageTime(timestamp: number): string {
  return messageTimeFormatter.format(timestamp)
}
