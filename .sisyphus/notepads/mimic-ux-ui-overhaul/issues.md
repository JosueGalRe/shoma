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
} from fails (232 pass, 10 fail, 2 errors). Failures are outside Plan 01 code paths: rift-handshake socket message timeouts, lcu-transport request-frame mismatch, and lobby sticky-member persisted-storage TypeErrors.

Integration note: click-to-select is preserved for normal pointer clicks because resets on pointer down and only suppresses click after the 800ms timer fires. Long-press ability preview fetches detail on demand via AbilityPreviewSheet. Sort and role filter chips are implemented with local state in ChampionPicker and apply to both normal champion grid and ARAM cards.

## 2026-05-12 — Plan 01 F3 Manual QA correction

Corrected verdict: REJECT. Component composition is structurally wired: champ-select route toggles ChampionPicker; PlayerSettings composes SummonerPicker; SummonerPicker uses BottomSheet plus IconGridSelector; ChampionPicker opens AbilityPreviewSheet on long-press. LSP diagnostics are clean for champion-picker.tsx, summoner-picker.tsx, ability-preview-sheet.tsx, player-settings.tsx, route.tsx, and bottom-sheet.tsx. The web build passes.

Blocking verification issue: required web bun test fails with 232 pass, 10 fail, 2 errors. Failures are outside Plan 01 code paths: rift-handshake socket message timeouts, lcu-transport request-frame mismatch, and lobby sticky-member persisted-storage TypeErrors.

Integration notes: click-to-select is preserved for normal pointer clicks because the long-press flag resets on pointer down and only suppresses click after the 800ms timer fires. Long-press ability preview fetches detail on demand via AbilityPreviewSheet. Sort and role filter chips are implemented with local state in ChampionPicker and apply to both normal champion grid and ARAM cards.

## 2026-05-12 — Plan 05 T1 Playwright mobile comparison

- Added a Playwright comparison spec that processes the 9 Plan 00 mobile screens for Mobile-360 and Mobile-390, compares against `web/tests/e2e/baselines/`, and writes markdown plus actual/diff PNG artifacts under `.sisyphus/evidence/`.
- Required commands pass: `npx playwright test tests/e2e/comparison.pw.ts --project=Mobile-360` and `npx playwright test tests/e2e/comparison.pw.ts --project=Mobile-390`.
- Generated reports currently have `Status: FAIL` because current post-implementation screenshots differ from the Plan 00 baselines; champ-select-oriented screens show full-page height mismatches (for example 360px baselines around 2367px high vs current 2411px high). Inspect `plan-05-t1-comparison-360.md`, `plan-05-t1-comparison-390.md`, and matching `plan-05-t1-*-diff.png` artifacts.

## 2026-05-12 — Plan 05 T3 automated a11y

- `web/tests/e2e/a11y.pw.ts` passes on Mobile-360 with axe-core 4.10.2 injected from CDN: 0 critical and 0 serious violations across lobby, role-picker, champion-picker-grid, summoner-spell-selection, rune-editor, ban-phase, pick-phase, aram-bench, and ready-check-overlay.
- Moderate axe findings remain on champ-select screens only: heading order and nested/duplicate landmark structure. They are non-critical/non-serious and recorded in `.sisyphus/evidence/plan-05-t3-a11y-report.md`.
- Touch target report is saved to `.sisyphus/evidence/plan-05-t3-touch-targets.md`; remaining sub-44px controls include shared header/debug/social controls plus some 40px champ-select buttons (`Hide champion picker`, `Edit Runes`, `Draw new cards`, `Create Page`).
- BottomSheet focus trap bug fixed in `web/src/components/ui/bottom-sheet.tsx`: the trap now attaches after the portal renders and pulls Tab focus back inside when needed.

## 2026-05-12 - Plan 05 T2 interaction tests

- Added Mobile-360 Playwright interaction coverage for BottomSheet, IconGridSelector, ChampionPicker, SummonerPicker, and RuneEditor; evidence saved at `.sisyphus/evidence/plan-05-t2-interactions.log`.
- Harness-only files under `web/tests/e2e/` mount isolated React components through Vite so tests can provide mocked props/query data without modifying production components.

## 2026-05-12 — Plan 05 T3 review follow-up

- Post-implementation review initially rejected T3 for CDN axe injection, undersized touch targets, and BottomSheet focus-trap robustness.
- Follow-up fixes: added locked local `axe-core@4.10.2`, hardened BottomSheet focus trapping for dynamic/zero-focusable content, and raised shared Button/Debug/Social touch targets to the 44×44px mobile minimum.
- Final evidence regenerated: `.sisyphus/evidence/plan-05-t3-touch-targets.md` now reports all measured interactive targets >=44×44; `.sisyphus/evidence/plan-05-t3-a11y-report.md` still reports 0 critical and 0 serious axe violations.
- Final verification: `cd web && npx playwright test tests/e2e/a11y.pw.ts --project=Mobile-360` passed 2/2; `cd web && bun run build` passed.
