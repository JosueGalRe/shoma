import { createPersistedStore, readLegacyLocalStorageValue } from './create-persisted-store'

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

  const LEGACY_SHOW_OFFLINE_GROUP_KEY = 'shoma:social:show-offline-group'

function readLegacyShowOfflineGroup(): boolean | undefined {
  const value = readLegacyLocalStorageValue(LEGACY_SHOW_OFFLINE_GROUP_KEY)

  if (value === null) {
    return undefined
  }

  return value === 'true'
}

function migrateSettingsStore(persistedState: unknown): Partial<SettingsStoreState> {
  const state = persistedState as Partial<SettingsStoreState> | undefined

  return {
    language: state?.language ?? initialSettingsStoreState.language,
    showOfflineGroup:
      state?.showOfflineGroup ??
      readLegacyShowOfflineGroup() ??
      initialSettingsStoreState.showOfflineGroup,
    theme: state?.theme ?? initialSettingsStoreState.theme,
  }
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
    name: 'shoma:settings',
    migrate: migrateSettingsStore,
    partialize: (state) => ({
      language: state.language,
      showOfflineGroup: state.showOfflineGroup,
      theme: state.theme,
    }),
    storage: 'localStorage',
    version: 1,
  },
)
