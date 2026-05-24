import type { ChatPanelProps } from '../social-types'
import { chatPanelStyles } from '../social-styles'
import { ChatPanelHeader } from './chat-panel-header'
import { ChatPanelMessageList } from './chat-panel-message-list'
import { ChatPanelForm } from './chat-panel-form'

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

  return (
    <div className={styles.root()}>
      <ChatPanelHeader
        selectedFriend={selectedFriend}
        ddragonVersion={ddragonVersion}
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

