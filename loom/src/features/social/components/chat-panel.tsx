import { Send } from 'lucide-react'
import { useRef } from 'react'

import { Avatar, Button, Input } from '@/components/ui'
import { cn } from '@/lib/utils'

import type { Friend } from '../lib/group-friends'
import { formatMessageTime, profileIconUrl, statusDotClasses, useTranslatedStatusLabels } from './social-utils'

interface ChatMessage {
  friendId: string
  id: string
  isOutgoing: boolean
  senderName?: string
  text: string
  timestamp: number
  type: string
}

interface ChatPanelProps {
  selectedFriend: Friend | null
  ddragonVersion: string | undefined
  hasConversation: boolean
  selectedMessages: ChatMessage[]
  draftMessage: string
  setDraftMessage: (message: string) => void
  handleSendMessage: (event: { preventDefault: () => void }) => void
  isSending: boolean
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
  const statusLabels = useTranslatedStatusLabels()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (event: React.FormEvent) => {
    handleSendMessage(event)
    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }

  return (
    <div className='flex h-full min-h-0 flex-col overflow-hidden'>
      <div className='border-border border-b px-4 py-3'>
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
                <span className={cn('h-2 w-2 rounded-full', statusDotClasses[selectedFriend.status])} />
                {statusLabels[selectedFriend.status]}
              </div>
            </div>
          </div>
        ) : (
          <div className='text-muted text-sm'>Select a friend to start chatting.</div>
        )}
      </div>

      <div
        className={cn(
          'min-h-0 flex-1 overflow-y-auto p-4',
          selectedFriend && hasConversation && selectedMessages.length > 0 ? 'flex flex-col-reverse gap-3' : 'space-y-3',
        )}
      >
        {!selectedFriend ? (
          <div className='border-border bg-secondary/40 text-muted rounded-sm border border-dashed p-5 text-center text-sm'>
            Choose a friend from the friends list to open a conversation.
          </div>
        ) : !hasConversation ? (
          <div className='border-border bg-secondary/40 text-muted rounded-sm border border-dashed p-5 text-center text-sm'>
            No conversation available.
          </div>
        ) : selectedMessages.length === 0 ? (
          <div className='border-border bg-secondary/40 text-muted rounded-sm border border-dashed p-5 text-center text-sm'>
            No messages yet. Send the first one.
          </div>
        ) : (
          selectedMessages.map((message) => {
            const isSystem =
              message.type === 'system' ||
              message.text?.startsWith('joined_') ||
              message.text?.startsWith('left_') ||
              message.text?.startsWith('invited_')

            if (isSystem) {
              const action = message.text.replace(/_/g, ' ')
              let label = action

              const isRawAction =
                message.text === 'joined_room' || message.text === 'left_room' || message.text.startsWith('invited_')
              if (isRawAction) {
                const name = message.senderName || selectedFriend?.name
                label = name ? `${name} ${action}` : action
              }

              return (
                <div key={message.id} className='flex justify-center py-2'>
                  <span className='text-muted text-xs tracking-wide uppercase'>{label}</span>
                </div>
              )
            }

            return (
              <div key={message.id} className={cn('flex', message.isOutgoing ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[85%] rounded-sm border px-3 py-2 text-sm',
                    message.isOutgoing
                      ? 'border-primary bg-secondary text-foreground'
                      : 'border-border bg-secondary text-muted',
                  )}
                >
                  <p>{message.text}</p>
                  <time className='text-muted mt-1 block text-[0.65rem] tracking-wide uppercase'>
                    {formatMessageTime(message.timestamp)}
                  </time>
                </div>
              </div>
            )
          })
        )}
      </div>

      <form onSubmit={handleSubmit} className='border-border flex gap-2 border-t p-3'>
        <Input
          ref={inputRef}
          value={draftMessage}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => setDraftMessage(event.target.value)}
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
