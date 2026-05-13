# Rift Next Code Style Guidelines

## Structure

- Move file-specific types/interfaces into `<filename>-types.ts`.
- Move file-specific utility functions into `<filename>-utils.ts`.
- Keep route/runtime orchestration in `index.ts`; keep pure parsing/helpers in utils.

## Control Flow

- Always use curly braces with `if`, `else`, loops, and branches.
- Prefer explicit early-return blocks over inline single-line branches.
- Keep declarations and condition checks in separate statements when practical.

## Types

- Avoid `as` assertions unless there is no safer alternative.
- Prefer runtime guards and typed helper functions over unchecked casts.
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
