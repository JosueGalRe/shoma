import { create } from 'zustand'

export interface UiStoreState {
  isLobbyInviteOverlayOpen: boolean
  isSocialDrawerOpen: boolean
}

export interface UiStoreActions {
  setLobbyInviteOverlayOpen: (open: boolean) => void
  setSocialDrawerOpen: (open: boolean) => void
  toggleSocialDrawer: () => void
}

export type UiStore = UiStoreState & UiStoreActions

type UiStoreSelector<T> = (state: UiStore) => T

export const initialUiStoreState: UiStoreState = {
  isLobbyInviteOverlayOpen: false,
  isSocialDrawerOpen: false,
}

export function selectIsLobbyInviteOverlayOpen(state: UiStore): boolean {
  return state.isLobbyInviteOverlayOpen
}

export function selectIsSocialDrawerOpen(state: UiStore): boolean {
  return state.isSocialDrawerOpen
}

export function selectSetLobbyInviteOverlayOpen(state: UiStore): UiStoreActions['setLobbyInviteOverlayOpen'] {
  return state.setLobbyInviteOverlayOpen
}

export function selectSetSocialDrawerOpen(state: UiStore): UiStoreActions['setSocialDrawerOpen'] {
  return state.setSocialDrawerOpen
}

export function selectToggleSocialDrawer(state: UiStore): UiStoreActions['toggleSocialDrawer'] {
  return state.toggleSocialDrawer
}

export const uiStoreSelectors = {
  isLobbyInviteOverlayOpen: selectIsLobbyInviteOverlayOpen,
  isSocialDrawerOpen: selectIsSocialDrawerOpen,
  setLobbyInviteOverlayOpen: selectSetLobbyInviteOverlayOpen,
  setSocialDrawerOpen: selectSetSocialDrawerOpen,
  toggleSocialDrawer: selectToggleSocialDrawer,
} satisfies Record<string, UiStoreSelector<boolean | ((open: boolean) => void) | (() => void)>>

export const useUiStore = create<UiStore>()((set) => {
  return {
    ...initialUiStoreState,
    setLobbyInviteOverlayOpen(open) {
      set({ isLobbyInviteOverlayOpen: open })
    },
    setSocialDrawerOpen(open) {
      set({ isSocialDrawerOpen: open })
    },
    toggleSocialDrawer() {
      set((state) => {
        return { isSocialDrawerOpen: !state.isSocialDrawerOpen }
      })
    },
  }
})
