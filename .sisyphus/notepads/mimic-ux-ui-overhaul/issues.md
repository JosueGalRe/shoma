## 2026-05-12 - T5 fuzzy search utility
- `bun run build:web` currently fails before bundling due unrelated unused `@ts-expect-error` directives in existing test files: `src/core/lcu/lcu-mutations.test.ts`, `src/features/ready-check/hooks/use-ready-check.test.ts`, `src/routes/connected/lobby/tests/-lobby-route-grace.test.ts`, and `src/testing/lcu-mock.smoke.test.ts`.
- Direct `bunx oxfmt --check ...` and `bunx oxlint ...` invoke IDE wrapper binaries in this repo; use `vp` commands instead. `bunx vp fmt --check ...` currently fails loading formatter config with `expected value at line 1 column 1`.

## 2026-05-12 - T1 Playwright mobile baselines
- Build verification via `bun run build` in web currently fails before bundling because unrelated test files have unused @ts-expect-error directives: src/core/lcu/lcu-mutations.test.ts:1, src/features/ready-check/hooks/use-ready-check.test.ts:1, src/routes/connected/lobby/tests/-lobby-route-grace.test.ts:1, src/testing/lcu-mock.smoke.test.ts:1.

## 2026-05-12 — Plan 01 F3 Manual QA

Verdict: REJECT. Component composition is structurally wired: champ-select route toggles ChampionPicker; PlayerSettings composes SummonerPicker; SummonerPicker uses BottomSheet + IconGridSelector; ChampionPicker opens AbilityPreviewSheet on long-press. LSP diagnostics are clean for champion-picker.tsx, summoner-picker.tsx, ability-preview-sheet.tsx, player-settings.tsx, route.tsx, and bottom-sheet.tsx. Build passes.

Blocking verification issue: required bun test v1.3.13-canary.1 (bf2e2cec)
[Mimic Chat] Sending message: {
  conversationId: "conv-1",
  path: "/lol-chat/v1/conversations/conv-1/messages",
  body: "hello world",
}
[Mimic Chat] Send result: {
  conversationId: "conv-1",
  status: 200,
  content: undefined,
}
[Mimic Chat] Sending message: {
  conversationId: "conv-2",
  path: "/lol-chat/v1/conversations/conv-2/messages",
  body: "oops",
}
[Mimic Chat] Send result: {
  conversationId: "conv-2",
  status: 500,
  content: undefined,
} from  fails (232 pass, 10 fail, 2 errors). Failures are outside Plan 01 code paths: rift-handshake socket message timeouts, lcu-transport request-frame mismatch, and lobby sticky-member persisted-storage TypeErrors.

Integration note: click-to-select is preserved for normal pointer clicks because  resets on pointer down and only suppresses click after the 800ms timer fires. Long-press ability preview fetches detail on demand via AbilityPreviewSheet. Sort and role filter chips are implemented with local state in ChampionPicker and apply to both normal champion grid and ARAM cards.

## 2026-05-12 — Plan 01 F3 Manual QA correction

Corrected verdict: REJECT. Component composition is structurally wired: champ-select route toggles ChampionPicker; PlayerSettings composes SummonerPicker; SummonerPicker uses BottomSheet plus IconGridSelector; ChampionPicker opens AbilityPreviewSheet on long-press. LSP diagnostics are clean for champion-picker.tsx, summoner-picker.tsx, ability-preview-sheet.tsx, player-settings.tsx, route.tsx, and bottom-sheet.tsx. The web build passes.

Blocking verification issue: required web bun test fails with 232 pass, 10 fail, 2 errors. Failures are outside Plan 01 code paths: rift-handshake socket message timeouts, lcu-transport request-frame mismatch, and lobby sticky-member persisted-storage TypeErrors.

Integration notes: click-to-select is preserved for normal pointer clicks because the long-press flag resets on pointer down and only suppresses click after the 800ms timer fires. Long-press ability preview fetches detail on demand via AbilityPreviewSheet. Sort and role filter chips are implemented with local state in ChampionPicker and apply to both normal champion grid and ARAM cards.
