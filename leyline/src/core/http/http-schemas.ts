import { Result, Schema } from 'effect'

export const ConduitOpenDataSchema = Schema.Struct({
  headers: Schema.optional(Schema.Record(Schema.String, Schema.String)),
  query: Schema.optional(Schema.Record(Schema.String, Schema.String)),
  request: Schema.optional(Schema.instanceOf(Request)),
})

export const StartRuntimeOptionsSchema = Schema.Struct({
  databasePath: Schema.optional(Schema.String),
  keepAliveIntervalMs: Schema.optional(Schema.Number),
  port: Schema.optional(Schema.Number),
})

export const TokenPayloadSchema = Schema.Struct({
  code: Schema.optional(Schema.String),
})

type UnknownRecord = Record<string, unknown>

export class MissingPublicKeyError extends Schema.TaggedErrorClass<MissingPublicKeyError>()(
  'MissingPublicKeyError',
  {},
) {}

export class MissingTokenToCheckError extends Schema.TaggedErrorClass<MissingTokenToCheckError>()(
  'MissingTokenToCheckError',
  {},
) {}

export class MissingConduitAuthError extends Schema.TaggedErrorClass<MissingConduitAuthError>()(
  'MissingConduitAuthError',
  {},
) {}

export class TokenMissingCodeError extends Schema.TaggedErrorClass<TokenMissingCodeError>()(
  'TokenMissingCodeError',
  {},
) {}

export const RegisterBodySchema = Schema.Struct({ pubkey: Schema.String })
export const CheckQuerySchema = Schema.Struct({ token: Schema.String })
export const ConduitAuthSchema = Schema.Struct({
  publicKey: Schema.String,
  token: Schema.String,
})
export const TokenCodeSchema = Schema.Struct({ code: Schema.String })

export const UnknownRecordSchema = Schema.Record(Schema.String, Schema.Unknown)
export const RequestSchema = Schema.instanceOf(Request)

export type ConduitAuth = typeof ConduitAuthSchema.Type

export function decodeRecord(value: unknown): UnknownRecord | null {
  const result = Schema.decodeUnknownResult(UnknownRecordSchema)(value)

  return Result.isSuccess(result) ? result.success : null
}

export function decodeRegisterBody(value: unknown): string | MissingPublicKeyError {
  const result = Schema.decodeUnknownResult(RegisterBodySchema)(value)

  return Result.isSuccess(result) ? result.success.pubkey : new MissingPublicKeyError({})
}

export function decodeCheckQuery(value: unknown): string | MissingTokenToCheckError {
  const result = Schema.decodeUnknownResult(CheckQuerySchema)(value)

  return Result.isSuccess(result) ? result.success.token : new MissingTokenToCheckError({})
}

export function decodeConduitAuth(value: unknown): ConduitAuth | MissingConduitAuthError {
  const result = Schema.decodeUnknownResult(ConduitAuthSchema)(value)

  return Result.isSuccess(result) ? result.success : new MissingConduitAuthError({})
}

export function decodeTokenCode(value: unknown): string | TokenMissingCodeError {
  const result = Schema.decodeUnknownResult(TokenCodeSchema)(value)

  return Result.isSuccess(result) ? result.success.code : new TokenMissingCodeError({})
}

export function decodeRequest(value: unknown): Request | null {
  const result = Schema.decodeUnknownResult(RequestSchema)(value)

  return Result.isSuccess(result) ? result.success : null
}

export function filterStringRecord(value: unknown): Record<string, string> | null {
  const record = decodeRecord(value)
  if (!record) {
    return null
  }

  const strings: Record<string, string> = {}
  for (const [key, raw] of Object.entries(record)) {
    if (typeof raw === 'string') {
      strings[key] = raw
    }
  }

  return strings
}

export function readConduitOpenShape(value: unknown): typeof ConduitOpenDataSchema.Type {
  const record = decodeRecord(value)
  if (!record) {
    return {}
  }

  const query = filterStringRecord(record.query)
  const headers = filterStringRecord(record.headers)
  const request = decodeRequest(record.request)

  return {
    ...(query ? { query } : {}),
    ...(headers ? { headers } : {}),
    ...(request ? { request } : {}),
  }
}
