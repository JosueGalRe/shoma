import { create } from 'zustand'

export type UiStoreState = {
  isLobbyInviteOverlayOpen: boolean
  isLobbyInviteSheetOpen: boolean
  isLobbyRoleSheetOpen: boolean
  isSocialDrawerOpen: boolean
}

export type UiStoreActions = {
  setLobbyInviteOverlayOpen: (open: boolean) => void
  setLobbyInviteSheetOpen: (open: boolean) => void
  setLobbyRoleSheetOpen: (open: boolean) => void
  setSocialDrawerOpen: (open: boolean) => void
  toggleSocialDrawer: () => void
}

export type UiStore = UiStoreState & UiStoreActions

type UiStoreSelector<T> = (state: UiStore) => T

export const initialUiStoreState: UiStoreState = {
  isLobbyInviteOverlayOpen: false,
  isLobbyInviteSheetOpen: false,
  isLobbyRoleSheetOpen: false,
  isSocialDrawerOpen: false,
}

export const uiStoreSelectors = {
  isLobbyInviteOverlayOpen: (state) => state.isLobbyInviteOverlayOpen,
  isLobbyInviteSheetOpen: (state) => state.isLobbyInviteSheetOpen,
  isLobbyRoleSheetOpen: (state) => state.isLobbyRoleSheetOpen,
  isSocialDrawerOpen: (state) => state.isSocialDrawerOpen,
  setLobbyInviteOverlayOpen: (state) => state.setLobbyInviteOverlayOpen,
  setLobbyInviteSheetOpen: (state) => state.setLobbyInviteSheetOpen,
  setLobbyRoleSheetOpen: (state) => state.setLobbyRoleSheetOpen,
  setSocialDrawerOpen: (state) => state.setSocialDrawerOpen,
  toggleSocialDrawer: (state) => state.toggleSocialDrawer,
} satisfies Record<string, UiStoreSelector<boolean | ((open: boolean) => void) | (() => void)>>

export const useUiStore = create<UiStore>()((set) => ({
  ...initialUiStoreState,
  setLobbyInviteOverlayOpen(open) {
    set({ isLobbyInviteOverlayOpen: open })
  },
  setLobbyInviteSheetOpen(open) {
    set({ isLobbyInviteSheetOpen: open })
  },
  setLobbyRoleSheetOpen(open) {
    set({ isLobbyRoleSheetOpen: open })
  },
  setSocialDrawerOpen(open) {
    set({ isSocialDrawerOpen: open })
  },
  toggleSocialDrawer() {
    set((state) => ({ isSocialDrawerOpen: !state.isSocialDrawerOpen }))
  },
}))
