## Learnings — 2026-05-02

- Bun test auto-discovers Playwright-style `.spec.ts` files, so e2e tests should use a different suffix when both runners share the same workspace.
- The connected layout renders its own `MIMIC` header plus page-specific headings, so smoke assertions should target the route state explicitly rather than generic `heading` roles.
- Saving screenshots with explicit `page.screenshot({ path: ... })` is the simplest way to guarantee artifact placement under `apps/web-next/test-results/screenshots/`.
- F3 QA rerun passed with `bun run build`, `bun test`, and `bunx playwright test`; the Playwright suite currently runs 12 tests from 2 specs across Mobile and Tablet projects.
- The redesigned champion picker uses rectangular splash cards via `aspect-[16/9]` plus `object-cover`, matching the requested splash-art treatment.
  function raw() {
  [native code]
  }

## F2 quality rerun - 2026-05-02

- For web-next reviewed-file linting, `bunx vp lint --max-warnings=0 <files>` is the working path to reach source rules when the root `lint:ox` wrapper blocks.
- `apps/web-next` build verification is `bun run build` from `apps/web-next`, which runs `tsc -b && vp build`; tests are `bun run test` and currently report 30 passing tests.

## F3 QA rerun - 2026-05-02

- `bunx playwright test` now runs 12 browser tests from `navigation.pw.ts` and `screenshots.pw.ts` across Mobile and Tablet projects.
- Champion selection visual QA should check for `aspect-[16/9]` splash cards with `object-cover`, not square champion icons.

## F2 re-re-run quality review - 2026-05-02

- For the lobby member profile loading effect, storing `lobbyDetails?.members` in `membersRef` and reading `membersRef.current` inside the effect satisfies the hook dependency check while preserving `[memberSummonerIds, status]` as the dependency array.
- Targeted `vp lint` from the repo root can verify hook warnings for a single file, but currently still reports project-level `apps/web-next/tsconfig.json` compatibility errors unrelated to the reviewed route.
