import { useTranslation } from 'react-i18next'

import { readFriendStatusDetail } from '../lib/friend-utils'

import type { Friend } from '../social-types'

export function useTranslatedStatusLabels() {
  const { t } = useTranslation()

  return {
    away: t('social.status.away'),
    busy: t('social.status.busy'),
    offline: t('social.status.offline'),
    online: t('social.status.online'),
  }
}

export function useTranslatedActivityLabels() {
  const { t } = useTranslation()

  return {
    'champ-select': t('social.activity.champSelect'),
    'in-game': t('social.activity.inGame'),
    'in-lobby': t('social.activity.inLobby'),
    'in-queue': t('social.activity.inQueue'),
  }
}

// The line under a friend's name: what they're doing, Riot Mobile, another game or their status. Without the game
// Mode: the friend list only has its raw name ("CLASSIC")
export function useFriendStatusLine() {
  const { t } = useTranslation()
  const statusLabels = useTranslatedStatusLabels()
  const activityLabels = useTranslatedActivityLabels()

  return (friend: Friend) => {
    return readFriendStatusDetail(friend.isOnMobile ? { isOnMobile: true } : { product: friend.product }, {
      activityLabel: friend.activity ? activityLabels[friend.activity] : undefined,
      riotMobileLabel: t('social.status.riotMobile'),
      statusLabel: statusLabels[friend.status],
    })
  }
}
