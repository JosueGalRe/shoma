# Loom Tests

This directory contains the test suite for Loom. We use Vitest for unit and integration testing, and Playwright for end-to-end browser automation.

## Structure

- `tests/unit/` — Isolated tests for stores, parsers, and core logic.
- `tests/integration/` — Tests covering multiple modules, such as LCU transport and i18n parity.
- `tests/e2e/` — Playwright browser tests (`.pw.ts`) for critical user flows.

## Naming Conventions

- **Vitest:** Use the `-test.ts` (or `-test.tsx`) suffix.
- **Playwright:** Use the `.pw.ts` suffix.

## Colocation Policy

We prefer colocating tests with the source code for pure helpers, utilities, and hooks. If a test requires complex setup or spans multiple features, it belongs in the `tests/` directory.

- **Colocated:** `src/lib/fuzzy-search-test.ts`
- **Broader:** `tests/unit/gameflow-store-test.ts`

## Commands

For a full list of test and development commands, see the [Loom README](../README.md).
