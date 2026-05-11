import { Schema } from 'effect'

export const RiftOpcode = {
  OPEN: 1,
  MSG: 2,
  CLOSE: 3,
  CONNECT: 4,
  CONNECT_PUBKEY: 5,
  SEND: 6,
  REPLY: 7,
  RECEIVE: 8,
} as const

export type RiftOpcode = (typeof RiftOpcode)[keyof typeof RiftOpcode]

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

export type RiftFrame = [RiftOpcode, ...unknown[]]
export type MobileFrame = [MobileOpcode, ...unknown[]]

export const LcuHttpMethodSchema = Schema.Literal('DELETE', 'GET', 'PATCH', 'POST', 'PUT')

export const RiftOpcodeSchema = Schema.Literal(
  RiftOpcode.OPEN,
  RiftOpcode.MSG,
  RiftOpcode.CLOSE,
  RiftOpcode.CONNECT,
  RiftOpcode.CONNECT_PUBKEY,
  RiftOpcode.SEND,
  RiftOpcode.REPLY,
  RiftOpcode.RECEIVE,
)

export const MobileOpcodeSchema = Schema.Literal(
  MobileOpcode.SECRET,
  MobileOpcode.SECRET_RESPONSE,
  MobileOpcode.VERSION,
  MobileOpcode.VERSION_RESPONSE,
  MobileOpcode.SUBSCRIBE,
  MobileOpcode.UNSUBSCRIBE,
  MobileOpcode.REQUEST,
  MobileOpcode.RESPONSE,
  MobileOpcode.UPDATE,
)

export const RiftFrameSchema = Schema.Tuple([RiftOpcodeSchema], Schema.Unknown)
export const MobileFrameSchema = Schema.Tuple([MobileOpcodeSchema], Schema.Unknown)

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

export const LcuPerksPageUpdateBodySchema = Schema.Record({
  key: Schema.String,
  value: Schema.Unknown,
})

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
