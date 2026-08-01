import { createPersistedStore } from '@/core/state/create-persisted-store'
import { isRecord } from '@/lib/type-guards'

import { isCompleteConnectCode } from './connect-utils'

const MAX_RECENT_SESSIONS = 5

export interface RecentSession {
  code: string
  deviceName: string | null
}

export interface RecentSessionsStoreState {
  recentSessions: RecentSession[]
}

export interface RecentSessionsStoreActions {
  addRecentSession: (code: string) => void
  clearRecentSessions: () => void
  removeRecentSession: (code: string) => void
  setRecentSessionDeviceName: (code: string, deviceName: string) => void
}

export type RecentSessionsStore = RecentSessionsStoreState & RecentSessionsStoreActions

function normalizeRecentCode(code: string): string {
  return code.trim()
}

function isRecentSession(value: unknown): value is RecentSession {
  if (!isRecord(value)) {
    return false
  }

  const isValidCode = typeof value.code === 'string' && isCompleteConnectCode(normalizeRecentCode(value.code))
  const isValidName = value.deviceName === null || value.deviceName === undefined || typeof value.deviceName === 'string'

  return isValidCode && isValidName
}

function createRecentSessions(sessions: RecentSession[], nextCode: string): RecentSession[] {
  const normalizedCode = normalizeRecentCode(nextCode)

  if (!isCompleteConnectCode(normalizedCode)) {
    return sessions
  }

  const existing = sessions.find((session) => {
    return session.code === normalizedCode
  })

  return [
    { code: normalizedCode, deviceName: existing?.deviceName ?? null },
    ...sessions.filter((session) => {
      return session.code !== normalizedCode
    }),
  ].slice(0, MAX_RECENT_SESSIONS)
}

function readPersistedRecentSessions(persistedState: unknown): Pick<RecentSessionsStoreState, 'recentSessions'> {
  const state = isRecord(persistedState) ? persistedState : undefined

  if (Array.isArray(state?.recentSessions)) {
    return {
      recentSessions: state.recentSessions
        .flatMap((session) => {
          if (!isRecentSession(session)) {
            return []
          }

          return [{ code: normalizeRecentCode(session.code), deviceName: session.deviceName ?? null }]
        })
        .slice(0, MAX_RECENT_SESSIONS),
    }
  }

  // Ponytail: v1 persisted plain code strings; device names fill in on the next successful connect
  const legacyCodes = Array.isArray(state?.recentCodes) ? state.recentCodes : []

  return {
    recentSessions: legacyCodes
      .flatMap((code) => {
        if (typeof code !== 'string' || !isCompleteConnectCode(normalizeRecentCode(code))) {
          return []
        }

        return [{ code: normalizeRecentCode(code), deviceName: null }]
      })
      .slice(0, MAX_RECENT_SESSIONS),
  }
}

export const useRecentSessionsStore = createPersistedStore<RecentSessionsStore>(
  (set) => {
    return {
      addRecentSession(code) {
        set((state) => {
          return { recentSessions: createRecentSessions(state.recentSessions, code) }
        })
      },
      clearRecentSessions() {
        set({ recentSessions: [] })
      },
      recentSessions: [],
      removeRecentSession(code) {
        const normalizedCode = normalizeRecentCode(code)

        set((state) => {
          return {
            recentSessions: state.recentSessions.filter((session) => {
              return session.code !== normalizedCode
            }),
          }
        })
      },
      setRecentSessionDeviceName(code, deviceName) {
        const normalizedCode = normalizeRecentCode(code)
        const trimmedName = deviceName.trim()

        if (trimmedName.length === 0) {
          return
        }

        set((state) => {
          return {
            recentSessions: state.recentSessions.map((session) => {
              return session.code === normalizedCode ? { ...session, deviceName: trimmedName } : session
            }),
          }
        })
      },
    }
  },
  {
    migrate: readPersistedRecentSessions,
    name: 'shoma:recent-sessions',
    partialize: ({ recentSessions }) => {
      return { recentSessions }
    },
    storage: 'localStorage',
    version: 2,
  },
)

export function addRecentSession(code: string): void {
  useRecentSessionsStore.getState().addRecentSession(code)
}

export function getRecentSessions(): RecentSession[] {
  return [...useRecentSessionsStore.getState().recentSessions]
}

export function removeRecentSession(code: string): void {
  useRecentSessionsStore.getState().removeRecentSession(code)
}

export function setRecentSessionDeviceName(code: string, deviceName: string): void {
  useRecentSessionsStore.getState().setRecentSessionDeviceName(code, deviceName)
}

export function clearRecentSessions(): void {
  useRecentSessionsStore.getState().clearRecentSessions()
}
