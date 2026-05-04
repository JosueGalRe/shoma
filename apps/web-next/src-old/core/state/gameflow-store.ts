import type { QueryClient } from '@tanstack/react-query'
import { LcuHttpMethod, LcuPaths, type LcuHttpMethodValue, type LcuResult } from '@mimic/protocol-contract'
import { create } from 'zustand'

import { queryClient as defaultQueryClient } from '../query/query-client'
import type { ObserverRegistry } from '../rift/observer'

export const gameflowPhases = [
  'disconnected',
  'connecting',
  'connected',
  'lobby',
  'queue',
  'readyCheck',
  'champSelect',
  'inGame',
  'postGame',
  'error',
] as const

export type GameflowPhase = (typeof gameflowPhases)[number]

export type LcuGameflowPhase =
  | 'None'
  | 'Lobby'
  | 'Matchmaking'
  | 'ReadyCheck'
  | 'ChampSelect'
  | 'GameStart'
  | 'InProgress'
  | 'Reconnect'
  | 'WaitingForStats'
  | 'PreEndOfGame'
  | 'EndOfGame'
  | string

type GameflowDependencies = {
  observer?: Pick<ObserverRegistry, 'request' | 'subscribe' | 'onDisconnect' | 'onReconnect'>
  queryClient?: Pick<QueryClient, 'invalidateQueries'>
}

type OptimisticRequestOptions = {
  path: string
  method: LcuHttpMethodValue
  optimisticPhase: GameflowPhase
  body?: unknown
}

export type GameflowStoreState = {
  phase: GameflowPhase
  previousPhase: GameflowPhase | null
  error: Error | null
  isRecovering: boolean
  retryCount: number
}

export type GameflowStoreActions = {
  setPhase: (phase: GameflowPhase) => void
  setPhaseFromLcu: (phase: LcuGameflowPhase | null | undefined) => void
  connect: () => void
  markConnected: () => void
  disconnect: () => void
  setError: (error: unknown) => void
  clearError: () => void
  startQueue: () => Promise<void>
  acceptReadyCheck: () => Promise<void>
  declineReadyCheck: () => Promise<void>
  recoverFromLcu: () => Promise<void>
  bindObserver: () => () => void
  configure: (dependencies: GameflowDependencies) => void
  reset: () => void
}

export type GameflowStore = GameflowStoreState & GameflowStoreActions

const initialGameflowState: GameflowStoreState = {
  error: null,
  isRecovering: false,
  phase: 'disconnected',
  previousPhase: null,
  retryCount: 0,
}

const transientStatusCodes = new Set([408, 425, 429, 500, 502, 503, 504])
const maxRecoveryAttempts = 3
const recoveryRetryDelayMs = 50

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error
  }

  if (typeof error === 'string') {
    return new Error(error)
  }

  return new Error('Gameflow operation failed.')
}

export function mapLcuGameflowPhase(phase: LcuGameflowPhase | null | undefined): GameflowPhase {
  switch (phase) {
    case 'Lobby':
      return 'lobby'
    case 'Matchmaking':
      return 'queue'
    case 'ReadyCheck':
      return 'readyCheck'
    case 'ChampSelect':
      return 'champSelect'
    case 'GameStart':
    case 'InProgress':
    case 'Reconnect':
      return 'inGame'
    case 'WaitingForStats':
    case 'PreEndOfGame':
    case 'EndOfGame':
      return 'postGame'
    case 'None':
    case null:
    case undefined:
      return 'connected'
    default:
      return 'connected'
  }
}

function shouldTreatAsSuccess(result: LcuResult): boolean {
  return result.status >= 200 && result.status < 300
}

function shouldRetry(result: LcuResult): boolean {
  return transientStatusCodes.has(result.status)
}

