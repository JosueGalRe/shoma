import type { ConduitOpenDataSchema, StartRuntimeOptionsSchema, TokenPayloadSchema } from './http-schemas'

export type ConduitOpenData = typeof ConduitOpenDataSchema.Type
export type StartRuntimeOptions = typeof StartRuntimeOptionsSchema.Type
export type TokenPayload = typeof TokenPayloadSchema.Type
