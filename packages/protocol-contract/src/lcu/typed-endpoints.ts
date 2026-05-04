export type {
  EndpointsWithMethod,
  HttpMethod,
  LCUEndpoint,
  LCUEndpointBodyType,
  LCUEndpointResponseType,
  LCUEndpoints,
} from '@hasagi/types'

export type * as LCUTypes from '@hasagi/types'

import type { LCUEndpoints } from '@hasagi/types'

export type LcuResponse<Path extends keyof LCUEndpoints, Method extends keyof LCUEndpoints[Path]> =
  LCUEndpoints[Path][Method] extends { response: infer Response } ? Response : never

export type LcuBody<Path extends keyof LCUEndpoints, Method extends keyof LCUEndpoints[Path]> =
  LCUEndpoints[Path][Method] extends { body: infer Body } ? Body : never

export type LcuParams<Path extends keyof LCUEndpoints, Method extends keyof LCUEndpoints[Path]> =
  LCUEndpoints[Path][Method] extends { params: infer Params } ? Params : never

export const TypedLcuPaths = {
  champSelectSession: '/lol-champ-select/v1/session',
  currentSummonerRerollPoints: '/lol-summoner/v1/current-summoner/rerollPoints',
  gameflowSession: '/lol-gameflow/v1/session',
  gameflowPhase: '/lol-gameflow/v1/gameflow-phase',
  lobby: '/lol-lobby/v2/lobby',
  matchmakingSearch: '/lol-matchmaking/v1/search',
  perksPages: '/lol-perks/v1/pages',
} as const

export type TypedLcuPath = (typeof TypedLcuPaths)[keyof typeof TypedLcuPaths]
