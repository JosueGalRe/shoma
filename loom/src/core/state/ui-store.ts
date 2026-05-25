import { create } from 'zustand'

export interface UiStoreState {
  isLobbyInviteOverlayOpen: boolean
  isLobbyInviteSheetOpen: boolean
  isLobbyRoleSheetOpen: boolean
  isSocialDrawerOpen: boolean
}

export interface UiStoreActions {
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

export function selectIsLobbyInviteOverlayOpen(state: UiStore): boolean {
  return state.isLobbyInviteOverlayOpen
}

export function selectIsLobbyInviteSheetOpen(state: UiStore): boolean {
  return state.isLobbyInviteSheetOpen
}

export function selectIsLobbyRoleSheetOpen(state: UiStore): boolean {
  return state.isLobbyRoleSheetOpen
}

export function selectIsSocialDrawerOpen(state: UiStore): boolean {
  return state.isSocialDrawerOpen
}

export function selectSetLobbyInviteOverlayOpen(state: UiStore): UiStoreActions['setLobbyInviteOverlayOpen'] {
  return state.setLobbyInviteOverlayOpen
}

export function selectSetLobbyInviteSheetOpen(state: UiStore): UiStoreActions['setLobbyInviteSheetOpen'] {
  return state.setLobbyInviteSheetOpen
}

export function selectSetLobbyRoleSheetOpen(state: UiStore): UiStoreActions['setLobbyRoleSheetOpen'] {
  return state.setLobbyRoleSheetOpen
}

export function selectSetSocialDrawerOpen(state: UiStore): UiStoreActions['setSocialDrawerOpen'] {
  return state.setSocialDrawerOpen
}

export function selectToggleSocialDrawer(state: UiStore): UiStoreActions['toggleSocialDrawer'] {
  return state.toggleSocialDrawer
}

export const uiStoreSelectors = {
  isLobbyInviteOverlayOpen: selectIsLobbyInviteOverlayOpen,
  isLobbyInviteSheetOpen: selectIsLobbyInviteSheetOpen,
  isLobbyRoleSheetOpen: selectIsLobbyRoleSheetOpen,
  isSocialDrawerOpen: selectIsSocialDrawerOpen,
  setLobbyInviteOverlayOpen: selectSetLobbyInviteOverlayOpen,
  setLobbyInviteSheetOpen: selectSetLobbyInviteSheetOpen,
  setLobbyRoleSheetOpen: selectSetLobbyRoleSheetOpen,
  setSocialDrawerOpen: selectSetSocialDrawerOpen,
  toggleSocialDrawer: selectToggleSocialDrawer,
} satisfies Record<string, UiStoreSelector<boolean | ((open: boolean) => void) | (() => void)>>

export const useUiStore = create<UiStore>()((set) => {
  return {
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
      set((state) => {
        return { isSocialDrawerOpen: !state.isSocialDrawerOpen }
      })
    },
  }
})
