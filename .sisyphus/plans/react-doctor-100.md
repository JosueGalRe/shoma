# React Doctor 100/100: web-next + conduit-next

## TL;DR
> **Summary**: Fix all React Doctor diagnostics in `apps/web-next` (183 issues → 0) and `apps/conduit-next` (9 issues → 0) to reach 100/100 score in both projects. Includes dead-code audit, performance fixes, accessibility fixes, state refactor in conduit, and large component refactors (SocialPanel split, boolean-prop API redesign).
> **Deliverables**: Clean audit trail, refactored components, updated conduit App state management, zero Doctor issues.
> **Effort**: Large
> **Parallel**: YES — 5 waves
> **Critical Path**: Wave 1 (dead code) → Wave 2 (performance/correctness) → Wave 3 (conduit state) → Wave 4 (architecture refactors) → Wave 5 (verification)

## Context
### Original Request
User asked to create a plan to bring React Doctor to 100 in `conduit-next` and `web-next`, investigate replacing useReducer warnings with Zustand stores, and ask everything deemed appropriate.

### Interview Summary
- **Scope**: Fix ALL issues in both apps. `rift-next` excluded.
- **Dead code**: Manual audit before deletion. Classify each item.
- **Conduit state**: `useRef` for `connectionState` + `useReducer` for remaining grouped state. No Zustand.
- **Large refactors**: Yes, include SocialPanel split and LobbyMember/champion-picker boolean-prop redesign.

### Metis Review (gaps addressed)
- Guardrail: `connectionState` must not break QR generation when moved to `useRef`. Plan includes explicit fix.
- Guardrail: Dead-code deletions require evidence (safe-delete / explicit-re-export / knip-ignore).
- Guardrail: Large refactors must not alter public behavior; map all references before changing props.
- Guardrail: Final gate is `bun run doctor:react:check` + build + test + lint.

## Work Objectives
### Core Objective
Eliminate every React Doctor warning in `apps/web-next` and `apps/conduit-next` while preserving all existing behavior.

### Deliverables
1. Dead-code audit document (`.sisyphus/evidence/dead-code-audit.md`).
2. Refactored `conduit-next/src/App.tsx` with `useRef` + `useReducer`.
3. Refactored `web-next` components (SocialPanel split, LobbyMember API, champion-picker API).
4. Performance/accessibility/correctness fixes across 10+ files.
5. Zero-issue React Doctor report for both projects.

### Definition of Done (verifiable conditions with commands)
```bash
bun run doctor:react:check
# Expected: exit 0, web-next 100/100, conduit-next 100/100, 0 issues each.

bun run fmt:check
bun run lint
bun run test
bun run build
# Expected: all exit 0.
```

### Must Have
- All 183 web-next issues resolved.
- All 9 conduit-next issues resolved.
- Dead-code audit trail with classification evidence.
- Every changed file passes `oxfmt` and `oxlint`.
- Tests still pass.

### Must NOT Have (guardrails)
- NO new Zustand stores unless strictly required.
- NO new features or visual redesigns.
- NO alterations to user-facing behavior of lobby, champ-select, social panel, or connection status.
- NO deletion of dead code without audit classification.
- NO changes to `apps/rift-next`.

## Verification Strategy
- **Test decision**: Tests-after for refactors; existing test suite validates regressions.
- **QA policy**: Every implementation task has agent-executed QA scenarios.
- **Evidence**: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy
### Parallel Execution Waves
> Target: 4-5 tasks per wave.

**Wave 1**: Dead-code audit + safe deletions + conduit low-hanging fruit.
**Wave 2**: Performance, accessibility, correctness fixes in web-next.
**Wave 3**: Conduit-next state refactor (useRef + useReducer).
**Wave 4**: Large architecture refactors (SocialPanel, LobbyMember, champion-picker).
**Wave 5**: Final verification (4 review agents).

### Dependency Matrix
| Task | Blocks | Blocked By |
|------|--------|------------|
| T1 (audit) | T2 | — |
| T2 (safe delete) | T3 | T1 |
| T3 (knip config) | — | T1 |
| T4 (conduit a11y) | — | — |
| T5 (conduit dead) | — | — |
| T6 (set-map) | — | — |
| T7 (combine iter) | — | — |
| T8 (hoist intl) | — | — |
| T9 (parallel await) | — | — |
| T10 (LandscapeWarning) | — | — |
| T11 (connect-screen) | — | — |
| T12 (array-index-key) | — | — |
| T13 (autofocus) | — | — |
| T14 (conduit state) | — | T4, T5 |
| T15 (SocialPanel) | — | T8 |
| T16 (LobbyMember) | — | — |
| T17 (champion-picker) | — | T12 |
| T18 (rune-editor) | — | T7 |
| T19 (lobby route) | — | T6, T9 |

