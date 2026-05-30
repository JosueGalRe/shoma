/// <reference types="vite/client" />

declare const __GIT_COMMIT_SHORT__: string
declare const __GIT_COMMIT_URL__: string

declare module 'virtual:pwa-register' {
  export interface RegisterSWOptions {
    immediate?: boolean
    onNeedRefresh?: () => void
    onOfflineReady?: () => void
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void
    onRegisterError?: (error: Error) => void
  }

  export function registerSW(options?: RegisterSWOptions): () => Promise<void>
}
