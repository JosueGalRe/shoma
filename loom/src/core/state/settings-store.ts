import { isRecord } from '@/lib/type-guards'

import { createPersistedStore, readLegacyLocalStorageValue } from './create-persisted-store'

export type SettingsTheme = 'light' | 'dark' | 'system'

export interface SettingsStoreState {
  showOfflineGroup: boolean
  theme: SettingsTheme
}

export interface SettingsStoreActions {
  setShowOfflineGroup: (showOfflineGroup: boolean) => void
  setTheme: (theme: SettingsTheme) => void
}

export type SettingsStore = SettingsStoreState & SettingsStoreActions

export const initialSettingsStoreState: SettingsStoreState = {
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
  const state = isRecord(persistedState) ? persistedState : undefined

  return {
    showOfflineGroup:
      typeof state?.showOfflineGroup === 'boolean'
        ? state.showOfflineGroup
        : (readLegacyShowOfflineGroup() ?? initialSettingsStoreState.showOfflineGroup),
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
      setShowOfflineGroup(showOfflineGroup) {
        set({ showOfflineGroup })
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
        showOfflineGroup: state.showOfflineGroup,
        theme: state.theme,
      }
    },
    storage: 'localStorage',
    version: 2,
  },
)
