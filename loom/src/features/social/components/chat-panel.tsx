import { chatPanelStyles } from '../social-styles'

import { ChatPanelForm } from './chat-panel-form'
import { ChatPanelHeader } from './chat-panel-header'
import { ChatPanelMessageList } from './chat-panel-message-list'

import type { ChatPanelProps } from '../social-types'

export function ChatPanel({
  selectedFriend,
  conversationTitle,
  ddragonVersion,
  hasConversation,
  onBack,
  selectedMessages,
  draftMessage,
  setDraftMessage,
  handleSendMessage,
  isSending,
}: ChatPanelProps) {
  const styles = chatPanelStyles()

  return (
    <div className={styles.root()}>
      <ChatPanelHeader
        selectedFriend={selectedFriend}
        conversationTitle={conversationTitle}
        ddragonVersion={ddragonVersion}
        onBack={onBack}
        styles={styles}
      />

      <ChatPanelMessageList
        selectedFriend={selectedFriend}
        hasConversation={hasConversation}
        selectedMessages={selectedMessages}
        styles={styles}
      />

      <ChatPanelForm
        selectedFriend={selectedFriend}
        hasConversation={hasConversation}
        draftMessage={draftMessage}
        setDraftMessage={setDraftMessage}
        handleSendMessage={handleSendMessage}
        isSending={isSending}
        styles={styles}
      />
    </div>
  )
}
