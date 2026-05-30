import { createPersistedStore } from '@/core/state/create-persisted-store'

import { isCompleteConnectCode } from './connect-utils'

const MAX_RECENT_SESSIONS = 5

export interface RecentSessionsStoreState {
  recentCodes: string[]
}

export interface RecentSessionsStoreActions {
  addRecentSession: (code: string) => void
  clearRecentSessions: () => void
  removeRecentSession: (code: string) => void
}

export type RecentSessionsStore = RecentSessionsStoreState & RecentSessionsStoreActions

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeRecentCode(code: string): string {
  return code.trim()
}

function createRecentCodes(codes: string[], nextCode: string): string[] {
  const normalizedCode = normalizeRecentCode(nextCode)

  if (!isCompleteConnectCode(normalizedCode)) {
    return codes
  }

  return [
    normalizedCode,
    ...codes.filter((code) => {
      return code !== normalizedCode
    }),
  ].slice(0, MAX_RECENT_SESSIONS)
}

function readPersistedRecentCodes(persistedState: unknown): Pick<RecentSessionsStoreState, 'recentCodes'> {
  const state = isRecord(persistedState) ? persistedState : undefined
  const recentCodes = Array.isArray(state?.recentCodes) ? state.recentCodes : []

  return {
    recentCodes: recentCodes
      .filter((code): code is string => {
        return typeof code === 'string' && isCompleteConnectCode(normalizeRecentCode(code))
      })
      .map(normalizeRecentCode)
      .slice(0, MAX_RECENT_SESSIONS),
  }
}

export const useRecentSessionsStore = createPersistedStore<RecentSessionsStore>(
  (set) => {
    return {
      addRecentSession(code) {
        set((state) => {
          return { recentCodes: createRecentCodes(state.recentCodes, code) }
        })
      },
      clearRecentSessions() {
        set({ recentCodes: [] })
      },
      recentCodes: [],
      removeRecentSession(code) {
        const normalizedCode = normalizeRecentCode(code)

        set((state) => {
          return {
            recentCodes: state.recentCodes.filter((recentCode) => {
              return recentCode !== normalizedCode
            }),
          }
        })
      },
    }
  },
  {
    migrate: readPersistedRecentCodes,
    name: 'shoma:recent-sessions',
    partialize: ({ recentCodes }) => {
      return { recentCodes }
    },
    storage: 'localStorage',
    version: 1,
  },
)

export function addRecentSession(code: string): void {
  useRecentSessionsStore.getState().addRecentSession(code)
}

export function getRecentSessions(): string[] {
  return [...useRecentSessionsStore.getState().recentCodes]
}

export function removeRecentSession(code: string): void {
  useRecentSessionsStore.getState().removeRecentSession(code)
}

export function clearRecentSessions(): void {
  useRecentSessionsStore.getState().clearRecentSessions()
}
