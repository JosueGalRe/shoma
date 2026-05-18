## 2026-05-09 Final Verification F1/F2 store infra fixes

- Made `PersistedStoreOptions.migrate` required and wrapped persisted storage so required migrations also seed first-time hydration when the new persisted key is absent.
- Moved session legacy key handling into `migrate` callbacks for `mimic:connection` and `mimic:session`; `logout()` now clears `connectionCode`, `deviceId`, `sessionCode`, and `returnUrl`.
- Added settings migration for legacy `mimic:social:show-offline-group`, moved social show-offline toggling to settings as source-of-truth with a subscription mirror, and added the rift selector `satisfies` typing pattern.
- Verification: LSP diagnostics clean on the five changed files; `bun test tests/unit/persist-hydration.test.ts tests/unit/rift-store.test.ts tests/unit/social/use-send-chat-message.test.ts` passed 17/17.
- `bun run build` in `apps/web-next` still exits 1 on previously recorded unrelated test type blockers: `bun:test` mock exports plus sticky/ready-check test signatures; no changed file appears in the build errors.

## 2026-05-09 Champ-select ChampionPicker prop removal

- `champ-select-store.ts` did not actually expose the inherited `isAram`, `isLoading`, or `selectChampionForTurn` API; added volatile runtime fields and a hook-registered async handler so `ChampionPicker` can call `useChampSelectStore.getState().selectChampionForTurn(...)` without losing the LCU PATCH behavior from `useChampSelect()`.
- Verification: changed-file LSP diagnostics clean; `bun test tests/unit/lcu-parsers/champ-select.test.ts src/core/state/tests/app-key-flows.test.tsx` passed 11/11; `bun test tests/unit/aram-store.test.ts` passed 3/3.
- `bun run build` in `apps/web-next` still exits 1 on pre-existing unrelated type blockers: `bun:test` missing `mock` exports and lobby sticky test signature errors.

### 2026-05-09 Lobby prop drilling and SocialPanel rename

- Refactored `LobbyBottomSheets` and `LobbyInviteOverlay` to call `useLobby()` directly; `LobbyBottomSheets` derives mode rules from `useLobby().mode` via `getModeRules(mode)` because `useLobby()` does not export `modeRules` directly.
- Renamed `apps/web-next/src/features/social/components/SocialPanel.tsx` to `social-panel.tsx` and updated the connected route import.
- Verification: changed-file LSP diagnostics clean; touched-file `vp lint --max-warnings=0` passes; targeted tests pass (`lobby-route-grace` 4/4, connected i18n 2/2, social send chat 3/3).
- `bun run build` remains blocked by unrelated existing typecheck failures in Bun `mock` imports and `use-lobby.sticky.test.ts` signatures.

## 2026-05-09 Real Manual QA F3 rerun

- Non-blocking: a source-only tsconfig placed under /tmp makes TypeScript fail to resolve vite/client; place temporary tsconfig inside apps/web-next for accurate project type resolution.
- Non-blocking: Bun runtime checks print a root tsconfig.base.json paths warning for @mimic/protocol-contract, but commands exited successfully.

## 2026-05-09 Final Verification F1/F2 follow-up

- Full `bun test` remains blocked by unrelated existing failures: alias-resolution errors for `@/...` imports, i18n parity missing Spanish lobby keys, ready-check overlay source-string expectation drift, and lobby route mock initialization errors. The affected `rift-store` suite passes after the session cache listener fix.
- Root `bun run build` remains blocked by unrelated workspace issues: `rift-next` tsconfig non-relative paths without `baseUrl`, web-next test type errors around `bun:test` `mock` and lobby sticky harness signatures, and conduit-next Linux build failures in the `irelia` dependency's OS-gated process constants.
- `apps/web-next` `bun run build` is still blocked by the same test typecheck issues: `bun:test` missing `mock` exports and `use-lobby.sticky.test.ts` hook signature/type errors.

## 2026-05-09 F3 Round 3 final QA blockers

- `bun run build` from apps/web-next fails at `tsc -b`: bun:test mock export errors in lcu-mutations/use-ready-check/lcu-mock smoke tests and a use-lobby.sticky test signature/type error.
- Logout does not clear ALL browser data: after logout, legacy keys (`deviceID`, `conduitID`, `mimicSessionCode`, `mimicReturnUrl`, `mimic:social:show-offline-group`) and unrelated `mimic:*` keys remained, although `mimic:connection` and `mimic:session` were reset to empty state.
- Reloading a connected route without a real Rift peer cleared freshly persisted session values, so browser-level session persistence could not be approved from manual QA even though the isolated unit test passes.
