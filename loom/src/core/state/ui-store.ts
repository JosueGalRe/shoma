import { create } from 'zustand'

// The chat Social has open, by the friend's id or the team's conversation id; who it's with stays while it slides away
export interface OpenChat {
  id: string | null
  kind: 'clash' | 'friend'
  open: boolean
}

export interface UiStoreState {
  isLobbyInviteOverlayOpen: boolean
  isSocialOpen: boolean
  openChat: OpenChat
}

export interface UiStoreActions {
  setLobbyInviteOverlayOpen: (open: boolean) => void
  setOpenChat: (chat: OpenChat) => void
  setSocialOpen: (open: boolean) => void
}

export type UiStore = UiStoreState & UiStoreActions

type UiStoreSelector<T> = (state: UiStore) => T

export const initialUiStoreState: UiStoreState = {
  isLobbyInviteOverlayOpen: false,
  isSocialOpen: false,
  openChat: { id: null, kind: 'friend', open: false },
}

export function selectIsLobbyInviteOverlayOpen(state: UiStore): boolean {
  return state.isLobbyInviteOverlayOpen
}

export function selectIsSocialOpen(state: UiStore): boolean {
  return state.isSocialOpen
}

export function selectIsChatOpen(state: UiStore): boolean {
  return state.openChat.open
}

export function selectOpenChat(state: UiStore): OpenChat {
  return state.openChat
}

export function selectSetOpenChat(state: UiStore): UiStoreActions['setOpenChat'] {
  return state.setOpenChat
}

export function selectSetLobbyInviteOverlayOpen(state: UiStore): UiStoreActions['setLobbyInviteOverlayOpen'] {
  return state.setLobbyInviteOverlayOpen
}

export function selectSetSocialOpen(state: UiStore): UiStoreActions['setSocialOpen'] {
  return state.setSocialOpen
}

export const uiStoreSelectors = {
  isChatOpen: selectIsChatOpen,
  isLobbyInviteOverlayOpen: selectIsLobbyInviteOverlayOpen,
  isSocialOpen: selectIsSocialOpen,
  openChat: selectOpenChat,
  setLobbyInviteOverlayOpen: selectSetLobbyInviteOverlayOpen,
  setOpenChat: selectSetOpenChat,
  setSocialOpen: selectSetSocialOpen,
} satisfies Record<string, UiStoreSelector<unknown>>

export const useUiStore = create<UiStore>()((set) => {
  return {
    ...initialUiStoreState,
    setLobbyInviteOverlayOpen(open) {
      set({ isLobbyInviteOverlayOpen: open })
    },
    setOpenChat(chat) {
      set({ openChat: chat })
    },
    setSocialOpen(open) {
      set({ isSocialOpen: open })
    },
  }
})
