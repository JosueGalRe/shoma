import { isRecord } from '@/lib/type-guards'

import { createPersistedStore } from './create-persisted-store'

export type SettingsTheme = 'light' | 'dark' | 'system'

// The friend list's options live in the client (/lol-chat/v1/settings), not here
export interface SettingsStoreState {
  theme: SettingsTheme
}

export interface SettingsStoreActions {
  setTheme: (theme: SettingsTheme) => void
}

export type SettingsStore = SettingsStoreState & SettingsStoreActions

export const initialSettingsStoreState: SettingsStoreState = {
  theme: 'system',
}

function migrateSettingsStore(persistedState: unknown): Partial<SettingsStoreState> {
  const state = isRecord(persistedState) ? persistedState : undefined

  return {
    theme:
      state?.theme === 'light' || state?.theme === 'dark' || state?.theme === 'system'
        ? state.theme
        : initialSettingsStoreState.theme,
  }
}

export const useSettingsStore = createPersistedStore<SettingsStore>(
  (set) => {
    return {
      ...initialSettingsStoreState,
      setTheme(theme) {
        set({ theme })
      },
    }
  },
  {
    migrate: migrateSettingsStore,
    name: 'shoma:settings',
    partialize: (state) => {
      return {
        theme: state.theme,
      }
    },
    storage: 'localStorage',
    version: 2,
  },
)
