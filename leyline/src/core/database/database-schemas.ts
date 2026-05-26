import { Schema } from "effect";

export const ConduitInstanceRowSchema = Schema.Struct({
  code: Schema.String,
  public_key: Schema.String,
});

export const CountRowSchema = Schema.Struct({
  count: Schema.Number,
});