### Agent Dispatch Summary
| Wave | Tasks | Categories |
|------|-------|------------|
| 1 | T1-T5 | quick, unspecified-high |
| 2 | T6-T13 | quick, deep |
| 3 | T14 | deep |
| 4 | T15-T19 | visual-engineering, deep |
| 5 | F1-F4 | oracle, unspecified-high, deep |

## TODOs

- [x] T1. Create dead-code audit table for all 183 web-next issues

  **What to do**: Parse React Doctor JSON output for `apps/web-next`. For each `knip/exports`, `knip/types`, and `knip/files` issue, classify into one of four buckets:
  1. `safe-delete`: export/type/file is genuinely unused with no dynamic usage.
  2. `explicit-re-export-keep`: intentionally part of public API; add explicit `export { ... }` in an index barrel or add `@public` JSDoc.
  3. `knip-ignore`: false positive (e.g. PWA files, generated files, test helpers); add to `knip` ignore config.
  4. `needs-investigation`: unclear usage; flag for manual review.

  Produce `.sisyphus/evidence/dead-code-audit.md` with one row per issue: file, line, rule, classification, rationale.

  **Must NOT do**: Delete any file or export during this task.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: requires careful cross-reference analysis.
  - Skills: [] - No specific skills needed.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T2, T3 | Blocked By: —

  **References**:
  - Diagnostics JSON: `/tmp/react-doctor-85d38799-4406-47c7-9e83-d83638f68832/diagnostics.json`
  - React Doctor config: `react-doctor.config.json`
  - Store files with many exports: `src/core/state/gameflow-store.ts`, `src/features/lobby/lobby-store.ts`, `src/features/social/social-store.ts`
  - Known PWA files: `public/sw.js`, `src/pwa-sw.ts`
  - Known unused index files: `src/core/http/index.ts`, `src/core/platform/index.ts`, `src/core/query/index.ts`, `src/core/rift/index.ts`, `src/core/state/index.ts`, `src/features/social/hooks/index.ts`

  **Acceptance Criteria**:
  - [ ] `.sisyphus/evidence/dead-code-audit.md` exists with ≥183 rows.
  - [ ] Every row has a classification and rationale.
  - [ ] `needs-investigation` count is ≤10 (if higher, flag to user).

  **QA Scenarios**:
  ```
  Scenario: Audit completeness
    Tool: Bash
    Steps: wc -l .sisyphus/evidence/dead-code-audit.md
    Expected: line count > 200
    Evidence: .sisyphus/evidence/task-T1-audit-lines.txt

  Scenario: No deletions yet
    Tool: Bash
    Steps: git diff --name-only --diff-filter=D
    Expected: empty output
    Evidence: .sisyphus/evidence/task-T1-no-deletions.txt
  ```

  **Commit**: NO

- [x] T2. Delete safe dead code from web-next

  **What to do**: Using the audit table from T1, delete all items classified `safe-delete`. For exports/types, remove the export keyword or delete the type. For files, delete the file. Run `bun run fmt:check` and `bun run lint` after each batch. If any deletion breaks a build or test, revert and reclassify as `needs-investigation`.

  **Must NOT do**: Delete anything classified as `keep`, `knip-ignore`, or `needs-investigation`.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: mechanical deletions guided by audit.
  - Skills: []

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: — | Blocked By: T1

  **References**:
  - Audit table: `.sisyphus/evidence/dead-code-audit.md`
  - Test command: `bun run test` in `apps/web-next/`
  - Build command: `bun run build` in `apps/web-next/`

  **Acceptance Criteria**:
  - [ ] All `safe-delete` items removed.
  - [ ] `bun run test` passes in `apps/web-next`.
  - [ ] `bun run build` passes in `apps/web-next`.
  - [ ] `bun run lint` passes.

  **QA Scenarios**:
  ```
  Scenario: Build still green
    Tool: Bash
    Steps: cd apps/web-next && bun run build
    Expected: exit 0
    Evidence: .sisyphus/evidence/task-T2-build.txt

  Scenario: Tests still green
    Tool: Bash
    Steps: cd apps/web-next && bun run test
    Expected: exit 0
    Evidence: .sisyphus/evidence/task-T2-tests.txt
  ```

  **Commit**: YES | Message: `chore(web-next): remove dead code` | Files: all deleted/modified files

