import { create } from 'zustand'

export interface UiStoreState {
  isLobbyInviteOverlayOpen: boolean
  isSocialOpen: boolean
}

export interface UiStoreActions {
  setLobbyInviteOverlayOpen: (open: boolean) => void
  setSocialOpen: (open: boolean) => void
}

export type UiStore = UiStoreState & UiStoreActions

type UiStoreSelector<T> = (state: UiStore) => T

export const initialUiStoreState: UiStoreState = {
  isLobbyInviteOverlayOpen: false,
  isSocialOpen: false,
}

export function selectIsLobbyInviteOverlayOpen(state: UiStore): boolean {
  return state.isLobbyInviteOverlayOpen
}

export function selectIsSocialOpen(state: UiStore): boolean {
  return state.isSocialOpen
}

export function selectSetLobbyInviteOverlayOpen(state: UiStore): UiStoreActions['setLobbyInviteOverlayOpen'] {
  return state.setLobbyInviteOverlayOpen
}

export function selectSetSocialOpen(state: UiStore): UiStoreActions['setSocialOpen'] {
  return state.setSocialOpen
}

export const uiStoreSelectors = {
  isLobbyInviteOverlayOpen: selectIsLobbyInviteOverlayOpen,
  isSocialOpen: selectIsSocialOpen,
  setLobbyInviteOverlayOpen: selectSetLobbyInviteOverlayOpen,
  setSocialOpen: selectSetSocialOpen,
} satisfies Record<string, UiStoreSelector<boolean | ((open: boolean) => void)>>

export const useUiStore = create<UiStore>()((set) => {
  return {
    ...initialUiStoreState,
    setLobbyInviteOverlayOpen(open) {
      set({ isLobbyInviteOverlayOpen: open })
    },
    setSocialOpen(open) {
      set({ isSocialOpen: open })
    },
  }
})
