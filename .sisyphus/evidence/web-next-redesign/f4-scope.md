# F4 Scope Fidelity Check — web-next UI redesign

## Verdict: REJECT with scope issues

The redesign mostly targets the planned `apps/web-next` UI surface, but it cannot be approved as scope-faithful because the working tree contains unrelated untracked work outside `apps/web-next/src/`, includes a generated `tsconfig.tsbuildinfo` change, and misses/weakens some planned UI requirements. No code was modified during this audit.

## Plan basis checked

Source: `.sisyphus/plans/web-next-ui-redesign.md`

Critical guardrails:
- No Framer Motion; CSS/Tailwind animations only.
- Frontend remains a “terminal tonto”; no business-logic creep.
- No chat/friends replication, native push notifications, chromas/skin variants, fictitious resource counters, or API-breaking Rift/LCU changes.
- No new virtualization dependency; use CSS grid + native lazy images + IntersectionObserver unless justified.

Must-have scope:
- Champ Select grid, role/class filters, search, tabs, lazy loading.
- AppShell/safe areas/landscape warning.
- Connect, Lobby, and Invites polish.

## Evidence commands and findings

### Changed-file surface

`git diff --stat` reported 34 tracked modified files, with tracked changes in:
- `.sisyphus/boulder.json`
- `.sisyphus/notepads/**`
- `apps/web-next/index.html`
- `apps/web-next/src/core/http/ddragon-client.ts`
- `apps/web-next/src/features/connect/**`
- `apps/web-next/src/i18n/resources.{ts,d.ts}`
- `apps/web-next/src/routes/connected/**`
- `apps/web-next/src/routes/index/route.tsx`
- `apps/web-next/src/styles.css`
- `apps/web-next/tsconfig.tsbuildinfo`

`git status --short` also showed untracked paths not included in `git diff --stat`, including:
- `.github/`
- `.sisyphus/drafts/`, `.sisyphus/evidence/`, multiple `.sisyphus/notepads/**`, and plan files
- `apps/conduit-next/`
- `apps/web-next/src/components/layout/`
- `apps/web-next/src/routes/connected/champ-select/-components/`
- `apps/web-next/tests/integration/e2e-code-263542.test.ts`
- multiple root-level `mimic-*.cjs` debug/test scripts

Scope flag: files outside `apps/web-next/src/` were modified or added. `.sisyphus/` evidence/notepad changes are expected, but `apps/web-next/index.html` is only justified by the performance preconnect task, `apps/web-next/tsconfig.tsbuildinfo` is generated noise, and `apps/conduit-next/`, `.github/`, and root `mimic-*.cjs` scripts are outside this web-next redesign scope unless separately justified.

### Dependency check

`apps/web-next/package.json` was read and `git diff -- apps/web-next/package.json` returned no diff.

Result:
- No new dependencies were added in this working diff.
- No `@tanstack/react-virtual` dependency was added.
- No `framer-motion` dependency was added.
- No new UI library dependency was added by this diff.

Existing package entries include `radix-ui`, `@radix-ui/react-dropdown-menu`, `@playwright/test`, and `vite-plugin-pwa`, but they were not newly added by the redesign diff.

### Forbidden pattern checks

- `framer-motion`: no matches under `apps/web-next`.
- `createLazyFileRoute`: no matches under `apps/web-next/src`.
  - This means lazy routes were not introduced; not scope creep, but the performance/code-splitting plan item was not evidenced through TanStack lazy file routes.
- `serviceWorker|workbox`: matches exist in `apps/web-next/vite.config.ts` and built `dist/*`, but `git diff` showed no `vite.config.ts` change. No new service worker/workbox code was introduced by the tracked diff.
- `TODO|FIXME|HACK|XXX`: no matches in `apps/web-next/src`.

### Must NOT Have guardrails