function createHttpError(path: string, result: LcuResult): Error {
  return new Error(`LCU request failed (${result.status}): ${path}`)
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function invalidateGameflowQueries(queryClient: Pick<QueryClient, 'invalidateQueries'>): void {
  void queryClient.invalidateQueries({ queryKey: ['gameflow'] })
  void queryClient.invalidateQueries({ queryKey: ['lcu', LcuPaths.gameflow.phase] })
  void queryClient.invalidateQueries({ queryKey: ['lcu', LcuPaths.gameflow.session] })
}

export const gameflowSelectors = {
  isChampSelectActive(state: GameflowStoreState): boolean {
    return state.phase === 'champSelect'
  },
  isInLobby(state: GameflowStoreState): boolean {
    return state.phase === 'lobby'
  },
  isInQueue(state: GameflowStoreState): boolean {
    return state.phase === 'queue'
  },
  isReadyCheckActive(state: GameflowStoreState): boolean {
    return state.phase === 'readyCheck'
  },
  canInvite(state: GameflowStoreState): boolean {
    return state.phase === 'lobby'
  },
}

export function createGameflowStore(dependencies: GameflowDependencies = {}) {
  let observer = dependencies.observer
  let queryClient = dependencies.queryClient ?? defaultQueryClient

  function requestWithRecovery<TContent = unknown>(
    path: string,
    method: LcuHttpMethodValue = LcuHttpMethod.GET,
    body?: unknown,
  ): Promise<LcuResult<TContent>> {
    if (!observer) {
      return Promise.reject(new Error('Gameflow observer is not configured.'))
    }

    return observer.request<TContent>(path, method, body)
  }

  return create<GameflowStore>()((set, get) => {
    function commitPhase(phase: GameflowPhase): void {
      set((state) => {
        if (state.phase === phase && state.error === null) {
          return state
        }

        return {
          error: null,
          phase,
          previousPhase: state.phase === phase ? state.previousPhase : state.phase,
        }
      })
      invalidateGameflowQueries(queryClient)
    }

    async function performOptimisticRequest({ path, method, optimisticPhase, body }: OptimisticRequestOptions): Promise<void> {
      const rollbackPhase = get().phase
      commitPhase(optimisticPhase)

      try {
        const result = await requestWithRecovery(path, method, body)
        if (!shouldTreatAsSuccess(result)) {
          throw createHttpError(path, result)
        }
      } catch (error) {
        const operationError = normalizeError(error)
        set({ error: operationError, phase: rollbackPhase, previousPhase: optimisticPhase })
        invalidateGameflowQueries(queryClient)
        await get().recoverFromLcu()
        if (get().phase !== 'error') {
          set({ error: operationError })
        }
      }
    }

    return {
      ...initialGameflowState,
      acceptReadyCheck() {
        return performOptimisticRequest({
          method: LcuHttpMethod.POST,
          optimisticPhase: 'champSelect',
          path: LcuPaths.matchmaking.readyCheckAccept,
        })
      },
      bindObserver() {
        if (!observer) {
          throw new Error('Gameflow observer is not configured.')
        }

        const unsubscribePhase = observer.subscribe<LcuGameflowPhase>(LcuPaths.gameflow.phase, (phase) => {
          get().setPhaseFromLcu(phase)
        })
        const unsubscribeDisconnect = observer.onDisconnect(() => {
          get().disconnect()
        })
        const unsubscribeReconnect = observer.onReconnect(() => {
          get().markConnected()
          void get().recoverFromLcu()
        })

        void get().recoverFromLcu()

        return () => {
          unsubscribePhase()
          unsubscribeDisconnect()
          unsubscribeReconnect()
        }
      },
      clearError() {
        set({ error: null })
      },
      configure(nextDependencies) {
        observer = nextDependencies.observer ?? observer
        queryClient = nextDependencies.queryClient ?? queryClient
      },
      connect() {
        commitPhase('connecting')
      },
      declineReadyCheck() {
        return performOptimisticRequest({
          method: LcuHttpMethod.POST,
          optimisticPhase: 'queue',
          path: LcuPaths.matchmaking.readyCheckDecline,
        })
      },
      disconnect() {
        set({ ...initialGameflowState })
        invalidateGameflowQueries(queryClient)
      },
      async recoverFromLcu() {
        if (!observer) {
          return
        }

        set({ isRecovering: true })

        for (let attempt = 1; attempt <= maxRecoveryAttempts; attempt += 1) {
          try {
            const result = await requestWithRecovery<LcuGameflowPhase>(LcuPaths.gameflow.phase)
            set({ retryCount: attempt - 1 })

            if (shouldTreatAsSuccess(result)) {
              get().setPhaseFromLcu(result.content)
              set({ isRecovering: false })
              return
            }

            if (!shouldRetry(result) || attempt === maxRecoveryAttempts) {
              throw createHttpError(LcuPaths.gameflow.phase, result)
            }
          } catch (error) {
            set({ retryCount: attempt })
            if (attempt === maxRecoveryAttempts) {
              get().setError(error)
              set({ isRecovering: false })
              return
            }
          }

          await wait(recoveryRetryDelayMs)
        }

        set({ isRecovering: false })
      },
      markConnected() {
        commitPhase('connected')
      },
      reset() {
        set({ ...initialGameflowState })
      },
      setError(error) {
        set((state) => ({ error: normalizeError(error), phase: 'error', previousPhase: state.phase }))
        invalidateGameflowQueries(queryClient)
      },
      setPhase(phase) {
        commitPhase(phase)
      },
      setPhaseFromLcu(phase) {
        commitPhase(mapLcuGameflowPhase(phase))
      },
      startQueue() {
        return performOptimisticRequest({
          method: LcuHttpMethod.POST,
          optimisticPhase: 'queue',
          path: LcuPaths.lobby.matchmakingSearch,
        })
      },
    }
  })
}

export const useGameflowStore = createGameflowStore()
