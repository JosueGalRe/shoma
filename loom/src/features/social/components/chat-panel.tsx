import { Send } from 'lucide-react'
import { useRef } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

import { Avatar, Button, Input } from '@/components/ui'

import type { ChatPanelProps, SocialChatMessage } from '../social-types'
import { chatMessageBubbleStyles, chatMessageListStyles, chatPanelStyles, socialStatusDotStyles } from '../social-styles'
import { formatMessageTime, profileIconUrl, useTranslatedStatusLabels } from './social-utils'

function getSystemMessageLabel(message: SocialChatMessage, selectedFriendName?: string): string | null {
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

export function ChatPanel({
  selectedFriend,
  ddragonVersion,
  hasConversation,
  selectedMessages,
  draftMessage,
  setDraftMessage,
  handleSendMessage,
  isSending,
}: ChatPanelProps) {
  const styles = chatPanelStyles()
  const statusLabels = useTranslatedStatusLabels()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    handleSendMessage(event)
    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }

  let messageContent = null

  if (!selectedFriend) {
    messageContent = <div className={styles.emptyState()}>Choose a friend from the friends list to open a conversation.</div>
  } else if (!hasConversation) {
    messageContent = <div className={styles.emptyState()}>No conversation available.</div>
  } else if (selectedMessages.length === 0) {
    messageContent = <div className={styles.emptyState()}>No messages yet. Send the first one.</div>
  } else {
    messageContent = selectedMessages.map((message) => {
      const label = getSystemMessageLabel(message, selectedFriend?.name)

      if (label) {
        return (
          <div key={message.id} className={styles.systemMessage()}>
            <span className={styles.systemLabel()}>{label}</span>
          </div>
        )
      }

      return (
        <div key={message.id} className={styles.messageRow()}>
          <div className={chatMessageBubbleStyles({ outgoing: message.isOutgoing })}>
            <p className={styles.messageText()}>{message.text}</p>
            <time className={styles.timestamp()}>{formatMessageTime(message.timestamp)}</time>
          </div>
        </div>
      )
    })
  }

  return (
    <div className={styles.root()}>
      <div className={styles.header()}>
        {selectedFriend ? (
          <div className='flex items-center gap-3'>
            <Avatar
              src={profileIconUrl(ddragonVersion, selectedFriend.iconId)}
              alt={selectedFriend.name}
              status={selectedFriend.status}
              size='sm'
            />
            <div className='min-w-0'>
              <div className='text-foreground truncate text-sm font-semibold'>{selectedFriend.name}</div>
              <div className='text-muted mt-1 flex items-center gap-1.5 text-xs'>
                <span className={socialStatusDotStyles({ status: selectedFriend.status })} />
                {statusLabels[selectedFriend.status]}
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.headerEmpty()}>Select a friend to start chatting.</div>
        )}
      </div>

      <div className={chatMessageListStyles({ active: Boolean(selectedFriend && hasConversation && selectedMessages.length > 0) })}>
        {messageContent}
      </div>

      <form onSubmit={handleSubmit} className={styles.form()}>
        <Input
          ref={inputRef}
          value={draftMessage}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setDraftMessage(event.target.value)}
          placeholder={selectedFriend ? `Message ${selectedFriend.name}` : 'Select a friend'}
          disabled={!selectedFriend || !hasConversation}
          aria-label='Chat message'
        />
        <Button
          type='submit'
          size='icon'
          disabled={!selectedFriend || !hasConversation || draftMessage.trim().length === 0 || isSending}
          aria-label='Send message'
        >
          <Send className='size-4' aria-hidden='true' />
        </Button>
      </form>
    </div>
  )
}
