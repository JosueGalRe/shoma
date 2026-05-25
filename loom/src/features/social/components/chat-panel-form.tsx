import { type ChangeEvent, type FormEvent, useRef } from 'react'

import { Send } from 'lucide-react'

import { Button, Input } from '@/components/ui'

import type { ChatPanelFormProps } from './chat-panel-form-types'

export function ChatPanelForm({
  selectedFriend,
  hasConversation,
  draftMessage,
  setDraftMessage,
  handleSendMessage,
  isSending,
  styles,
}: ChatPanelFormProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    handleSendMessage(event)

    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form()}>
      <Input
        ref={inputRef}
        value={draftMessage}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          setDraftMessage(event.target.value)
        }}
        placeholder={selectedFriend ? `Message ${selectedFriend.name}` : 'Select a friend'}
        disabled={!selectedFriend || !hasConversation}
        aria-label="Chat message"
      />

      <Button
        type="submit"
        size="icon"
        disabled={!selectedFriend || !hasConversation || draftMessage.trim().length === 0 || isSending}
        aria-label="Send message"
      >
        <Send className="size-4" aria-hidden="true" />
      </Button>
    </form>
  )
}
