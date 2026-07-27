import { create } from 'zustand'

import { useSettingsStore } from '@/core/state/settings-store'

import type { Friend, SocialStore, SocialStoreState } from './social-types'

export type { ChatMessage, Friend, FriendActivity, FriendStatus, SocialStoreActions, SocialStoreState } from './social-types'

type InviteToLobbyHandler = (friend: Friend) => void

let inviteToLobbyHandler: InviteToLobbyHandler | null = null

export function setSocialInviteToLobbyHandler(handler: InviteToLobbyHandler | null) {
  inviteToLobbyHandler = handler
}

export const initialSocialStoreState: SocialStoreState = {
  error: null,
  messages: [],
  selectedFriendId: null,
  showOfflineGroup: useSettingsStore.getState().showOfflineGroup,
}

export const useSocialStore = create<SocialStore>()((set) => {
  return {
    ...initialSocialStoreState,
    addMessage(message) {
      set((state) => {
        return {
          messages: [...state.messages, message],
        }
      })
    },
    clearMessages() {
      set({ messages: [] })
    },
    inviteToLobby(friend) {
      inviteToLobbyHandler?.(friend)
    },
    selectFriend(friendId) {
      set({ selectedFriendId: friendId })
    },
    setError(error) {
      set({ error })
    },
    setShowOfflineGroup(value) {
      useSettingsStore.getState().setShowOfflineGroup(value)
    },
    toggleShowOfflineGroup() {
      const { setShowOfflineGroup, showOfflineGroup } = useSettingsStore.getState()

      setShowOfflineGroup(!showOfflineGroup)
    },
  }
})

useSettingsStore.subscribe((state, previousState) => {
  if (state.showOfflineGroup === previousState.showOfflineGroup) {
    return
  }

  useSocialStore.setState({ showOfflineGroup: state.showOfflineGroup })
})
