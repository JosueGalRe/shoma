import { Schema } from "effect";

export interface MissingJwtSecretError {
  readonly _tag: "MissingJwtSecretError";
  readonly message: string;
}

export const MissingJwtSecretError = Schema.TaggedError<MissingJwtSecretError>()(
  "MissingJwtSecretError",
  {
    message: Schema.String,
  },
);

export interface InvalidPortError {
  readonly _tag: "InvalidPortError";
  readonly port: number;
  readonly message: string;
}

export const InvalidPortError = Schema.TaggedError<InvalidPortError>()("InvalidPortError", {
  message: Schema.String,
  port: Schema.Number,
});
