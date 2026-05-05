## 2026-05-04 - Verification notes

- Root `bun run typecheck` is not defined; the scoped `bun run --filter @mimic/web-next typecheck` command is the working web typecheck path.
- `bun run --filter @mimic/web-next test` currently fails outside the social changes: Rift handshake integration tests time out waiting for socket messages, and i18n parity reports missing Spanish keys for existing `createLobby`/lobby invite strings.
- `bun run --filter @mimic/web-next lint` reports 0 errors but exits non-zero because of 3 existing React Hooks warnings in `src/core/lcu/lcu-observer-sync.ts` and `src/core/rift/hooks.ts` under `--max-warnings=0`.
