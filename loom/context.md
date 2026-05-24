# Loom Context

This document outlines the architecture, conventions, and technical decisions for the `loom` package.

## Architecture Overview

Loom follows a **feature-driven structure**. Logic is grouped by domain rather than technical type.

- `src/features/`: Domain-driven modules (e.g., `lobby`, `champ-select`).
- `src/components/`: Shared UI primitives and layout components.
- `src/core/`: Cross-cutting runtime logic (relay, LCU parsers, global state).
- `src/routes/`: TanStack Router file-based route definitions.
- `src/lib/`: Shared utilities and helper functions.
- `src/constants/`: Static domain constants and configuration.

### File Naming Conventions

Files must use `kebab-case`. Supporting files for a module or component use specific suffixes:

- `-types.ts`: Type definitions.
- `-utils.ts`: Local helper functions.
- `-styles.ts`: Tailwind variants and slots.
- `-test.ts` / `-test.tsx`: Unit and integration tests.

## Component Conventions

### Structure

- **One component per file**: Do not declare auxiliary components in the same file.
- **Supporting files**: Extract types, utils, and styles to their respective suffixed files.
- **Complex components**: Use a subfolder pattern when a component grows too large for a single file:
  ```txt
  component/
  ├── index.tsx (exports the component)
  ├── types.ts
  ├── styles.ts
  ├── utils.ts
  └── component-test.tsx
  ```

### Implementation

- Prefer `function` declarations for top-level components.
- Use `props: ComponentNameProps` for typing props, declared outside the function.
- Destructure props inside the function body if it improves readability.

## Style Conventions

Loom uses **Tailwind CSS v4** with `tailwind-variants` for styling.

- **No inline long strings**: Class strings exceeding 80 characters or containing complex logic must be extracted.
- **Tailwind Variants**: Use `tv()` to define variants and `slots` for multi-part components.
- **Typed Style Modules**: Styles should be extracted to `-styles.ts` files and consumed by the component.
- **Separation**: Keep visual logic out of the JSX as much as possible.

## TypeScript Conventions

- **No `any`**: Use `unknown` or specific types. `no-explicit-any` is enforced by Oxlint.
- **No Type Assertions**: Avoid `as SomeType`. Use narrowing, type guards, or schema validation.
- **No Nested Ternaries**: Use `if/else`, helper functions, or typed maps instead.
- **Curly Braces**: Required for all blocks (`if`, `while`, `for`, etc.).
- **Functions**: Prefer `function` declarations over arrow functions for top-level logic.
- **Arrow Functions**: Must always use curly braces and explicit `return`. Implicit returns are forbidden.
- **Imports**: Use `import type` for type-only imports. One type per import line is preferred.

## State Management

- **Zustand**: Used for global or shared client state.
- **TanStack Query**: Used for server state, fetching, and synchronization with the LCU.
- **Local State**: Use standard React `useState` or `useReducer` for state that doesn't need to be shared.

### Store Conventions

- **Small and Focused**: Avoid monolithic stores.
- **Selectors**: Declare selectors as `function` declarations for better performance and testability.
- **Idiomatic Exception**: `create((set) => ...)` is the only allowed use of arrow functions for store definitions.

## Routing

Loom uses **TanStack Router** with file-based routing.

- **Private Helpers**: Files or folders within `src/routes/` that are not routes must be prefixed with `-` (e.g., `-components/`, `-hooks/`).
- **Validation**: Use `validateSearch` with Valibot schemas for search parameters.
- **Integration**: Leverage router-level data loading and protection.

## Data Validation

**Valibot** is the primary library for data validation.

- **External Data**: Validate all data coming from the LCU or external APIs.
- **Params**: Validate route parameters and search parameters.
- **Schemas**: Keep schemas close to the domain they validate.

## Constants

- **Domain Values**: Static values with domain meaning (e.g., game phases, event names) live in `src/constants/`.
- **Feature-Local**: UI-only strings that appear once can stay in the component, but functional strings (keys, statuses) should be extracted to feature-local constants.

## Testing

- **Vitest**: Primary runner for unit and integration tests.
- **Playwright**: Used for E2E testing (`*.pw.ts`).
- **Suffix**: Use `-test.ts` or `-test.tsx` for Vitest files.
- **Behavior-Level**: Prefer testing behavior and outcomes over implementation details.
- **Colocation**: Colocate tests with the source code whenever possible.

## Exceptions Registry

| Pattern / File         | Exception         | Justification                                                                                          |
| :--------------------- | :---------------- | :----------------------------------------------------------------------------------------------------- |
| `routeTree.gen.ts`     | `no-explicit-any` | Automatically generated by TanStack Router; uses `as any` for internal routing logic.                  |
| `create((set) => ...)` | Arrow function    | Idiomatic Zustand pattern; exempt from "prefer function" rule.                                         |
| `as const`             | Type assertion    | Allowed for constant literal objects to ensure literal type inference.                                 |
| Browser API Mocks      | Type flexibility  | Tests may require `any` or assertions when mocking complex browser APIs (e.g., `crypto`, `WebSocket`). |
