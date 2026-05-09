## 2026-05-08
- Ready-check overlay visibility must be driven by store `status === 'pending'` plus gameflow phase, not the ready-check LCU snapshot.
- Module-mocked Bun tests in this repo need `/// <reference types="bun-types" />` when using `mock`.

## 2026-05-08 - useGameflowNavigation resolver refactor
- Extracted pure resolveGameflowNavigation from the hook so phase-to-route decisions can be tested without React, TanStack Router, or Bun module mocks.
- Focused resolver tests pass: hooks/use-gameflow-navigation.test.ts (7/7) and tests/match-acceptance-flow.test.ts (1/1).
- Full bun test still has unrelated existing failures in Rift handshake timeouts, i18n ES parity, and arena route provider setup.

## 2026-05-08 - resolver import cleanup
- Pointed both gameflow tests at `../lib/resolve-gameflow-navigation` so they no longer import the hook file and pull in `@tanstack/react-query`.
- Kept `useGameflowNavigation` intact while removing only the duplicated resolver types/constants from the hook module.
- Targeted Bun tests for the two affected files pass after the import cleanup.
