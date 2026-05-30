import { useCallback, useEffect, useRef, useState } from 'react'

import { readLegacyLocalStorageValue } from '@/core/state/create-persisted-store'

const LAST_SEEN_COMMIT_KEY = 'shoma:last-seen-commit'

export interface UsePwaUpdateResult {
  needsRefresh: boolean
  update: () => void
  dismiss: () => void
}

export function usePwaUpdate(): UsePwaUpdateResult {
  const [needsRefresh, setNeedsRefresh] = useState(false)
  const updateSWRef = useRef<(() => Promise<void>) | undefined>(undefined)

  useEffect(() => {
    let cancelled = false

    async function register(): Promise<void> {
      if (!('serviceWorker' in navigator)) {
        return
      }

      const { registerSW } = await import('virtual:pwa-register')

      if (cancelled) {
        return
      }

      const updateSW = registerSW({
        onNeedRefresh() {
          if (cancelled) {
            return
          }

          const lastSeen = readLegacyLocalStorageValue(LAST_SEEN_COMMIT_KEY)
          const currentCommit = __GIT_COMMIT_SHORT__

          if (lastSeen !== currentCommit) {
            setNeedsRefresh(true)
          }
        },
        onOfflineReady() {
          // No-op: we don't show an offline-ready prompt
        },
      })

      updateSWRef.current = updateSW
    }

    void register()

    return () => {
      cancelled = true
    }
  }, [])

  const update = useCallback(() => {
    try {
      globalThis.localStorage.setItem(LAST_SEEN_COMMIT_KEY, __GIT_COMMIT_SHORT__)
    } catch {
      // Ignore localStorage errors
    }

    void updateSWRef.current?.()
  }, [])

  const dismiss = useCallback(() => {
    try {
      globalThis.localStorage.setItem(LAST_SEEN_COMMIT_KEY, __GIT_COMMIT_SHORT__)
    } catch {
      // Ignore localStorage errors
    }

    setNeedsRefresh(false)
  }, [])

  return { dismiss, needsRefresh, update }
}
