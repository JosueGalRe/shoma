import type { SocialChatMessage } from '../social-types'

export function getSystemMessageLabel(message: SocialChatMessage, selectedFriendName?: string): string | null {
  const isSystem =
    message.type === 'system' ||
    message.text.startsWith('joined_') ||
    message.text.startsWith('left_') ||
    message.text.startsWith('invited_')

  if (!isSystem) {
    return null
  }

  const action = message.text.replace(/_/g, ' ')

  if (message.text === 'joined_room' || message.text === 'left_room' || message.text.startsWith('invited_')) {
    const name = message.senderName || selectedFriendName
    return name ? `${name} ${action}` : action
  }

  return action
}
