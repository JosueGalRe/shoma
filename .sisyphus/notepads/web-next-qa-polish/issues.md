2026-05-01: `lsp_diagnostics` could not run in this environment because both Biome and `typescript-language-server` are not installed.
2026-05-02: `bun run build` in `apps/web-next` still fails on pre-existing type errors in `src/routes/connected/lobby/-lobby-utils.ts` (`displayName` is unresolved), unrelated to the timeout change.

## 2026-05-03 F3 Re-run Manual QA

Verdict: REJECT. Dev server started and browser console had no warnings/errors during seeded Playwright QA, but mobile visual issues remain. At 320px, the active ready-check fixed overlay starts below the 182px header/nav (overlay rect x=0 y=182 w=320 h=662), so it does not cover the full viewport. At 320px champ select, ARAM uses card terminology (CHAMPION CARDS / DRAW NEW CARDS), but the Draw New Cards button text visibly overflows/clips horizontally (button clientWidth 236, scrollWidth 247). Champ select grid text is otherwise readable at 320px with no page-level horizontal overflow. Screenshots: /tmp/opencode/reverify-ready-active-320.png and /tmp/opencode/reverify--connected-champ-select-320.png.
