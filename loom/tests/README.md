# Loom Tests

> **Note:** Several test files were removed on 2026-05-22 due to fundamental incompatibility with Bun's `mock.module` and path alias resolution (`@/`). Attempting to maintain them required excessive environment-specific hacks (absolute paths, incomplete zustand mocks, custom SSR renderers) that would break on any other machine or Bun version.
>
> **Removed:**
>
> - `tests/integration/relay-handshake.test.ts` — WebSocket integration tests requiring a live relay server.
> - `src/features/ready-check/components/ready-check-overlay.test.tsx` — Snapshot-based component tests.
> - `src/features/ready-check/hooks/use-ready-check.test.ts` — Hook tests relying on `react-dom/server` + `useCountdown` mocks.
> - `src/routes/connected/lobby/tests/-lobby-route-grace.test.ts` — Route tests using a custom React renderer incompatible with zustand v5 + Bun.
> - `src/features/lobby/hooks/tests/use-lobby.sticky.test.ts` — Hook tests requiring zustand store mocks that `mock.module` cannot reliably intercept.
>
> **When to re-add:** Once Bun supports stable `mock.module` for aliased ESM paths, or when we migrate to a test runner (e.g. Vitest) with reliable module mocking.
