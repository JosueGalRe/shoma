import { Cause, Match, Option, Schema } from 'effect'

import type { InvalidTokenError, TokenSignError } from '../auth'
import type { MissingJwtSecretError } from '../config/config-errors'
import type {
  DatabaseNotInitializedError,
  DatabaseOpenError,
  DatabaseQueryError,
} from '../database/database-service'
import type { MissingPublicKeyError, MissingTokenToCheckError, TokenMissingCodeError } from './http-schemas'

export type HttpOperation = 'register' | 'check' | 'root' | 'health'

export type RelayHttpError =
  | MissingPublicKeyError
  | MissingTokenToCheckError
  | (MissingJwtSecretError & { readonly operation?: HttpOperation })
  | DatabaseNotInitializedError
  | DatabaseOpenError
  | DatabaseQueryError
  | TokenSignError
  | InvalidTokenError
  | TokenMissingCodeError

export type HttpErrorBody = { readonly ok: false; readonly error: string } | false

export const HttpMappedErrorSchema = Schema.Struct({
  body: Schema.Union([
    Schema.Struct({ error: Schema.String, ok: Schema.Literal(false) }),
    Schema.Literal(false),
  ]),
  status: Schema.Number,
})

export type HttpMappedError = typeof HttpMappedErrorSchema.Type

export const mapHttpError = (error: RelayHttpError, operation: HttpOperation): HttpMappedError =>
  Match.value(error).pipe(
    Match.tag('MissingPublicKeyError', (): HttpMappedError => ({ body: { error: 'Missing public key.', ok: false }, status: 400 })),
    Match.tag('MissingTokenToCheckError', (): HttpMappedError => ({ body: { error: 'Missing a token to check.', ok: false }, status: 400 })),
    Match.tag('MissingJwtSecretError', (err): HttpMappedError =>
      (err.operation ?? operation) === 'check'
        ? { body: false, status: 500 }
        : { body: { error: 'Missing LEYLINE_JWT_SECRET.', ok: false }, status: 500 }
    ),
    Match.tag('DatabaseNotInitializedError', (): HttpMappedError => ({ body: { error: 'Internal server error.', ok: false }, status: 500 })),
    Match.tag('DatabaseOpenError', (): HttpMappedError => ({ body: { error: 'Internal server error.', ok: false }, status: 500 })),
    Match.tag('DatabaseQueryError', (): HttpMappedError => ({ body: { error: 'Internal server error.', ok: false }, status: 500 })),
    Match.tag('TokenSignError', (): HttpMappedError => ({ body: { error: 'Internal server error.', ok: false }, status: 500 })),
    Match.tag('InvalidTokenError', (): HttpMappedError => ({ body: false, status: 200 })),
    Match.tag('TokenMissingCodeError', (): HttpMappedError => ({ body: false, status: 200 })),
    Match.exhaustive,
  )

export function failureFromCause(cause: Cause.Cause<unknown>): unknown {
  const failure = Cause.findErrorOption(cause)

  return Option.isSome(failure) ? failure.value : Cause.squash(cause)
}

export const isRelayHttpError = (error: unknown): error is RelayHttpError => {
  if (typeof error !== 'object' || error === null || !('_tag' in error)) {
    return false
  }

  const { _tag } = error

  return Match.value(_tag).pipe(
    Match.when('MissingPublicKeyError', () => true),
    Match.when('MissingTokenToCheckError', () => true),
    Match.when('MissingJwtSecretError', () => true),
    Match.when('DatabaseNotInitializedError', () => true),
    Match.when('DatabaseOpenError', () => true),
    Match.when('DatabaseQueryError', () => true),
    Match.when('TokenSignError', () => true),
    Match.when('InvalidTokenError', () => true),
    Match.when('TokenMissingCodeError', () => true),
    Match.orElse(() => false),
  )
}
