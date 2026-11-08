/**
 * Compile-time contract between our valibot wire schemas and the generated LCU schema (`LCUTypes`,
 * from @hasagi/types). Runtime validation stays in valibot: the generated types are sometimes wrong
 * (see tests/fixtures/champ-select/README.md), so they describe what to check, not what to trust.
 *
 * A contract fails `tsc` when a client patch renames or removes a field we read, changes its
 * primitive type, or adds a literal to a field the generator types as a closed union we narrow.
 */
type Kind<T> = T extends string
  ? 'string'
  : T extends number
    ? 'number'
    : T extends boolean
      ? 'boolean'
      : T extends readonly unknown[]
        ? 'array'
        : T extends object
          ? 'object'
          : 'other'

type Accepts<Wire, Generated> = [Kind<Generated>] extends [Kind<Wire>]
  ? [Generated] extends [string]
    ? string extends Generated
      ? true
      : [Generated] extends [Wire]
        ? true
        : false
    : true
  : false

type UnknownFields<Wire, Generated> = Exclude<keyof Wire, keyof Generated>

// `unknown` wires accept anything; checked before NonNullable, which turns `unknown` into `{}`
type DroppedFields<Wire, Generated> = {
  [Key in keyof Wire & keyof Generated]-?: unknown extends Wire[Key]
    ? never
    : Accepts<NonNullable<Wire[Key]>, NonNullable<Generated[Key]>> extends true
      ? never
      : Key
}[keyof Wire & keyof Generated]

/**
 * Field names that break the contract. `Allowed` lists fields we read on purpose despite the
 * generated schema (live-captured extras or generator mistakes); document why at the call site.
 */
export type SchemaContractViolations<Wire, Generated, Allowed extends PropertyKey = never> = Exclude<
  UnknownFields<Wire, Generated> | DroppedFields<Wire, Generated>,
  Allowed
>

/** Errors with the offending field names unless the contract holds */
export type AssertSchemaContract<Violations extends never> = Violations
