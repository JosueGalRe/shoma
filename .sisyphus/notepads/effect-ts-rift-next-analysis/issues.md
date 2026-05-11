
## 2026-05-11 - Task 9 lint failure
- Pre-existing verification issue: root bun run lint fails at lint:ox before ESLint. Output: This oxlint wrapper is for IDE extension use only (--lsp mode). To lint your code, run: vp lint. Evidence: .sisyphus/evidence/task-9-lint.txt.

## Task 9 verification - 2026-05-11
- apps/rift-next build captured in `.sisyphus/evidence/task-9-build.txt`: exit 0.
- apps/rift-next tests captured in `.sisyphus/evidence/task-9-test.txt`: 33 pass, 0 fail, exit 0.
- Root lint captured in `.sisyphus/evidence/task-9-lint.txt`: exit 1 because `bunx oxlint --config oxlint.config.ts apps packages` reports the wrapper is IDE/LSP-only and says to run `vp lint`. No code changes made.
## 2026-05-11
- Root `bun run build` still fails in `conduit-next` because `irelia` is missing `CLIENT_PROCESS_NAME` / `GAME_PROCESS_NAME` for the current target; this is unrelated to the realtime decode migration.
