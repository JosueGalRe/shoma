- 2026-05-08: Full `bun run test` still fails outside this dead-code suppression task: web-next Rift handshake integration timeouts, missing Spanish lobby translation parity keys, and arena route provider setup.
- 2026-05-08: Root `bun run build` still fails outside web-next: `@mimic/rift-next` TS5090 in tsconfig path setup and Linux `@mimic/conduit-next` Rust dependency (`irelia`) cfg-gated process constants. Scoped `@mimic/web-next` build passes.
- 2026-05-08: `bun run lint` remains blocked outside the LobbyMember task: `lint:ox` invokes the IDE-only oxlint wrapper, and the direct `vp lint --max-warnings=0 ...` path reports existing `src-old`, Fast Refresh, unused-var, empty service-worker, tsconfig, and social/test warnings. File-scoped `vp lint apps/web-next/src/features/lobby/components/lobby-member.tsx` passes.
- 2026-05-08: Root `bun run build` also reports existing `apps/web-next/src/routes/connected/lobby/-components/*` type errors in addition to the known `rift-next` TS5090 and Linux conduit `irelia` cfg failures.
- 2026-05-08: ChampionPicker cleanup verification is blocked only at broader workspace scope: root `bun run lint` still exits in `lint:ox` because `bunx oxlint` resolves to the IDE-only Vite Plus wrapper; scoped web-next lint/build also fail on unrelated pending lobby/social changes and existing test warnings, while task-file diagnostics and oxlint are clean.
  2026-05-08: `bun run lint` currently fails through `lint:ox` because the shared oxlint wrapper is IDE-only; targeted `vp lint` on the changed files passes, while repo-wide lint still reports unrelated legacy `src-old/` issues.

## F4 scope fidelity check — 2026-05-08

- REJECT: product-scope checks mostly pass (no Zustand in `apps/conduit-next/src`, `App.tsx` uses `useReducer` + `useRef`, dead-code audit classifications exist, new UI files are component splits), but the working tree includes an out-of-scope modification to read-only `.sisyphus/plans/react-doctor-100.md` and an unexpected root `.sisyphus/notepads/learnings.md`.
- Verification notes: `lsp_diagnostics` passed for `apps/conduit-next/src/App.tsx` and `apps/web-next/src`; `bun run test` failed in web-next handshake/i18n/arena tests; `bun run build` failed in `rift-next` tsconfig and `conduit-next` Linux Rust dependency gating while `apps/web-next` built successfully.

## Final Verification F2 - 2026-05-08

- REJECT: Expanded status review found untracked files beyond git diff --name-only; all must be included in final quality gate.
- LSP/lint issue: apps/web-next/src/features/social/components/ChatPanel.tsx declares unused selectedFriendId.
- Formatting check issue: bunx vp fmt --check fails before file checks with Failed to load configuration file / expected value at line 1 column 1; manual read also found misindented JSX in lobby route components.
- Build note: @mimic/web-next built successfully, but root bun run build fails in @mimic/rift-next TS5090 and @mimic/conduit-next irelia Linux imports.
- Diagnostic cache briefly reported an outdated prop mismatch after the source was fixed; rerunning `lsp_diagnostics` cleared it.