| Guardrail | Finding | Status |
|---|---|---|
| No Framer Motion imports | Grep found no `framer-motion` matches. | Pass |
| No full rune editor | `RunesTab.tsx` exposes simple rune-page selection only. However, `champ-select/route.tsx` destructures full rune editor actions (`selectPrimaryRune`, `selectSecondaryRune`, `createRunePage`, `renameActiveRunePage`, `deleteActiveRunePage`) even though they are not rendered in the tab. | Pass with caution |
| No chat/friends replication | No chat UI found. Invites adds `Invite Friends` share/copy, which is explicitly planned. | Pass |
| No chromas/skin variants | `SkinsCard` uses owned skin selection; no chroma UI was found. | Pass |
| No landscape support | `LandscapeWarning.tsx` blocks mobile landscape via `matchMedia('(orientation: landscape)')` and width `<768`. | Pass |
| No native push notifications | No new notification APIs found. `serviceWorker/workbox` matches appear pre-existing. | Pass |
| No business logic changes | Risk: `lobby/route.tsx` changes member profile loading behavior/timeouts, `connect-utils.ts` changes lobby member parsing/display/profile icon extraction, and `champ-select/route.tsx` adds multiple LCU queries/mutations for selectable champions, spells, runes, skins, reroll, and bench swap. Some are necessary for planned UI, but this is beyond purely visual polish. | Scope risk |
| No fictitious resource counters | No fake currency/resource counters found. | Pass |
| No breaking Rift/LCU API changes | No protocol/API schema changes seen in inspected files. | Pass |

### Must Have implementation check

| Planned item | Evidence | Status |
|---|---|---|
| Champ Select grid with lazy loading | `ChampionsTab.tsx` renders a responsive CSS grid and uses `IntersectionObserver`, `data-src`, `loading="lazy"`, and `decoding="async"`. | Partial pass |
| Champ Select splash art Data Dragon | `ChampionsTab.tsx` uses `buildChampionIconUrl`, not `buildChampionSplashUrl`; cards are square icon tiles, not splash-art cards. | Fail |
| Role filters | `ChampionsTab.tsx` has filter chips for Data Dragon classes (`Fighter`, `Tank`, `Mage`, `Assassin`, `Support`, `Marksman`). The plan allowed tags in detail, but the high-level Must Have called lane roles (`Top/Jungle/Mid/ADC/Support`). | Partial pass |
| Search | `ChampionsTab.tsx` has a search input with `useDeferredValue`. | Pass |
| Tabs | `ChampSelectTabs.tsx` provides Champions/Spells/Runes/Skins tabs. | Pass |
| Layout system | `AppShell.tsx`, `SafeArea.tsx`, and `LandscapeWarning.tsx` exist and are integrated into `/` and `/connected`. | Pass, but untracked |
| Connect polish | `connect-entry-form.tsx`, `connect-screen-shell.tsx`, `connect-screen.tsx`, `status-card.tsx`, and `connect-utils.ts` were modified; audit observed OTP/input styling and state polish changes. | Pass |
| Lobby polish | `QueueCard`, `ReadyCheckCard`, `LobbyMembersCard`, `RolePreferencesCard`, `LobbyHeader`, and lobby route were modified for dashboard polish. | Pass |
| Invites polish | `invites/route.tsx` adds share/copy behavior; received invite card adds avatar treatment. | Pass |

## Gold plating / scope creep assessment

Scope issues requiring rejection:

1. **Out-of-scope working tree additions are present.** `apps/conduit-next/`, `.github/`, and many root `mimic-*.cjs` scripts are outside the web-next UI redesign and were untracked during this audit.
2. **Generated artifact changed.** `apps/web-next/tsconfig.tsbuildinfo` changed and should not be part of a UI redesign deliverable.
3. **Champ Select does not fully match the planned visual scope.** The implemented grid uses champion icons instead of splash art cards, weakening the core redesign requirement.
4. **Business-logic risk exists.** Some changed files touch LCU/Rift-adjacent data loading/parsing behavior (`lobby/route.tsx`, `connect-utils.ts`, `champ-select/route.tsx`). These may be implementation necessities, but they exceed a strict “visual polish only / terminal tonto” reading and need reviewer justification.

No evidence was found of Framer Motion, new virtualization dependencies, native push notification implementation, chat replication, chromas, fictitious resource counters, or package dependency creep.

## Approval conditions

Approve only after:
- Removing or separately justifying all out-of-scope untracked paths (`apps/conduit-next/`, `.github/`, root `mimic-*.cjs`, unrelated plans/notepads).
- Reverting or excluding `apps/web-next/tsconfig.tsbuildinfo` unless the repository intentionally tracks it.
- Either updating Champ Select to use planned splash-art cards or documenting why icon cards satisfy the revised scope.
- Documenting why the LCU/Rift-adjacent changes are necessary and non-breaking, especially member profile loading and champ-select route data/mutation additions.
