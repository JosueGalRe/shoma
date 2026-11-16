import { useTranslation } from 'react-i18next'

import { useChatParticipants } from '../hooks/use-chat-participants'
import { clashTeamTitle } from '../lib/clash-teams'

import { FriendRow } from './friend-row'

import type { ClashTeamRowProps } from '../social-types'

// The client's Clash roster entry, drawn as a friend row: the team's logo, its name and who is in its chat now
export function ClashTeamRow({ onSelect, team, unread }: ClashTeamRowProps) {
  const { t } = useTranslation()
  const online = useChatParticipants(team.conversationId).length

  return (
    <FriendRow
      iconUrl={team.logoUrl}
      name={clashTeamTitle(team, t('social.clash.pending'))}
      online={false}
      status={online > 0 ? t('social.clash.online', { count: online }) : ''}
      unread={unread}
      onSelect={onSelect}
    />
  )
}