- [x] T3. Configure knip ignores for intentional false positives

  **What to do**: For items classified `knip-ignore` in T1, add them to the appropriate ignore list in `react-doctor.config.json` or `package.json` knip config (whichever exists). Common candidates:
  - `public/sw.js` — PWA service worker, not imported by source.
  - `src/pwa-sw.ts` — PWA service worker registration, may be injected by build.
  - `src/lib/connected-layout-utils.ts` — utility possibly used dynamically.
  - `src/core/*/index.ts` — barrel files kept for API consistency even if empty.

  **Must NOT do**: Add broad wildcards that hide real dead code.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: config edits.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: — | Blocked By: T1

  **References**:
  - React Doctor config: `/home/josuegalre/projects/mimic/react-doctor.config.json`
  - Knip docs (if needed): search for `knip` in `package.json` configs.

  **Acceptance Criteria**:
  - [ ] Config file updated with explicit ignore entries.
  - [ ] Each ignored item has a comment explaining why.
  - [ ] `bun run doctor:react` no longer reports those items.

  **QA Scenarios**:
  ```
  Scenario: Ignored items gone from report
    Tool: Bash
    Steps: bun run doctor:react 2>&1 | grep -c "knip/"
    Expected: count decreased by number of ignored items
    Evidence: .sisyphus/evidence/task-T3-knip-count.txt
  ```

  **Commit**: YES | Message: `chore(config): ignore intentional dead code in knip` | Files: `react-doctor.config.json` or equivalent

- [x] T4. Fix accessibility and correctness in conduit-next App.tsx

  **What to do**: In `apps/conduit-next/src/App.tsx`:
  1. Lines 194, 196: Replace `<a href="#" onClick={...}>` with `<button type="button" onClick={...}>`. Remove `e.preventDefault()`. Style as links if needed.
  2. Line 257: Move the `await` after the synchronous early-return guard. The `unlistenState()` etc. calls are synchronous; the `await` should happen after the `if (!mounted)` block.

  **Must NOT do**: Change visual appearance without preserving existing CSS classes.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: localized changes in a single file.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: — | Blocked By: —

  **References**:
  - File: `apps/conduit-next/src/App.tsx:194-196` (anchor links)
  - File: `apps/conduit-next/src/App.tsx:257` (async-defer-await)

  **Acceptance Criteria**:
  - [ ] `jsx-a11y/anchor-is-valid` and `react-doctor/no-prevent-default` warnings gone.
  - [ ] `react-doctor/async-defer-await` warning gone.
  - [ ] App still renders and links work.

  **QA Scenarios**:
  ```
  Scenario: Doctor score improves
    Tool: Bash
    Steps: bun run doctor:react 2>&1 | grep -A2 "conduit-next"
    Expected: score ≥ 97 (was 95, 4 issues fixed)
    Evidence: .sisyphus/evidence/task-T4-conduit-score.txt
  ```

  **Commit**: YES | Message: `fix(conduit): accessibility and async ordering in App` | Files: `apps/conduit-next/src/App.tsx`

- [x] T5. Remove unused file in conduit-next

  **What to do**: Delete `apps/conduit-next/src/about/AboutWindow.ts` if truly unused. Check for dynamic imports or Tauri window references first.

  **Must NOT do**: Delete if referenced by Tauri config (`tauri.conf.json`) or `src-tauri` Rust code.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: single file deletion.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: — | Blocked By: —

  **References**:
  - File: `apps/conduit-next/src/about/AboutWindow.ts`
  - Tauri config: `apps/conduit-next/src-tauri/tauri.conf.json`

  **Acceptance Criteria**:
  - [ ] File deleted OR retained with knip-ignore justification.
  - [ ] `bun run doctor:react` no longer reports `knip/files` for this path.

  **QA Scenarios**:
  ```
  Scenario: knip/files down by 1
    Tool: Bash
    Steps: bun run doctor:react 2>&1 | grep -c "AboutWindow"
    Expected: 0
    Evidence: .sisyphus/evidence/task-T5-aboutwindow.txt
  ```

  **Commit**: YES | Message: `chore(conduit): remove unused AboutWindow.ts` | Files: `apps/conduit-next/src/about/AboutWindow.ts`

- [x] T6. Fix js-set-map-lookups in create-lobby and lobby routes

  **What to do**:
  1. `apps/web-next/src/routes/connected/create-lobby/route.tsx:85-86`: `defaultGameQueues.indexOf(a.id)` is O(n) inside a sort comparator. Convert `defaultGameQueues` to a `Map<number, number>` (id → index) before the sort loop.
  2. `apps/web-next/src/routes/connected/lobby/route.tsx:141-142`: Same pattern inside `queues.sort`. Convert `defaultGameQueues` to a Map before sorting.
  3. `apps/web-next/src/routes/connected/lobby/route.tsx:132`: `enabledGameQueues.includes(queue.id)` inside a loop. Convert `enabledGameQueues` to a `Set<number>` before the loop.

  **Must NOT do**: Change sort order or filter logic.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: mechanical data structure swap.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: — | Blocked By: —

  **References**:
  - File: `apps/web-next/src/routes/connected/create-lobby/route.tsx:83-95`
  - File: `apps/web-next/src/routes/connected/lobby/route.tsx:123-155`

  **Acceptance Criteria**:
  - [ ] `react-doctor/js-set-map-lookups` warnings gone from both files.
  - [ ] `bun run lint` passes.

  **QA Scenarios**:
  ```
  Scenario: Doctor no longer reports lookups
    Tool: Bash
    Steps: bun run doctor:react 2>&1 | grep "js-set-map-lookups"
    Expected: no matches for create-lobby or lobby routes
    Evidence: .sisyphus/evidence/task-T6-lookups.txt
  ```

  **Commit**: YES | Message: `perf(lobby): use Set/Map for O(1) queue lookups` | Files: `apps/web-next/src/routes/connected/create-lobby/route.tsx`, `apps/web-next/src/routes/connected/lobby/route.tsx`

