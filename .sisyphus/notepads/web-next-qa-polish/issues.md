2026-05-01: `lsp_diagnostics` could not run in this environment because both Biome and `typescript-language-server` are not installed.
2026-05-02: `bun run build` in `apps/web-next` still fails on pre-existing type errors in `src/routes/connected/lobby/-lobby-utils.ts` (`displayName` is unresolved), unrelated to the timeout change.

## 2026-05-03 F3 Re-run Manual QA

Verdict: REJECT. Dev server started and browser console had no warnings/errors during seeded Playwright QA, but mobile visual issues remain. At 320px, the active ready-check fixed overlay starts below the 182px header/nav (overlay rect x=0 y=182 w=320 h=662), so it does not cover the full viewport. At 320px champ select, ARAM uses card terminology (CHAMPION CARDS / DRAW NEW CARDS), but the Draw New Cards button text visibly overflows/clips horizontally (button clientWidth 236, scrollWidth 247). Champ select grid text is otherwise readable at 320px with no page-level horizontal overflow. Screenshots: /tmp/opencode/reverify-ready-active-320.png and /tmp/opencode/reverify--connected-champ-select-320.png.
## 2026-05-03

- `lsp_diagnostics` could not run on `apps/web-next/tsconfig.json` because the configured Biome LSP is not installed in this environment.
- The first `tsconfig` attempt broke TypeScript path resolution until the app aliases were restored to relative paths.
- Runtime QA showed the connected shell still renders a few untranslated labels outside the scoped lobby route content (`Lobby`, `Ready check`, `idle`), so future i18n passes may need to cover shared navigation/shell components too.
- Historical translation conventions may prefer `invites.noInvites` over introducing `invites.none`; the explicit task asked for `invites.none`, but the broader codebase already uses `noInvites` in the dedicated invites route.
- No new runtime issues were introduced by the i18n pass; build, tests, lint, and diagnostics all passed after the component updates.
- Lint caught one stale test expectation that still assumed `champSelectStore.error` was an `Error`; the fix was to assert the translated key string instead.
2026-05-04: `lsp_diagnostics` could not run on `apps/web-next/package.json` because the configured Biome server is not installed in this environment. TS/TSX diagnostics were clean, and the CLI verification still passed.

## 2026-05-07 Code quality re-review
- PASS: role picker buttons expose translated aria-labels.
- PASS: transition-all absent from reviewed key files: SocialPanel.tsx, role-picker.tsx, connected route.tsx files, input.tsx.
- FAIL: non-token route colors remain in connected routes (text-green/red/yellow and rgba gradients).
- FAIL: lsp_diagnostics reports a hint in SocialPanel.tsx for unused FriendStatus.
- PASS: bun run --filter @mimic/web-next build exits 0.
- 2026-05-08: `bun run lint` at the monorepo root is still blocked by unrelated pre-existing warnings in `apps/web-next` and by the root oxlint wrapper alias; the edited connect screen file itself lints cleanly with `bunx vp lint --max-warnings=0 src/features/connect/components/connect-screen.tsx`.
