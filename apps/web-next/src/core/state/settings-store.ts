import { createPersistedStore } from './create-persisted-store'

export type SettingsTheme = 'light' | 'dark' | 'system'

export type SettingsStoreState = {
  language: string
  showOfflineGroup: boolean
  theme: SettingsTheme
}

export type SettingsStoreActions = {
  setLanguage: (language: string) => void
  setShowOfflineGroup: (showOfflineGroup: boolean) => void
  setTheme: (theme: SettingsTheme) => void
}

export type SettingsStore = SettingsStoreState & SettingsStoreActions

export const initialSettingsStoreState: SettingsStoreState = {
  language: 'en',
  showOfflineGroup: false,
  theme: 'system',
}

export const useSettingsStore = createPersistedStore<SettingsStore>(
  (set) => ({
    ...initialSettingsStoreState,
    setLanguage(language) {
      set({ language })
    },
    setShowOfflineGroup(showOfflineGroup) {
      set({ showOfflineGroup })
    },
    setTheme(theme) {
      set({ theme })
    },
  }),
  {
    name: 'mimic:settings',
    partialize: (state) => ({
      language: state.language,
      showOfflineGroup: state.showOfflineGroup,
      theme: state.theme,
    }),
    storage: 'localStorage',
    version: 1,
  },
)
