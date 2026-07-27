import { ScrollArea } from '@/components/ui'

import { ChatPanel } from './chat-panel'
import { ConversationsList } from './conversations-list'

import type { SocialChatTabProps } from './social-chat-tab-types'

export function SocialChatTab({
  hasOpenConversation,
  hasConversation,
  selectedFriend,
  conversationTitle,
  ddragonVersion,
  onBack,
  selectedMessages,
  draftMessage,
  setDraftMessage,
  handleSendMessage,
  isSending,
  conversationItems,
  handleSelectConversation,
}: SocialChatTabProps) {
  if (hasOpenConversation) {
    return (
      <ChatPanel
        selectedFriend={selectedFriend}
        conversationTitle={conversationTitle}
        ddragonVersion={ddragonVersion}
        hasConversation={hasConversation}
        onBack={onBack}
        selectedMessages={selectedMessages}
        draftMessage={draftMessage}
        setDraftMessage={setDraftMessage}
        handleSendMessage={handleSendMessage}
        isSending={isSending}
      />
    )
  }

  return (
    <ScrollArea className="h-full min-h-0">
      <div className="p-3">
        <ConversationsList
          conversations={conversationItems}
          handleSelectConversation={handleSelectConversation}
          ddragonVersion={ddragonVersion}
        />
      </div>
    </ScrollArea>
  )
}