- [x] T7. Fix js-combine-iterations in champ-select route and rune-editor

  **What to do**:
  1. `apps/web-next/src/routes/connected/champ-select/route.tsx:31-37`: `.map().filter()` on `champSelect.team` and `champSelect.enemyTeam` iterates twice. Combine into a single `reduce` or `for...of` loop that builds the `Set` directly.
  2. `apps/web-next/src/features/champ-select/components/rune-editor.tsx:277`: `.filter().map()` on `runeTrees`. Combine into a single pass.

  **Must NOT do**: Change the resulting data structures or values.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: loop refactoring.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: — | Blocked By: —

  **References**:
  - File: `apps/web-next/src/routes/connected/champ-select/route.tsx:29-38`
  - File: `apps/web-next/src/features/champ-select/components/rune-editor.tsx:274-290`

  **Acceptance Criteria**:
  - [ ] `react-doctor/js-combine-iterations` warnings gone.
  - [ ] `bun run lint` passes.

  **QA Scenarios**:
  ```
  Scenario: Combine-iterations fixed
    Tool: Bash
    Steps: bun run doctor:react 2>&1 | grep "js-combine-iterations"
    Expected: no matches for champ-select/route or rune-editor
    Evidence: .sisyphus/evidence/task-T7-combine.txt
  ```

  **Commit**: YES | Message: `perf(champ-select): combine iteration chains into single pass` | Files: `apps/web-next/src/routes/connected/champ-select/route.tsx`, `apps/web-next/src/features/champ-select/components/rune-editor.tsx`

- [x] T8. Fix js-hoist-intl in SocialPanel

  **What to do**: `apps/web-next/src/features/social/components/SocialPanel.tsx:61`: `new Intl.DateTimeFormat(...)` is created inside `formatMessageTime` on every call. Hoist it to module scope or wrap in `useMemo`.

  **Must NOT do**: Change date formatting output.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: single line fix.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: — | Blocked By: —

  **References**:
  - File: `apps/web-next/src/features/social/components/SocialPanel.tsx:60-65`

  **Acceptance Criteria**:
  - [ ] `react-doctor/js-hoist-intl` warning gone.
  - [ ] `bun run lint` passes.

  **QA Scenarios**:
  ```
  Scenario: Intl hoisted
    Tool: Bash
    Steps: bun run doctor:react 2>&1 | grep "js-hoist-intl"
    Expected: no match for SocialPanel
    Evidence: .sisyphus/evidence/task-T8-intl.txt
  ```

  **Commit**: YES | Message: `perf(social): hoist Intl.DateTimeFormat to module scope` | Files: `apps/web-next/src/features/social/components/SocialPanel.tsx`

- [x] T9. Fix async-parallel and server-sequential-independent-await in lobby route

  **What to do**: `apps/web-next/src/routes/connected/lobby/route.tsx:593-594`: Two `await` calls inside the loader that appear independent. Wrap them in `Promise.all([...])`.

  **Must NOT do**: Change loader return value or error handling.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: single refactor.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: — | Blocked By: —

  **References**:
  - File: `apps/web-next/src/routes/connected/lobby/route.tsx:590-600`

  **Acceptance Criteria**:
  - [ ] `react-doctor/async-parallel` and `server-sequential-independent-await` warnings gone.
  - [ ] `bun run lint` passes.

  **QA Scenarios**:
  ```
  Scenario: Parallel awaits fixed
    Tool: Bash
    Steps: bun run doctor:react 2>&1 | grep -E "async-parallel|server-sequential"
    Expected: no match for lobby route
    Evidence: .sisyphus/evidence/task-T9-parallel.txt
  ```

  **Commit**: YES | Message: `perf(lobby): parallelize independent awaits in loader` | Files: `apps/web-next/src/routes/connected/lobby/route.tsx`

