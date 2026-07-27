import { useTranslation } from 'react-i18next'

import type { Friend, SocialChatMessage } from '../social-types'

interface MapChatMessagesContext {
  activeConversation: { participantNames: string[]; participantPuuids: string[] } | undefined
  currentUserPuuid: string | undefined
  friends: Friend[]
}

export function mapChatMessages(
  messages: { body: string; fromPuuid: string; id: string; timestamp: number; type: string }[],
  context: MapChatMessagesContext,
): SocialChatMessage[] {
  const { activeConversation, currentUserPuuid, friends } = context

  return messages.flatMap((msg) => {
    if (isChatSystemMessage({ text: msg.body, type: msg.type })) {
      return []
    }

    const sender = friends.find((friend) => {
      return matchesPuuid(friend.id, msg.fromPuuid)
    })
    const participantIndex = activeConversation?.participantPuuids.indexOf(msg.fromPuuid)
    const participantName =
      participantIndex !== undefined && participantIndex >= 0
        ? activeConversation?.participantNames[participantIndex]
        : undefined

    return [
      {
        friendId: msg.fromPuuid,
        id: msg.id,
        isOutgoing: msg.fromPuuid === currentUserPuuid,
        senderIconId: sender?.iconId,
        senderName: sender?.name ?? participantName,
        text: msg.body,
        timestamp: msg.timestamp,
        type: msg.type,
      },
    ]
  })
}

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

export function useTranslatedInviteStateLabels() {
  const { t } = useTranslation()

  return {
    Accepted: t('social.inviteState.accepted'),
    Declined: t('social.inviteState.declined'),
    Kicked: t('social.inviteState.kicked'),
    Pending: t('social.inviteState.pending'),
  }
}

export function isFriendInvitable(friend: Pick<Friend, 'activity' | 'isOnMobile' | 'product' | 'status'>): boolean {
  if (friend.status === 'offline' || friend.isOnMobile) {
    return false
  }

  if (friend.product && friend.product !== 'league_of_legends') {
    return false
  }

  return friend.activity !== 'in-game' && friend.activity !== 'champ-select' && friend.activity !== 'in-queue'
}

const PRODUCT_LABELS: Record<string, string> = {
  lor: 'Legends of Runeterra',
  tft: 'Teamfight Tactics',
  valorant: 'VALORANT',
}

export function readProductLabel(product: string): string {
  return PRODUCT_LABELS[product] ?? product
}

export function readFriendStatusDetail(
  friend: Pick<Friend, 'gameMode' | 'isOnMobile' | 'product'>,
  labels: { activityLabel: string | undefined; riotMobileLabel: string; statusLabel: string },
): string {
  if (labels.activityLabel) {
    return friend.gameMode ? `${labels.activityLabel} · ${friend.gameMode}` : labels.activityLabel
  }

  if (friend.isOnMobile) {
    return labels.riotMobileLabel
  }

  if (friend.product && friend.product !== 'league_of_legends') {
    return readProductLabel(friend.product)
  }

  return labels.statusLabel
}

export function isChatSystemMessage(message: { text: string; type: string }): boolean {
  return (
    message.type === 'system' ||
    message.text.startsWith('joined_') ||
    message.text.startsWith('left_') ||
    message.text.startsWith('invited_')
  )
}

export function matchesPuuid(friendId: string, participantId: string): boolean {
  // Handles mismatched formats: puuid@region vs bare puuid
  const [friendNormalized = ''] = friendId.split('@')
  const [participantNormalized = ''] = participantId.split('@')

  return friendNormalized === participantNormalized || friendId === participantId
}

export function readConversationTitle(conversation: { name?: string; participantNames: string[] }): string | undefined {
  const name = conversation.name?.trim()

  if (name) {
    return name
  }

  return conversation.participantNames.length > 0 ? conversation.participantNames.join(', ') : undefined
}

export function findFriendForConversation(
  conversation: { id: string; participantNames: string[]; participantPuuids: string[] },
  friends: Friend[],
): Friend | undefined {
  if (conversation.participantPuuids.length > 2) {
    return undefined
  }

  return friends.find((friend) => {
    if (matchesPuuid(friend.id, conversation.id)) {
      return true
    }

    const matchesParticipant = conversation.participantPuuids.some((participantId) => {
      return matchesPuuid(friend.id, participantId)
    })

    if (matchesParticipant) {
      return true
    }

    return conversation.participantNames.length <= 2 && conversation.participantNames.includes(friend.name)
  })
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

export function readCurrentUserPuuid(currentSummoner: Record<string, unknown> | null | undefined): string | undefined {
  if (!currentSummoner) {
    return undefined
  }

  return typeof currentSummoner.puuid === 'string' ? currentSummoner.puuid : undefined
}
