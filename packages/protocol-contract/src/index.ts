import { Schema } from 'effect'

export const RelayOpcode = {
  CLOSE: 3,
  CONNECT: 4,
  CONNECT_PUBKEY: 5,
  ERROR: 9,
  MSG: 2,
  OPEN: 1,
  RECEIVE: 8,
  REPLY: 7,
  SEND: 6,
} as const

export type RelayOpcode = (typeof RelayOpcode)[keyof typeof RelayOpcode]

export const RelayErrorCode = {
  DESKTOP_DENIED: 'desktop_denied',
  INVALID_CODE: 'invalid_code',
  INVALID_TOKEN: 'invalid_token',
  MALFORMED_MESSAGE: 'malformed_message',
  MISSING_PUBKEY: 'missing_pubkey',
  RELAY_UNREACHABLE: 'relay_unreachable',
  SERVER_ERROR: 'server_error',
  SESSION_EXPIRED: 'session_expired',
  UNKNOWN: 'unknown',
} as const

export type RelayErrorCode =
  | 'invalid_code'
  | 'desktop_denied'
  | 'relay_unreachable'
  | 'invalid_token'
  | 'missing_pubkey'
  | 'session_expired'
  | 'malformed_message'
  | 'server_error'
  | 'unknown'

export interface RelayErrorPayload {
  code: RelayErrorCode
  message?: string
}

export type RelayErrorFrame = [typeof RelayOpcode.ERROR, RelayErrorPayload]

export const MobileOpcode = {
  REQUEST: 7,
  RESPONSE: 8,
  SECRET: 1,
  SECRET_RESPONSE: 2,
  SUBSCRIBE: 5,
  UNSUBSCRIBE: 6,
  UPDATE: 9,
  VERSION: 3,
  VERSION_RESPONSE: 4,
} as const

export type MobileOpcode = (typeof MobileOpcode)[keyof typeof MobileOpcode]

export type RelayFrame = [RelayOpcode, ...unknown[]]
export type MobileFrame = [MobileOpcode, ...unknown[]]

export const LcuHttpMethodSchema = Schema.Literals(['DELETE', 'GET', 'PATCH', 'POST', 'PUT'])

export const RelayOpcodeSchema = Schema.Literals([
  RelayOpcode.OPEN,
  RelayOpcode.MSG,
  RelayOpcode.CLOSE,
  RelayOpcode.CONNECT,
  RelayOpcode.CONNECT_PUBKEY,
  RelayOpcode.SEND,
  RelayOpcode.REPLY,
  RelayOpcode.RECEIVE,
  RelayOpcode.ERROR,
])

export const RelayErrorCodeSchema = Schema.Literals([
  RelayErrorCode.INVALID_CODE,
  RelayErrorCode.DESKTOP_DENIED,
  RelayErrorCode.RELAY_UNREACHABLE,
  RelayErrorCode.INVALID_TOKEN,
  RelayErrorCode.MISSING_PUBKEY,
  RelayErrorCode.SESSION_EXPIRED,
  RelayErrorCode.MALFORMED_MESSAGE,
  RelayErrorCode.SERVER_ERROR,
  RelayErrorCode.UNKNOWN,
])

export const RelayErrorPayloadSchema = Schema.Struct({
  code: RelayErrorCodeSchema,
  message: Schema.optional(Schema.String),
})

export const RelayErrorFrameSchema = Schema.Tuple([Schema.Literal(RelayOpcode.ERROR), RelayErrorPayloadSchema])

export const MobileOpcodeSchema = Schema.Literals([
  MobileOpcode.SECRET,
  MobileOpcode.SECRET_RESPONSE,
  MobileOpcode.VERSION,
  MobileOpcode.VERSION_RESPONSE,
  MobileOpcode.SUBSCRIBE,
  MobileOpcode.UNSUBSCRIBE,
  MobileOpcode.REQUEST,
  MobileOpcode.RESPONSE,
  MobileOpcode.UPDATE,
])

export const RelayFrameSchema = Schema.Tuple([RelayOpcodeSchema, Schema.Unknown])
export const MobileFrameSchema = Schema.Tuple([MobileOpcodeSchema, Schema.Unknown])

export { LcuPathPatterns, LcuPaths } from './lcu/lcu-paths'
export { LcuHttpMethod } from './lcu/lcu-types'
export type {
  LcuChampSelectActionPatchBody,
  LcuChampSelectMySelectionPatchBody,
  LcuHttpMethodValue,
  LcuLobbyInvitationBody,
  LcuLobbyPositionPreferencesBody,
  LcuLobbyQueueBody,
  LcuObserver,
  LcuPerksPageCreateBody,
  LcuPerksPageUpdateBody,
  LcuQuickplayPlayerSlot,
  LcuQuickplayPlayerSlotsBody,
  LcuResult,
} from './lcu/lcu-types'
export type {
  EndpointsWithMethod,
  HttpMethod,
  LcuBody,
  LCUEndpoint,
  LCUEndpointBodyType,
  LCUEndpointResponseType,
  LCUEndpoints,
  LcuParams,
  LcuResponse,
  LCUTypes,
  TypedLcuPath,
} from './lcu/typed-endpoints'

export const LcuLobbyQueueBodySchema = Schema.Struct({
  queueId: Schema.Number,
})

export const LcuLobbyInvitationBodySchema = Schema.Struct({
  toSummonerId: Schema.Number,
})

export const LcuLobbyPositionPreferencesBodySchema = Schema.Struct({
  firstPreference: Schema.String,
  secondPreference: Schema.String,
})

export const LcuQuickplayPlayerSlotSchema = Schema.Struct({
  championId: Schema.Number,
  perks: Schema.String,
  positionPreference: Schema.String,
  skinId: Schema.Number,
  spell1: Schema.Number,
  spell2: Schema.Number,
})

export const LcuQuickplayPlayerSlotsBodySchema = Schema.Array(LcuQuickplayPlayerSlotSchema)

export const LcuChampSelectMySelectionPatchBodySchema = Schema.Struct({
  selectedSkinId: Schema.optional(Schema.Number),
  spell1Id: Schema.optional(Schema.Number),
  spell2Id: Schema.optional(Schema.Number),
})

export const LcuChampSelectActionPatchBodySchema = Schema.Struct({
  championId: Schema.Number,
  completed: Schema.optional(Schema.Boolean),
})

export const LcuPerksPageCreateBodySchema = Schema.Struct({
  name: Schema.String,
  primaryStyleId: Schema.Number,
  secondaryStyleId: Schema.Number,
  selectedPerkIds: Schema.Array(Schema.Number),
})

export const LcuPerksPageUpdateBodySchema = Schema.Record(Schema.String, Schema.Unknown)

export { TypedLcuPaths } from './lcu/typed-endpoints'

export type { LcuEventPayload, LCUWebSocketEvents } from './lcu/typed-events'

export { LcuEventNames } from './lcu/typed-events'

export { LiveClientPaths } from './live-client/live-client-paths'