- [x] T10. Fix rerender-state-only-in-handlers in LandscapeWarning

  **What to do**: `apps/web-next/src/components/layout/LandscapeWarning.tsx:25`: `showWarning` is updated but never read in the component's return (it IS read in the return, so this might be a false positive). If the warning persists, verify the pattern: the state is read in `if (!showWarning) return null` and then in the JSX. This should already be valid. If React Doctor still flags it, check if it's because `setShowWarning` is called in a non-handler (resize listener). Move the resize logic to a custom hook or use `useSyncExternalStore`.

  **Must NOT do**: Remove the landscape warning functionality.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: may require pattern change if false positive.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: — | Blocked By: —

  **References**:
  - File: `apps/web-next/src/components/layout/LandscapeWarning.tsx:24-36`

  **Acceptance Criteria**:
  - [ ] `react-doctor/rerender-state-only-in-handlers` warning gone.
  - [ ] Landscape warning still shows/hides correctly on orientation change.

  **QA Scenarios**:
  ```
  Scenario: Landscape warning still works
    Tool: Playwright
    Steps: Resize viewport to 900x400 (landscape mobile). Screenshot.
    Expected: Warning overlay visible.
    Evidence: .sisyphus/evidence/task-T10-landscape.png
  ```

  **Commit**: YES | Message: `fix(layout): resolve state-only-in-handlers in LandscapeWarning` | Files: `apps/web-next/src/components/layout/LandscapeWarning.tsx`

- [x] T11. Fix no-prevent-default in connect-screen

  **What to do**: `apps/web-next/src/features/connect/components/connect-screen.tsx:96-108`: `preventDefault` on `<form>` submit. Since this is a client-side SPA form, add a comment justifying the preventDefault or refactor to use a `<button type="button">` for submission instead of `<form onSubmit>`.

  **Must NOT do**: Break form submission or Enter-key behavior.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: pattern fix.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: — | Blocked By: —

  **References**:
  - File: `apps/web-next/src/features/connect/components/connect-screen.tsx:95-110`

  **Acceptance Criteria**:
  - [ ] `react-doctor/no-prevent-default` warning gone.
  - [ ] Enter key still submits the code form.

  **QA Scenarios**:
  ```
  Scenario: Form submit still works
    Tool: Playwright
    Steps: Navigate to /, type "123456", press Enter.
    Expected: handleConnect is called (observe network or console).
    Evidence: .sisyphus/evidence/task-T11-form.txt
  ```

  **Commit**: YES | Message: `fix(connect): resolve no-prevent-default in connect form` | Files: `apps/web-next/src/features/connect/components/connect-screen.tsx`

- [x] T12. Fix no-array-index-as-key in champion-picker

  **What to do**: `apps/web-next/src/features/champ-select/components/champion-picker.tsx:137`: `key={`${card.championId}-${index}`}`. Since `card.championId` alone may not be unique (duplicate cards possible), use a composite key or ensure cards are deduplicated. If `championId` is guaranteed unique within the visible cards array, use `key={card.championId}`.

  **Must NOT do**: Use bare index as key.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: single prop change.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: — | Blocked By: —

  **References**:
  - File: `apps/web-next/src/features/champ-select/components/champion-picker.tsx:129-140`

  **Acceptance Criteria**:
  - [ ] `react-doctor/no-array-index-as-key` warning gone.
  - [ ] `bun run lint` passes.

  **QA Scenarios**:
  ```
  Scenario: Key warning gone
    Tool: Bash
    Steps: bun run doctor:react 2>&1 | grep "no-array-index-as-key"
    Expected: no match for champion-picker
    Evidence: .sisyphus/evidence/task-T12-key.txt
  ```

  **Commit**: YES | Message: `fix(champ-select): stable keys in champion-picker` | Files: `apps/web-next/src/features/champ-select/components/champion-picker.tsx`

- [x] T13. Fix no-autofocus in connect-screen and connect-entry-form

  **What to do**:
  1. `apps/web-next/src/features/connect/components/connect-screen.tsx:115`: Remove `autoFocus` from the code input. If focus is required, move it to a `useEffect(() => { inputRef.current?.focus() }, [])`.
  2. `apps/web-next/src/features/connect/components/connect-entry-form.tsx:50`: Same fix.

  **Must NOT do**: Leave autoFocus as a JSX prop.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: prop swap.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: — | Blocked By: —

  **References**:
  - File: `apps/web-next/src/features/connect/components/connect-screen.tsx:114-126`
  - File: `apps/web-next/src/features/connect/components/connect-entry-form.tsx:40-52`

  **Acceptance Criteria**:
  - [ ] `jsx-a11y/no-autofocus` warnings gone.
  - [ ] Input still receives focus on mount.

  **QA Scenarios**:
  ```
  Scenario: Focus still works
    Tool: Playwright
    Steps: Navigate to /, check document.activeElement.
    Expected: activeElement is the code input.
    Evidence: .sisyphus/evidence/task-T13-focus.txt
  ```

  **Commit**: YES | Message: `a11y(connect): move autoFocus to useEffect` | Files: `apps/web-next/src/features/connect/components/connect-screen.tsx`, `apps/web-next/src/features/connect/components/connect-entry-form.tsx`

