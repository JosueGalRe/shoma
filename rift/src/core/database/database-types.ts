import { Schema } from 'effect'

export const ConduitInstanceRowSchema = Schema.Struct({
  code: Schema.String,
  public_key: Schema.String,
})
export type ConduitInstanceRow = typeof ConduitInstanceRowSchema.Type

export const CountRowSchema = Schema.Struct({
  count: Schema.Number,
})
export type CountRow = typeof CountRowSchema.Type
