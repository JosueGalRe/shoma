import type { FormEvent } from 'react'

import type { Friend } from '../social-types'

export interface ChatPanelFormProps {
  selectedFriend: Friend | null
  hasConversation: boolean
  draftMessage: string
  setDraftMessage: (message: string) => void
  handleSendMessage: (event: FormEvent<HTMLFormElement>) => void
  isSending: boolean
  styles: {
    form: () => string
    formInput: () => string
  }
}