- [x] T14. Refactor conduit-next App.tsx state (useRef + useReducer)

  **What to do**: In `apps/conduit-next/src/App.tsx`:
  1. **ConnectionState to useRef**: Convert `connectionState` from `useState` to `useRef`. The QR generation effect currently depends on `connectionState?.url`. Refactor the QR effect to read `connectionStateRef.current?.url` directly, and trigger QR regeneration via a separate `useEffect` that runs when `accessCode` changes (which is already a state). Ensure the initial setup populates the ref AND triggers a QR generation by setting `accessCode` (already done).
  2. **Group remaining state into useReducer**: The remaining 5 `useState` calls (`status`, `accessCode`, `showSettings`, `isGeneratingCode`, `copied`) are related to connection lifecycle. Group them into a single `useReducer` with actions like `SET_STATUS`, `SET_ACCESS_CODE`, `SET_SHOW_SETTINGS`, `SET_GENERATING`, `SET_COPIED`.
  3. **Fix no-cascading-set-state**: The setup `useEffect` currently calls 9 `setState` functions. Replace with a single `dispatch({ type: 'INITIALIZE', payload: { status, accessCode, connectionState } })`.

  **Must NOT do**: Break QR generation, connection status display, or copy-to-clipboard flow.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: state refactor in core component.
  - Skills: []

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: — | Blocked By: T4, T5

  **References**:
  - File: `apps/conduit-next/src/App.tsx` (full file)
  - Pattern: `useRef` + `useReducer` from React docs.

  **Acceptance Criteria**:
  - [ ] `react-doctor/prefer-useReducer`, `react-doctor/rerender-state-only-in-handlers`, and `react-doctor/no-cascading-set-state` warnings gone.
  - [ ] QR code still generates correctly when access code arrives.
  - [ ] Connection status updates correctly.
  - [ ] `bun run test` in `apps/conduit-next` passes.

  **QA Scenarios**:
  ```
  Scenario: QR generation works
    Tool: Playwright / interactive_bash
    Steps: Run conduit dev or test. Simulate connection state change with access code and URL.
    Expected: Canvas contains QR code.
    Evidence: .sisyphus/evidence/task-T14-qr.png

  Scenario: Status updates
    Tool: Playwright
    Steps: Simulate state transitions: Starting → Waiting → Connected → Paired.
    Expected: Status text and color update accordingly.
    Evidence: .sisyphus/evidence/task-T14-status.txt
  ```

  **Commit**: YES | Message: `refactor(conduit): useReducer and useRef in App state` | Files: `apps/conduit-next/src/App.tsx`

- [ ] T15. Split SocialPanel into focused subcomponents

  **What to do**: `apps/web-next/src/features/social/components/SocialPanel.tsx` is 445 lines (Doctor flags 379). Extract logical sections into focused components:
  1. `SocialPanelHeader` — header with title, status badge, settings dropdown.
  2. `SocialTabBar` — friends/chat tab buttons.
  3. `FriendsList` — grouped friends, collapse logic, invite buttons.
  4. `ChatPanel` — selected friend header, message list, message input form.
  5. `SocialSkeleton` — loading skeleton UI.
  6. `formatMessageTime` and `useTranslatedStatusLabels` can stay as module-level helpers.

  Keep `SocialPanel` as the orchestrator that composes these subcomponents. Preserve all existing hooks, stores, and event handlers. Do NOT change styling or behavior.

  **Must NOT do**: Change any visual styling, translations, or data flow. Do NOT add new props that duplicate store selectors.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: component splitting with UI preservation.
  - Skills: [`vercel-composition-patterns`]

  **Parallelization**: Can Parallel: NO | Wave 4 | Blocks: — | Blocked By: T8

  **References**:
  - File: `apps/web-next/src/features/social/components/SocialPanel.tsx`
  - Pattern: Extract `SocialPanelHeader`, `SocialTabBar`, `FriendsList`, `ChatPanel`, `SocialSkeleton`.

  **Acceptance Criteria**:
  - [ ] `react-doctor/no-giant-component` warning gone for SocialPanel.
  - [ ] `bun run lint` passes.
  - [ ] `bun run test` passes.
  - [ ] Social panel renders identically (screenshot comparison).

  **QA Scenarios**:
  ```
  Scenario: Social panel renders
    Tool: Playwright
    Steps: Navigate to connected route with mock social data. Screenshot social panel.
    Expected: Matches baseline screenshot pixel-perfectly (allowing for dynamic data).
    Evidence: .sisyphus/evidence/task-T15-social.png

  Scenario: Chat flow works
    Tool: Playwright
    Steps: Select a friend, type a message, submit.
    Expected: Message appears in chat list.
    Evidence: .sisyphus/evidence/task-T15-chat.png
  ```

  **Commit**: YES | Message: `refactor(social): split SocialPanel into focused subcomponents` | Files: `apps/web-next/src/features/social/components/SocialPanel.tsx` + new files

