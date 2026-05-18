## Issues — 2026-05-02

- Initial Playwright filenames (`*.spec.ts`) conflicted with `bun test`, causing Bun to try executing Playwright hooks.
- The first lobby smoke assertion was too broad because the connected shell and the unavailable-state content both expose headings.
- F3 QA rerun found no blocking issues. Non-blocking visual notes: the home Connect button/placeholder are somewhat low contrast, and mobile connected nav wraps to a second row while remaining readable.
  function raw() {
  [native code]
  }

## F2 quality rerun - 2026-05-02

- `bunx vp lint --max-warnings=0` on the five reviewed files reports `react-hooks/exhaustive-deps` in `apps/web-next/src/routes/connected/lobby/route.tsx:217` for missing `lobbyDetails.members` / `lobbyDetails.members.length` dependencies.
- Root `bun run lint` is currently blocked before source linting because `lint:ox` invokes an IDE-only oxlint wrapper; direct `vp lint` reaches source analysis but also reports `apps/web-next/tsconfig.json` compatibility errors.

## F3 QA rerun - 2026-05-02

- No blocking QA issues found. Non-blocking screenshot notes: home Connect button/placeholder contrast is subdued, and narrow mobile nav wraps but does not overlap.
