import type { RiftClientState } from '@core/rift/rift-client-types'

export interface UseLobbyRuntimeResourcesOptions {
  i18nResolvedLanguage: string | undefined
  queueErrors: Array<{ errorType?: string; penaltyTimeRemaining?: number }> | undefined
  appendLog: (message: string) => void
  client: { send: (payload: string) => Promise<void> } | null
  setPeer: (version: string | null, name: string | null) => void
  status: RiftClientState | null
}