- [ ] T16. Redesign LobbyMember boolean props

  **What to do**: `apps/web-next/src/features/lobby/components/lobby-member.tsx:7-15`: `LobbyMemberProps` has 4 boolean-like props (`isActionPending`, `isConnected`, `isOwner`, `showRoles`). Convert to a discriminated union or compound component pattern.

  **Option A (Recommended)**: Replace booleans with explicit variants:
  ```ts
  type LobbyMemberProps = {
    member: LobbyMemberType
    onKick: (member: LobbyMemberType) => Promise<void>
    onPromote: (member: LobbyMemberType) => Promise<void>
  } & (
    | { variant: 'readonly'; showRoles: boolean }
    | { variant: 'manageable'; showRoles: boolean }
  )
  ```
  Derive `canManage` from `variant === 'manageable'` instead of passing booleans.

  **Option B**: Use compound components if consumers need more flexibility.

  Update ALL call sites (use `lsp_find_references` on `LobbyMember`).

  **Must NOT do**: Leave boolean props in place. Do NOT change the rendered HTML structure.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: API redesign with consumer updates.
  - Skills: [`vercel-composition-patterns`]

  **Parallelization**: Can Parallel: NO | Wave 4 | Blocks: — | Blocked By: —

  **References**:
  - File: `apps/web-next/src/features/lobby/components/lobby-member.tsx`
  - Consumers: find all with `lsp_find_references` on `LobbyMember` export.

  **Acceptance Criteria**:
  - [ ] `react-doctor/no-many-boolean-props` warning gone.
  - [ ] All call sites updated.
  - [ ] `bun run lint` and `bun run test` pass.

  **QA Scenarios**:
  ```
  Scenario: Lobby member renders
    Tool: Playwright
    Steps: Navigate to lobby with members. Screenshot member list.
    Expected: Same visual output as before.
    Evidence: .sisyphus/evidence/task-T16-lobby.png
  ```

  **Commit**: YES | Message: `refactor(lobby): replace boolean props with explicit variant` | Files: `apps/web-next/src/features/lobby/components/lobby-member.tsx` + consumers

- [ ] T17. Redesign champion-picker boolean props

  **What to do**: `apps/web-next/src/features/champ-select/components/champion-picker.tsx:13-28`: `ChampionPickerProps` has many boolean-like props (`isMyTurn`, `isAram`, `hasSelectedAramCard`, `canReroll`, `isLoading`). Convert to explicit variants or state objects.

  **Recommended approach**: Group ARAM-specific state into an `aram` object prop, and phase state into a `phaseState` object:
  ```ts
  type ChampionPickerProps = {
    champions: ChampionSummary[]
    selectedChampion: ChampionSummary | null
    bannedChampions: ChampionId[]
    pickedChampionIds: Set<ChampionId>
    onSelectChampion: (championId: ChampionId) => void
    onSelectAramCard: (index: number) => void
    onDrawCards: () => void
    availableAramChampionIds: ChampionId[]
    mode: 'classic' | 'aram'
    aramState: {
      cards: ChampionCard[]
      hasSelectedCard: boolean
      canReroll: boolean
    } | null
    phaseState: {
      isMyTurn: boolean
      phase: string
      isLoading: boolean
    }
  }
  ```

  Update ALL call sites (find in `champ-select/route.tsx` and any other consumers).

  **Must NOT do**: Leave boolean props in place. Do NOT change picker behavior.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: API redesign with consumer updates.
  - Skills: [`vercel-composition-patterns`]

  **Parallelization**: Can Parallel: NO | Wave 4 | Blocks: — | Blocked By: T12

  **References**:
  - File: `apps/web-next/src/features/champ-select/components/champion-picker.tsx`
  - Primary consumer: `apps/web-next/src/routes/connected/champ-select/route.tsx:72-93`

  **Acceptance Criteria**:
  - [ ] `react-doctor/no-many-boolean-props` warning gone.
  - [ ] All call sites updated.
  - [ ] `bun run lint` and `bun run test` pass.

  **QA Scenarios**:
  ```
  Scenario: Champion picker renders
    Tool: Playwright
    Steps: Navigate to champ-select. Screenshot picker.
    Expected: Same visual output as before.
    Evidence: .sisyphus/evidence/task-T17-picker.png
  ```

  **Commit**: YES | Message: `refactor(champ-select): replace boolean props with state objects` | Files: `apps/web-next/src/features/champ-select/components/champion-picker.tsx` + consumers

