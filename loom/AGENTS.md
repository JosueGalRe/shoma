# loom KNOWLEDGE BASE

**Generated:** 2026-05-24

## OVERVIEW

Next-gen mobile web UI for Sho'ma. Built with React 19, TanStack Router, and Tailwind v4. Legacy version lives in `legacy/web/`.

## STRUCTURE

```
loom/
├── src/
│   ├── main.tsx              # Entry: router + query client + runtime setup
│   ├── routes/               # TanStack Router file-based routes
│   │   ├── __root/           # Root layout
│   │   ├── index/            # Landing/connect page
│   │   └── connected/        # Authenticated game-flow pages
│   │       └── lobby/
│   │           └── -components/   # Route-scoped private components
│   ├── core/                 # Cross-cutting runtime modules
│   │   ├── relay/            # WebSocket + encryption handshake
│   │   ├── lcu/              # LCU parsers, queries, mutations
│   │   ├── state/            # Zustand stores (gameflow, session, settings)
│   │   └── http/             # API client (Data Dragon + CommunityDragon)
│   ├── features/             # Domain-driven feature folders
│   │   ├── connect/          # Connection flow
│   │   ├── lobby/            # Lobby + queue + ready-check
│   │   ├── champ-select/     # Pick/ban/runes/skins
│   │   ├── social/           # Friends list + chat
│   │   └── queue/            # Queue overlay
│   ├── components/ui/        # shadcn/ui primitives (from design-system)
│   ├── lib/                  # Shared utilities (asset-resolver, fuzzy-search, normalizers)
│   ├── i18n/                 # Translation keys + setup
│   └── testing/              # Shared test mocks and helpers
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/                  # Playwright tests (*.pw.ts)
```

## MANDATORY RULES

Every agent and contributor must follow these rules without exception unless explicitly listed in the Exceptions section.

### Component Architecture
- **One component per file:** Each `.tsx` file must contain exactly one React component.
- **No auxiliary components:** Do not declare helper or auxiliary components in the same file as the main component. Extract them to their own files.
- **File suffixes:** Use explicit suffixes for supporting files:
  - `-types.ts` (or `types.ts` in a subfolder) for TypeScript interfaces and types.
  - `-utils.ts` (or `utils.ts` in a subfolder) for pure utility functions.
  - `-styles.ts` (or `styles.ts` in a subfolder) for Tailwind variant definitions.
- **Props naming:** Use `props: ComponentNameProps` for component parameters. Declare the type outside the component and avoid complex inline types.

### Styling
- **Tailwind Variants:** Use `tailwind-variants` with `slots` for all component styling.
- **No long inline strings:** Do not use Tailwind strings longer than 80 characters or complex combinations directly in JSX. Extract them to a `-styles.ts` file.
- **Typed styles:** Ensure styles and variants are correctly typed when using `tailwind-variants`.

### TypeScript & Type Safety
- **No `any`:** The use of `any` is strictly prohibited. Use `unknown` or specific types.
- **No type assertions:** Do not use `as SomeType` or `<SomeType>value`. Use narrowing, type guards, or Valibot schemas instead.
- **Import Type:** Use `import type` for all type-only imports.
- **Single type per clause:** Each `import type` clause must import exactly one type.
- **Separation:** Keep value imports and type imports in separate statements.
- **No inline imports:** Do not use `import("...").Type` syntax.
- **Strictness:** Do not weaken types to bypass errors. If a type is `unknown`, ensure safe narrowing is performed.

### Logic & Control Flow
- **No nested ternaries:** Replace nested ternary operators with clearer structures like `if/else` or helper functions.
- **Curly braces required:** All control flow blocks (`if`, `else`, `for`, `while`) and arrow functions must use curly braces.
- **Function declarations:** Prefer `function` declarations over `const` arrow functions for top-level utilities, selectors, and components.
- **Magic strings:** Any string with domain significance (roles, states, routes, keys, events, query keys, storage keys) must be extracted to `src/constants/`.
- **Async safety:** Use `void` for intentionally unawaited promises.

### Formatting & Readability
- **JSX Separation:** Separate blocks of JSX with blank lines to improve scanability.
- **Statement Grouping:** Group variables, hooks, and effects by intent, separating unrelated blocks with blank lines.
- **JSX Complexity:** Extract complex JSX blocks or logic to separate components or helper functions. Avoid heavy calculations inside the render body.

### State & Data
- **Zustand:** Use for global or shared client state. Keep stores small, focused, and single-purpose. Avoid using Zustand for simple local state.
- **React Query:** Use TanStack Query for all server state, fetching, caching, and mutations. Manual `useEffect` fetching is prohibited. Keep query keys typed and consistent.
- **Valibot:** Use Valibot for validating all external data (API responses, route params, search params). Prefer explicit validation over type assertions.

### Testing
- **Naming:** Use the `-test.ts` or `-test.tsx` suffix for test files.
- **Colocation:** Colocate tests with the source code when possible, except for routes where it might interfere with routing.
- **Behavioral Testing:** Prefer tests that validate real behavior over implementation details. Mock only when necessary (network, storage, timers, browser APIs).
- **Linting:** Loom test files are linted normally; there is no blanket ignore for `loom/tests/**`, `loom/src/**/*.test.ts`, or `loom/src/testing/**`.
- **Scoped exception:** `loom/tests/e2e/interactions-harness.tsx` may disable `react/only-export-components` because the Playwright harness exports a mount helper alongside React components.
- **Type assertions:** `typescript/no-unnecessary-type-assertion` is enforced at error level across Loom, including tests.

## EXCEPTIONS

- **`routeTree.gen.ts`:** This file is auto-generated by TanStack Router and is exempt from `no-explicit-any` and other lint rules.
- **Zustand `create`:** Arrow functions are allowed within the `create((set) => ({...}))` call as it is the idiomatic API.
- **`as const`:** Allowed for constant literal objects to enable literal typing (replaces `enum`).
- **Test Mocks:** Browser API mocks in test files may use broader types where strictness is impractical.

## QUALITY CHECKS

Before finishing any task, you must run and pass the following checks:

```bash
pnpm --filter @shoma/loom typecheck
pnpm --filter @shoma/loom lint
pnpm --filter @shoma/loom test
pnpm --filter @shoma/loom build
pnpm --filter @shoma/loom fmt
pnpm run doctor:react:check
```

## DOCUMENTATION MAINTENANCE

- **Sync Rule:** When a convention or architectural decision changes, you must update both the root `CONTEXT.md` and this `AGENTS.md` file.
- **Manual Source of Truth:** The `pnpm run agents:update` script is currently a placeholder. Manual edits to this file are the primary source of truth.
