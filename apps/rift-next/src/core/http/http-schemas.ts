import { Either, Schema } from 'effect'

import type { ConduitOpenData } from './index-types'

type UnknownRecord = Record<string, unknown>

export class MissingPublicKeyError {
  readonly _tag = 'MissingPublicKeyError' as const
}

export class MissingTokenToCheckError {
  readonly _tag = 'MissingTokenToCheckError' as const
}

export class MissingConduitAuthError {
  readonly _tag = 'MissingConduitAuthError' as const
}

export class TokenMissingCodeError {
  readonly _tag = 'TokenMissingCodeError' as const
}

export const RegisterBodySchema = Schema.Struct({ pubkey: Schema.String })
export const CheckQuerySchema = Schema.Struct({ token: Schema.String })
export const ConduitAuthSchema = Schema.Struct({
  token: Schema.String,
  publicKey: Schema.String,
})
export const TokenCodeSchema = Schema.Struct({ code: Schema.String })

export const UnknownRecordSchema = Schema.Record({
  key: Schema.String,
  value: Schema.Unknown,
})
export const RequestSchema = Schema.instanceOf(Request)

export type ConduitAuth = typeof ConduitAuthSchema.Type

export function decodeRecord(value: unknown): UnknownRecord | null {
  const result = Schema.decodeUnknownEither(UnknownRecordSchema)(value)

  return Either.isRight(result) ? result.right : null
}

export function decodeRegisterBody(value: unknown): string | MissingPublicKeyError {
  const result = Schema.decodeUnknownEither(RegisterBodySchema)(value)

  return Either.isRight(result) ? result.right.pubkey : new MissingPublicKeyError()
}

export function decodeCheckQuery(value: unknown): string | MissingTokenToCheckError {
  const result = Schema.decodeUnknownEither(CheckQuerySchema)(value)

  return Either.isRight(result) ? result.right.token : new MissingTokenToCheckError()
}

export function decodeConduitAuth(value: unknown): ConduitAuth | MissingConduitAuthError {
  const result = Schema.decodeUnknownEither(ConduitAuthSchema)(value)

  return Either.isRight(result) ? result.right : new MissingConduitAuthError()
}

export function decodeTokenCode(value: unknown): string | TokenMissingCodeError {
  const result = Schema.decodeUnknownEither(TokenCodeSchema)(value)

  return Either.isRight(result) ? result.right.code : new TokenMissingCodeError()
}

export function decodeRequest(value: unknown): Request | null {
  const result = Schema.decodeUnknownEither(RequestSchema)(value)

  return Either.isRight(result) ? result.right : null
}

export function filterStringRecord(value: unknown): Record<string, string | undefined> | null {
  const record = decodeRecord(value)
  if (!record) {
    return null
  }

  const strings: Record<string, string | undefined> = {}
  for (const [key, raw] of Object.entries(record)) {
    if (typeof raw === 'string') {
      strings[key] = raw
    }
  }

  return strings
}

export function readConduitOpenShape(value: unknown): ConduitOpenData {
  const record = decodeRecord(value)
  if (!record) {
    return {}
  }

  const data: ConduitOpenData = {}
  const query = filterStringRecord(record.query)
  const headers = filterStringRecord(record.headers)
  const request = decodeRequest(record.request)

  if (query) {
    data.query = query
  }

  if (headers) {
    data.headers = headers
  }

  if (request) {
    data.request = request
  }

  return data
}
