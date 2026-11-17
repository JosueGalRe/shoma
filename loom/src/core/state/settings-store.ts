import { isRecord } from '@/lib/type-guards'

import { createPersistedStore } from './create-persisted-store'

import type { LanguageCode } from '@/i18n/i18n-types'

export type SettingsTheme = 'light' | 'dark' | 'system'

// The friend list's options live in the client (/lol-chat/v1/settings), not here
export interface SettingsStoreState {
  // Picked in Settings; null follows the browser's
  language: LanguageCode | null
  theme: SettingsTheme
}

export interface SettingsStoreActions {
  setLanguage: (language: LanguageCode) => void
  setTheme: (theme: SettingsTheme) => void
}

export type SettingsStore = SettingsStoreState & SettingsStoreActions

export const initialSettingsStoreState: SettingsStoreState = {
  language: null,
  theme: 'system',
}

function migrateSettingsStore(persistedState: unknown): Partial<SettingsStoreState> {
  const state = isRecord(persistedState) ? persistedState : undefined

  return {
    language: state?.language === 'en' || state?.language === 'es' ? state.language : null,
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
      setLanguage(language) {
        set({ language })
      },
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
        language: state.language,
        theme: state.theme,
      }
    },
    storage: 'localStorage',
    version: 2,
  },
)
