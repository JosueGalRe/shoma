import { LcuHttpMethod, LcuPaths, type LcuHttpMethodValue, type LcuResult } from '@mimic/protocol-contract'

import { mapLcuGameflowPhase, type GameflowPhase, type LcuGameflowPhase } from './gameflow-store'

export type TransitionSource = 'local' | 'lcu' | 'recovery' | 'system'

export type TransitionValidation = {
  ok: true
} | {
  error: Error
  ok: false
}

export type TransitionResult = TransitionValidation & {
  from: GameflowPhase
  to: GameflowPhase
}

export type LcuGameflowRequest = <TContent = unknown>(
  path: string,
  method?: LcuHttpMethodValue,
  body?: unknown,
) => Promise<LcuResult<TContent>>

export type GameflowHydrators = {
  champSelect?: (session: unknown) => void
  queue?: (state: unknown) => void
  readyCheck?: (state: unknown) => void
}

export type ReconstructedGameflowState = {
  phase: GameflowPhase
  rawPhase: LcuGameflowPhase | null | undefined
}

export const validGameflowTransitions = {
  champSelect: ['inGame', 'postGame', 'lobby', 'connected', 'disconnected', 'error'],
  connected: ['lobby', 'disconnected', 'error'],
  connecting: ['connected', 'disconnected', 'error'],
  disconnected: ['connecting', 'connected', 'error'],
  error: ['connecting', 'connected', 'disconnected'],
  inGame: ['postGame', 'lobby', 'connected', 'disconnected', 'error'],
  lobby: ['queue', 'connected', 'disconnected', 'error'],
  postGame: ['lobby', 'connected', 'disconnected', 'error'],
  queue: ['readyCheck', 'lobby', 'connected', 'disconnected', 'error'],
  readyCheck: ['champSelect', 'queue', 'connected', 'disconnected', 'error'],
} satisfies Record<GameflowPhase, GameflowPhase[]>

const preloadChampSelectPaths = [
  LcuPaths.champSelect.pickableChampionIds,
  LcuPaths.champSelect.bannableChampionIds,
  LcuPaths.champSelect.session,
] as const

function isSuccessfulResult(result: LcuResult): boolean {
  return result.status >= 200 && result.status < 300
}

function isAuthoritativeSource(source: TransitionSource): boolean {
  return source === 'lcu' || source === 'recovery'
}

function createTransitionError(from: GameflowPhase, to: GameflowPhase): Error {
  return new Error(`Invalid gameflow transition from "${from}" to "${to}".`)
}

export function validateTransition(from: GameflowPhase, to: GameflowPhase, source: TransitionSource = 'local'): TransitionValidation {
  if (from === to) {
    return { ok: true }
  }

  if (isAuthoritativeSource(source) && to !== 'connecting') {
    return { ok: true }
  }

  if ((validGameflowTransitions[from] as readonly GameflowPhase[]).includes(to)) {
    return { ok: true }
  }

  return { error: createTransitionError(from, to), ok: false }
}

export async function preloadChampSelectData(request: LcuGameflowRequest): Promise<LcuResult[]> {
  const results = await Promise.all(preloadChampSelectPaths.map((path) => request(path, LcuHttpMethod.GET)))
  const failed = results.find((result) => !isSuccessfulResult(result))

  if (failed) {
    throw new Error(`Failed to preload champ select data before ready check (${failed.status}).`)
  }

  return results
}

export async function transitionGameflow(
  from: GameflowPhase,
  to: GameflowPhase,
  options: {
    request?: LcuGameflowRequest
    source?: TransitionSource
  } = {},
): Promise<TransitionResult> {
  const validation = validateTransition(from, to, options.source ?? 'local')
  if (!validation.ok) {
    return { ...validation, from, to }
  }

  if (to === 'readyCheck' && options.request) {
    await preloadChampSelectData(options.request)
  }

  return { from, ok: true, to }
}

export async function reconstructGameflowState(options: {
  hydrators?: GameflowHydrators
  request: LcuGameflowRequest
  setPhase?: (phase: GameflowPhase) => void
}): Promise<ReconstructedGameflowState> {
  const phaseResult = await options.request<LcuGameflowPhase>(LcuPaths.gameflow.phase, LcuHttpMethod.GET)
  if (!isSuccessfulResult(phaseResult)) {
    throw new Error(`Failed to reconstruct gameflow phase from LCU (${phaseResult.status}).`)
  }

  const phase = mapLcuGameflowPhase(phaseResult.content)

  if (phase === 'queue' && options.hydrators?.queue) {
    const queueResult = await options.request(LcuPaths.matchmaking.search, LcuHttpMethod.GET)
    if (isSuccessfulResult(queueResult)) {
      options.hydrators.queue(queueResult.content)
    }
  }

  if (phase === 'readyCheck' && options.hydrators?.readyCheck) {
    await preloadChampSelectData(options.request)
    const readyCheckResult = await options.request(LcuPaths.matchmaking.readyCheck, LcuHttpMethod.GET)
    if (isSuccessfulResult(readyCheckResult)) {
      options.hydrators.readyCheck(readyCheckResult.content)
    }
  }

  if (phase === 'champSelect' && options.hydrators?.champSelect) {
    const champSelectResult = await options.request(LcuPaths.champSelect.session, LcuHttpMethod.GET)
    if (isSuccessfulResult(champSelectResult)) {
      options.hydrators.champSelect(champSelectResult.content)
    }
  }

  options.setPhase?.(phase)

  return { phase, rawPhase: phaseResult.content }
}
