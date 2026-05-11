## F3 Real Manual QA - 2026-05-09

- Required tests passed and output saved to `.sisyphus/evidence/f3-real-manual-qa-test-output.txt`.
- LSP diagnostics were clean for `apps/web-next/src/features/lobby/hooks/use-lobby.ts` and `apps/web-next/src/routes/connected/lobby/route.tsx`.
- Coverage check found adjacent tests for the modified modules: sticky lobby hook test, lobby route grace integration test, and existing LCU mutations test.
- Build evidence saved to `.sisyphus/evidence/f3-real-manual-qa-build-output.txt`; full build currently fails on unrelated/package-level blockers (`@mimic/rift-next` TS5090, web-next `bun:test` mock type exports in test files, and conduit-next Linux irelia cfg errors).
