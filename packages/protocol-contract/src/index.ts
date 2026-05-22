import { Schema } from 'effect'

export const RelayOpcode = {
  OPEN: 1,
  MSG: 2,
  CLOSE: 3,
  CONNECT: 4,
  CONNECT_PUBKEY: 5,
  SEND: 6,
  REPLY: 7,
  RECEIVE: 8,
  ERROR: 9,
} as const

export type RelayOpcode = (typeof RelayOpcode)[keyof typeof RelayOpcode]

export const RelayErrorCode = {
  INVALID_CODE: 'invalid_code',
  DESKTOP_DENIED: 'desktop_denied',
  RELAY_UNREACHABLE: 'relay_unreachable',
  INVALID_TOKEN: 'invalid_token',
  MISSING_PUBKEY: 'missing_pubkey',
  SESSION_EXPIRED: 'session_expired',
  MALFORMED_MESSAGE: 'malformed_message',
  SERVER_ERROR: 'server_error',
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

export type RelayErrorPayload = {
  code: RelayErrorCode
  message?: string
}

export type RelayErrorFrame = [typeof RelayOpcode.ERROR, RelayErrorPayload]

export const MobileOpcode = {
  SECRET: 1,
  SECRET_RESPONSE: 2,
  VERSION: 3,
  VERSION_RESPONSE: 4,
  SUBSCRIBE: 5,
  UNSUBSCRIBE: 6,
  REQUEST: 7,
  RESPONSE: 8,
  UPDATE: 9,
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
  spell1Id: Schema.optional(Schema.Number),
  spell2Id: Schema.optional(Schema.Number),
  selectedSkinId: Schema.optional(Schema.Number),
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

export type {
  EndpointsWithMethod,
  HttpMethod,
  LCUEndpoint,
  LCUEndpointBodyType,
  LCUEndpointResponseType,
  LCUEndpoints,
  LCUTypes,
  LcuBody,
  LcuParams,
  LcuResponse,
  TypedLcuPath,
} from './lcu/typed-endpoints'

export { TypedLcuPaths } from './lcu/typed-endpoints'

export type { LCUWebSocketEvents, LcuEventPayload } from './lcu/typed-events'

export { LcuEventNames } from './lcu/typed-events'
