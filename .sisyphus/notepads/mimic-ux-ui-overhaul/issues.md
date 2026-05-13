## 2026-05-12 - T5 fuzzy search utility
- `bun run build:web` currently fails before bundling due unrelated unused `@ts-expect-error` directives in existing test files: `src/core/lcu/lcu-mutations.test.ts`, `src/features/ready-check/hooks/use-ready-check.test.ts`, `src/routes/connected/lobby/tests/-lobby-route-grace.test.ts`, and `src/testing/lcu-mock.smoke.test.ts`.
- Direct `bunx oxfmt --check ...` and `bunx oxlint ...` invoke IDE wrapper binaries in this repo; use `vp` commands instead. `bunx vp fmt --check ...` currently fails loading formatter config with `expected value at line 1 column 1`.

## 2026-05-12 - T1 Playwright mobile baselines
- Build verification via `bun run build` in web currently fails before bundling because unrelated test files have unused @ts-expect-error directives: src/core/lcu/lcu-mutations.test.ts:1, src/features/ready-check/hooks/use-ready-check.test.ts:1, src/routes/connected/lobby/tests/-lobby-route-grace.test.ts:1, src/testing/lcu-mock.smoke.test.ts:1.
