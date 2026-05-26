# Leyline Code Style Guidelines

## Canonical Source

This document provides a high-level overview of the coding standards for Leyline. For the full, authoritative set of rules used by AI agents and developers, refer to [AGENTS.md](./AGENTS.md).

## Structure

- **File Separation**: Each file must have a single, clear responsibility.
- **Types**: Extract to `*-types.ts`.
- **Utils**: Extract to `*-utils.ts`.
- **Schemas**: Extract to `*-schemas.ts` (using `effect/Schema`).
- **Services**: Extract to `*-service.ts`.
- **Tests**: Use `tests/unit/` or `tests/integration/`. Co-located tests must use `.test.ts` suffix.

## Control Flow

- Always use curly braces `{}` for all blocks (`if`, `else`, `for`, `while`).
- Prefer explicit early-return blocks over inline single-line branches.
- No nested ternaries. Use `Match.value` from Effect for complex branching.
- Arrow functions must use curly braces `{}` and explicit `return` (except for short Effect pipes).

## Types

- **No `any`**: Use `unknown` with proper narrowing or `effect/Schema` decoding.
- **No Type Assertions**: `as SomeType` is forbidden. Use `Schema.decode` or type guards. (Permitted in tests for mocks).
- **Validation**: Use `effect/Schema` for all boundary validation (HTTP, WebSocket, Env).
- Avoid `as` assertions unless there is no safer alternative.
- Do not use TypeScript `private`; use JavaScript `#privateField` syntax.

## Booleans

- Do not use `!!value`; use `Boolean(value)`.

## Constants and Protocols

- Avoid TypeScript enums.
- Use `const` objects with `as const` and derive value unions from them.

## Logging

- Add meaningful logs at lifecycle boundaries and failure paths.
- Log structured context (event name + identifiers like `code`, `peerId`, reason).
- Avoid logging secrets and raw auth tokens.

## Effect-TS Idioms

- **Services**: Use `Context.Service` for abstractions.
- **Layers**: Use `Layer` for wiring dependencies.
- **Generators**: Use `Effect.gen` for complex logic. Variable shadowing is permitted.
- **Errors**: Use `Schema.TaggedErrorClass` for domain errors.
- **Naming**: Use `_tag`, `_op`, `_id` for discriminated unions.
- **Functions**: `Effect.fn('Name')((...) => ...)` is the canonical pattern for Effect-based helpers.

## Elysia Patterns

- **Handler Extraction**: Do not define complex logic inline in `app.get()` or `app.post()`.
- **Reference Passing**: Extract handlers to named functions and pass them by reference.
- **Getter Closures**: Use getter functions `() => service` when passing mutable state to routes.