- [ ] T18. Split rune-editor into focused subcomponents

  **What to do**: `apps/web-next/src/features/champ-select/components/rune-editor.tsx` is 342 lines (Doctor flags it at line 42). Extract logical sections:
  1. `RuneTreeSelector` — primary and secondary tree icon buttons.
  2. `PrimaryRuneGrid` — primary tree slots and rune buttons.
  3. `SecondaryRuneGrid` — secondary tree slots and rune buttons.
  4. `StatShardGrid` — stat shard rows.
  5. `RunePageControls` — page select, create, delete buttons.

  Keep `RuneEditor` as the orchestrator. Preserve all handlers, state, and styling.

  **Must NOT do**: Change any rune selection logic or styling.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: component splitting with UI preservation.
  - Skills: [`vercel-composition-patterns`]

  **Parallelization**: Can Parallel: NO | Wave 4 | Blocks: — | Blocked By: T7

  **References**:
  - File: `apps/web-next/src/features/champ-select/components/rune-editor.tsx`

  **Acceptance Criteria**:
  - [ ] `react-doctor/no-giant-component` warning gone for rune-editor.
  - [ ] `bun run lint` and `bun run test` pass.
  - [ ] Rune editor renders identically.

  **QA Scenarios**:
  ```
  Scenario: Rune editor renders
    Tool: Playwright
    Steps: Navigate to champ-select. Screenshot rune editor.
    Expected: Same visual output as before.
    Evidence: .sisyphus/evidence/task-T18-runes.png
  ```

  **Commit**: YES | Message: `refactor(champ-select): split RuneEditor into focused subcomponents` | Files: `apps/web-next/src/features/champ-select/components/rune-editor.tsx` + new files

- [ ] T19. Split lobby route into focused subcomponents

  **What to do**: `apps/web-next/src/routes/connected/lobby/route.tsx` is 602 lines (Doctor flags it at line 74). Extract logical sections:
  1. `LobbyPlayScreen` — the view when `!isInLobby` (mode selection cards).
  2. `LobbyHeader` — compact header with title, mode badge, change mode button.
  3. `LobbyQueueCard` — queue status card with join/leave button.
  4. `LobbyMembersStrip` — horizontal member list.
  5. `LobbyBottomSheets` — role picker and invites bottom sheets.
  6. `LobbyInviteOverlay` — invite overlay wrapper.

  Keep `LobbyRouteComponent` as the orchestrator. Preserve all hooks, mutations, and navigation.

  **Must NOT do**: Change navigation, queue joining logic, or member actions.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: component splitting with UI preservation.
  - Skills: [`vercel-composition-patterns`]

  **Parallelization**: Can Parallel: NO | Wave 4 | Blocks: — | Blocked By: T6, T9

  **References**:
  - File: `apps/web-next/src/routes/connected/lobby/route.tsx`

  **Acceptance Criteria**:
  - [ ] `react-doctor/no-giant-component` warning gone for lobby route.
  - [ ] `bun run lint` and `bun run test` pass.
  - [ ] Lobby renders identically.

  **QA Scenarios**:
  ```
  Scenario: Lobby renders
    Tool: Playwright
    Steps: Navigate to lobby. Screenshot lobby page.
    Expected: Same visual output as before.
    Evidence: .sisyphus/evidence/task-T19-lobby.png
  ```

  **Commit**: YES | Message: `refactor(lobby): split LobbyRouteComponent into focused subcomponents` | Files: `apps/web-next/src/routes/connected/lobby/route.tsx` + new files

## Final Verification Wave (MANDATORY — after ALL implementation tasks)
> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.
- [ ] F1. Plan Compliance Audit — oracle
- [ ] F2. Code Quality Review — unspecified-high
- [ ] F3. Real Manual QA — unspecified-high (+ playwright if UI)
- [ ] F4. Scope Fidelity Check — deep

## Commit Strategy
- Wave 1 commits: `chore(web-next): remove dead code`, `chore(config): ignore intentional dead code in knip`, `fix(conduit): accessibility and async ordering in App`, `chore(conduit): remove unused AboutWindow.ts`
- Wave 2 commits: individual `perf(...)` and `fix(...)` commits per task.
- Wave 3 commit: `refactor(conduit): useReducer and useRef in App state`
- Wave 4 commits: `refactor(social): split SocialPanel into focused subcomponents`, `refactor(lobby): replace boolean props with explicit variant`, `refactor(champ-select): replace boolean props with state objects`
- Final commit (if needed): `chore: format and lint fixes`

## Success Criteria
- `bun run doctor:react:check` exits 0 with `apps/web-next` 100/100 and `apps/conduit-next` 100/100.
- `bun run fmt:check`, `bun run lint`, `bun run test`, `bun run build` all exit 0.
- No user-facing behavior changes.
- All deleted code has audit evidence.
