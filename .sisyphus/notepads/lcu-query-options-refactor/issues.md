
## 2026-05-04 - Queue migration verification

- After migrating `apps/web-next/src/features/queue/use-queue.ts`, `lsp_diagnostics` on that file is clean.
- `bun run build` in `apps/web-next` is blocked by unrelated existing errors in `src/features/lobby/hooks/use-lobby.ts`: unresolved `useLCURequest`/`useLCUObserver`/`LcuHttpMethod` names and `localTransport` possibly null.

## 2026-05-04 - Invites migration verification

- `bun test` in `apps/web-next` currently fails in unrelated Rift handshake integration tests (`tests/integration/rift-handshake.test.ts`) with 5s socket message timeouts; the migrated invites hook has no targeted invite test file.
