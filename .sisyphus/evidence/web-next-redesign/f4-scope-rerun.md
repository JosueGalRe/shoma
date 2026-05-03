# F4 Scope Fidelity Check Rerun — web-next UI redesign

## Verdict: APPROVE

This rerun approves the web-next UI redesign for scope fidelity. The two prior blocking concerns are resolved or reclassified with the provided plan context: Champ Select now uses Data Dragon splash art, and the unrelated untracked paths are from other plans rather than this redesign. No code was modified during this audit.

## Plan basis

Read: `.sisyphus/plans/web-next-ui-redesign.md`

Relevant guardrails checked:
- No new dependencies for animation or virtualization unless justified; specifically no Framer Motion.
- Champ Select must use Data Dragon splash art with lazy loading, search, filters, and tabs.
- Runes must remain simple selection, not a full rune editor.
- No chat/friends replication, native push notifications, chromas/skin variants, fictitious counters, or business/API-breaking scope creep.

## Required evidence

### 1. No new dependencies added

Command: `git diff -- apps/web-next/package.json`

Result: no output.

Finding: `apps/web-next/package.json` has no working-tree diff, so this redesign rerun adds no dependencies. In particular, there is no newly added `framer-motion`, virtualization package, or UI-library dependency. The untracked `apps/web-next/playwright.config.ts` is testing infrastructure required by the redesign plan and does not add package dependencies.

### 2. No Framer Motion imports

Grep: `framer-motion`

Result under `apps/web-next`: no matches.

Finding: the implementation uses CSS/Tailwind-style animations rather than Framer Motion. A repository-wide grep only found historical evidence/notepad text mentioning the term, not source imports.

### 3. Champ Select uses splash art, not icons

Read: `apps/web-next/src/routes/connected/champ-select/-components/ChampionsTab.tsx`

Evidence:
- Line 9 imports `buildChampionSplashUrl`.
- Lines 99-101 derive `championKey` from `championMetadataById[championId]?.key` and call `buildChampionSplashUrl(championKey)`.
- Lines 229-234 render an `<img>` with `data-src={splashUrl}`, `loading="lazy"`, and `decoding="async"`.

Finding: the previous F4 rejection noted icon cards. That blocker is fixed; champion cards now use Data Dragon splash art keyed by the champion slug, with lazy image loading.

### 4. No unsafe Data Dragon casts

Read: `apps/web-next/src/core/http/ddragon-client.ts`

Evidence:
- `get(...).json<unknown>()` keeps payloads as `unknown` at the API boundary.
- `readObject` checks `typeof value === 'object' && value !== null` before returning a `Record<string, unknown>` view.
- `parseChampionMetadataById` validates `data`, `key`, `name`, numeric id conversion, `tags`, and `id` before constructing `ChampionMetadata`.
- The only `as` usages are the guarded object view in `readObject` and `as const` query-key assertions.

Finding: no blind `any` cast or unchecked Data Dragon payload cast remains in this file.

### 5. RunesTab is simple selection, not a full editor

Read: `apps/web-next/src/routes/connected/champ-select/-components/RunesTab.tsx`

Evidence:
- Props are `runePages`, `activeRunePage`, `onSelectRunePage`, and `runeUpdatePending`.
- The UI maps pages to buttons and calls `onSelectRunePage(runePage.id)`.
- There are no create, rename, delete, primary-rune, secondary-rune, or rune-tree editing controls.

Finding: `RunesTab` is a simple rune-page selector, matching the plan guardrail.

### 6. No `createLazyFileRoute` scope creep

Grep: `createLazyFileRoute`

Result under `apps/web-next`: no matches.

Finding: the redesign did not introduce lazy route restructuring or TanStack route-pattern churn beyond the planned UI/performance work.

## Out-of-scope untracked file classification

`git status --short` still shows unrelated untracked paths, including:
- `apps/conduit-next/`
- `.github/`
- root-level `mimic-*.cjs` scripts

Per rerun context, these are from other plans (`conduit-tauri-migration` and `playwright-lobby-e2e`) and were not created by the web-next UI redesign. They should not block this F4 approval.

Other untracked paths are either redesign-scoped or workflow artifacts:
- `apps/web-next/playwright.config.ts`, `apps/web-next/tests/e2e/`, `apps/web-next/src/components/layout/`, and `apps/web-next/src/routes/connected/champ-select/-components/` align with the redesign plan.
- `.sisyphus/evidence/**`, `.sisyphus/notepads/**`, and plan files are Sisyphus workflow artifacts.

## Scope creep assessment

Compared with the previous F4 rejection:
- Blocking issue fixed: Champ Select now uses splash art instead of icon tiles.
- Blocking issue reclassified: unrelated untracked `.github/`, `apps/conduit-next/`, and root `mimic-*.cjs` files are attributed to other plans and are excluded from this redesign scope judgment.
- Dependency guardrail still passes: `apps/web-next/package.json` has no diff.
- Animation guardrail still passes: no `framer-motion` source matches under `apps/web-next`.
- Runes guardrail passes: simple selection only.
- Data Dragon parsing is appropriately narrowed from `unknown`; no unsafe payload casts found.

No new scope-creep blocker was found in this rerun. The remaining tracked web-next changes align with the plan’s T1-T7 redesign scope: design tokens, Data Dragon metadata, AppShell/safe areas, Champ Select redesign, Connect/Lobby/Invites polish, Playwright config, and performance preconnect.

## Final verdict

APPROVE — scope fidelity is acceptable for the web-next UI redesign rerun.
