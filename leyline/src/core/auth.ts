import { Effect, Match, Schema } from "effect";
import jwt from "jsonwebtoken";

import { env } from "./config/env-config";
import { MissingJwtSecretError } from "./config/config-errors";
import { decodeTokenCode, TokenMissingCodeError } from "./http/http-schemas";

import type { HttpOperation } from "./http/http-errors";

export class TokenSignError extends Schema.TaggedErrorClass<TokenSignError>()("TokenSignError", {
  cause: Schema.Defect,
}) {}

export class InvalidTokenError extends Schema.TaggedErrorClass<InvalidTokenError>()(
  "InvalidTokenError",
  {
    cause: Schema.Defect,
  },
) {}

export function missingJwtSecret(
  operation: HttpOperation,
): MissingJwtSecretError & { readonly operation: HttpOperation } {
  return Object.assign(new MissingJwtSecretError({ message: "LEYLINE_JWT_SECRET is required" }), {
    operation,
  });
}

export const readJwtSecret = Effect.fn("Relay.readJwtSecret")((
  operation: HttpOperation,
): Effect.Effect<string, MissingJwtSecretError & { readonly operation: HttpOperation }> => {
  const secret = env.LEYLINE_JWT_SECRET;

  return secret ? Effect.succeed(secret) : Effect.fail(missingJwtSecret(operation));
});

export const signToken = Effect.fn("Relay.signToken")((code: string, secret: string) =>
  Effect.try({
    catch: (cause) => new TokenSignError({ cause }),
    try: () => jwt.sign({ code }, secret),
  }),
);

export const verifyTokenCode = Effect.fn("Relay.verifyTokenCode")((token: string, secret: string) =>
  Effect.gen(function* verifyTokenCode() {
    const decoded = yield* Effect.try({
      catch: (cause) => new InvalidTokenError({ cause }),
      try: () => jwt.verify(token, secret),
    });

    const code = decodeTokenCode(decoded);
    const validated = yield* Match.value(code).pipe(
      Match.when(
        (c): c is TokenMissingCodeError => c instanceof TokenMissingCodeError,
        (err) => Effect.fail(err),
      ),
      Match.orElse((c: string) => Effect.succeed(c)),
    );

    return validated;
  }),
);
