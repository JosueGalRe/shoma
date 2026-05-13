import { Schema } from 'effect'

export const ConduitOpenDataSchema = Schema.Struct({
  query: Schema.optional(Schema.Record(Schema.String, Schema.String)),
  headers: Schema.optional(Schema.Record(Schema.String, Schema.String)),
  request: Schema.optional(Schema.instanceOf(Request)),
})
export type ConduitOpenData = typeof ConduitOpenDataSchema.Type

export const StartRuntimeOptionsSchema = Schema.Struct({
  port: Schema.optional(Schema.Number),
  databasePath: Schema.optional(Schema.String),
  keepAliveIntervalMs: Schema.optional(Schema.Number),
})
export type StartRuntimeOptions = typeof StartRuntimeOptionsSchema.Type

export const TokenPayloadSchema = Schema.Struct({
  code: Schema.optional(Schema.String),
})
export type TokenPayload = typeof TokenPayloadSchema.Type
