# Step 0: Sona Integration — LCU Types, Asset Resolver & Patterns

## TL;DR
> **Summary**: Port battle-tested LCU type definitions, asset resolution utilities, and data-fetching patterns from the open-source Sona project (WJZ-P/sona) into Mimic. This step builds the data-contract foundation that makes all downstream UI plans possible: complete champion identities, fuzzy search, edge-case-safe LCU parsers, and deduped request patterns.
> **Deliverables**: LCU type augmentations, `AssetResolver` service, `FuzzySearch` utility, normalized LCU parsers, deduped-fetch pattern.
> **Effort**: Short
> **Parallel**: YES — types, assets, and parsers can be ported in parallel.
> **Critical Path**: Blocks Plan 00-T6 (ChampionIdentity), Plan 01-T1 (ChampionPicker), Plan 03-T1 (Members refactor).

## Context

### Original Request
User requested exploration of https://github.com/WJZ-P/sona/tree/main for reusable LCU interfaces and patterns that could improve Mimic's data layer.

### Why This Step Exists
Sona has a mature, well-typed LCU layer and asset resolution system. Mimic currently suffers from:
- Raw champion IDs displayed in UI (no name/avatar resolution)
- Limited LCU TypeScript coverage
- No fuzzy search for champions
- Ad-hoc LCU parsing without edge-case normalization

Porting Sona's proven patterns upfront prevents re-implementing them in Plans 00–05.

### Depends On
- Nothing — this is the new first step.
- **Blocks**: Plan 00-T6 (ChampionIdentity), Plan 01-T1 (ChampionPicker refactor), Plan 03-T1 (Members refactor).

### Metis Guardrails
- MUST port only code that improves Mimic's current layer; do not adopt Pengu-specific bootstrap or transport.
- MUST NOT break existing Mimic LCU contracts in `rift/` or `packages/protocol-contract/`.
- MUST keep mobile-first constraints (lazy loading, small bundles, no desktop-only patterns).

## Work Objectives

### Core Objective
Strengthen Mimic's LCU type safety and asset resolution before any UI work begins, leveraging proven code from Sona.

### Deliverables
1. Augmented LCU TypeScript interfaces (champ-select session, lobby, player inventory, regalia).
2. `AssetResolver` service: champion/spell/rune icon resolution + fuzzy search by name.
3. Edge-case-safe LCU normalizers (array-vs-object shapes, null-vs-undefined fields).
4. Deduped-request pattern adapted for Zustand.
5. Documentation of what was ported vs ignored.

### Definition of Done
```bash
# 1. Asset resolver exists
ls web/src/lib/asset-resolver.ts

# 2. Fuzzy search exists
ls web/src/lib/fuzzy-search.ts

# 3. LCU types augmented
grep -n "ChampSelectSession\|LobbyDto" packages/protocol-contract/src/lcu/lcu-types.ts

# 4. Build passes
bun run build
```

### Must Have
- Champion ID → name, title, avatar, splash resolution (no raw IDs in UI).
- Fuzzy champion search by partial name.
- Spell ID → icon + name resolution.
- Perk/rune ID → icon + name resolution.
- Regalia inventory normalized (handles array vs object shapes).
- Deduped fetch promise pattern available for Zustand stores.

### Must NOT Have
- MUST NOT port Pengu-specific plugin bootstrap (`src/index.tsx` injection).
- MUST NOT port Sona's custom store (`src/lib/store.ts`) — Mimic uses Zustand.
- MUST NOT port desktop-only visual effects (`ChampSelectIconEffect.tsx` particles).
- MUST NOT port Match History or Game Analysis modals (out of scope).

## Verification Strategy
- Unit tests for AssetResolver (known champion IDs resolve correctly).
- Unit tests for fuzzy search (partial matches work).
- Type-check: `bun run build` with zero new `any` regressions.

## Execution Strategy

### Dependency Matrix
| Task | Blocks | Blocked By |
|------|--------|------------|
| T1 Port LCU types | T2, T3 | — |
| T2 Port AssetResolver | — | T1 |
| T3 Port normalizers | — | T1 |
| T4 Deduped fetch pattern | — | — |
| T5 Fuzzy search utility | — | T2 |

## TODOs

- [x] T1: Port LCU Type Definitions from Sona

  **What to do**: Copy and adapt relevant LCU TypeScript interfaces from `sona/src/types/lcu.ts` into `packages/protocol-contract/src/lcu/lcu-types.ts`. Focus on:
  - `ChampSelectSession` (player cells, actions, timer)
  - `LobbyDto` (lobby members, game config, ready check)
  - `PlayerInventory` / `RegaliaInventory` (edge-case: array vs object)
  - `EntitlementsToken` (if needed for asset auth)
  
  Adapt field names to match Mimic's existing conventions where they differ. Remove Sona-specific fields that Mimic doesn't use.
  **Must NOT do**: Do not port chat or friend-list types (out of scope). Do not break existing Mimic types.

  **Recommended Agent Profile**:
  - Category: `deep`
  - Skills: `typescript-advanced-types`

  **Parallelization**: YES | Blocks: T2, T3 | Blocked By: —

  **References**:
  - Source: `https://github.com/WJZ-P/sona/blob/main/src/types/lcu.ts`
  - Target: `packages/protocol-contract/src/lcu/lcu-types.ts`
  - Existing: `packages/protocol-contract/src/index.ts`

  **Acceptance Criteria**:
  - [x] `ChampSelectSession` type covers all fields used by Mimic's champ-select store.
  - [x] `LobbyDto` type covers all fields used by Mimic's lobby store.
  - [x] Regalia inventory type handles both `array` and `object` shapes (union type or normalizer).
  - [x] Zero `any` types introduced.

  **QA Scenarios**:
  ```
  Scenario: Types compile
    Tool: Bash
    Steps: bun run build
    Expected: Zero type errors
    Evidence: .sisyphus/evidence/step-0-t1-types-compile.log

  Scenario: Regalia union type
    Tool: Bash
    Steps: grep -n "RegaliaInventory" packages/protocol-contract/src/lcu/lcu-types.ts
    Expected: Union or discriminated type present
    Evidence: .sisyphus/evidence/step-0-t1-regalia-type.ts
  ```

  **Commit**: YES | `feat(protocol): port LCU types from Sona` | Files: `packages/protocol-contract/src/lcu/lcu-types.ts`

- [x] T2: Port Asset Resolver Service

  **What to do**: Create `web/src/lib/asset-resolver.ts` based on `sona/src/lib/assets.ts`. Provide functions:
  - `resolveChampionIcon(championId: number): string` → Data Dragon URL
  - `resolveChampionSplash(championId: number): string` → Data Dragon URL
  - `resolveSpellIcon(spellId: number): string` → Data Dragon URL
  - `resolvePerkIcon(perkId: number): string` → Data Dragon URL
  - `getChampionName(championId: number): string | undefined`
  - `getChampionTitle(championId: number): string | undefined`
  - `getSpellName(spellId: number): string | undefined`
  - `getPerkName(perkId: number): string | undefined`
  
  Load data from existing cached queries in Mimic: `useChampions()` and `useRunes()` from `web/src/core/http/ddragon-client.ts`, plus `summonerSpellsDescriptor` from `web/src/core/lcu/lcu-queries.ts` for spell data. Pass the cached data into the resolver functions as arguments (do not call hooks inside the resolver). Do NOT re-fetch from Data Dragon — use existing cache.
  **Must NOT do**: Do not load assets at module level (lazy/cached only). Do not add fuzzy search here (T5).

  **Recommended Agent Profile**:
  - Category: `deep`
  - Skills: []

  **Parallelization**: YES | Blocks: T5 | Blocked By: T1

  **References**:
  - Source: `https://github.com/WJZ-P/sona/blob/main/src/lib/assets.ts`
  - Existing: `web/src/core/http/ddragon-client.ts` — `useChampions()`, `useRunes()`
  - Existing: `web/src/core/lcu/lcu-queries.ts` — `summonerSpellsDescriptor`
  - Target: `web/src/lib/asset-resolver.ts`

  **Acceptance Criteria**:
  - [x] `resolveChampionIcon(266)` returns valid Data Dragon URL for Aatrox.
  - [x] `getChampionName(266)` returns `"Aatrox"`.
  - [x] `getChampionName(99999)` returns `undefined` (no crash).
  - [x] All functions memoized/cached (no repeated lookups).

  **QA Scenarios**:
  ```
  Scenario: Champion resolution
    Tool: Bash
    Steps: bun test web/src/lib/asset-resolver.test.ts
    Expected: All resolution tests pass
    Evidence: .sisyphus/evidence/step-0-t2-asset-resolver.log
  ```

  **Commit**: YES | `feat(web): add AssetResolver for champion/spell/perk icons` | Files: `web/src/lib/asset-resolver.ts`

- [x] T3: Port Edge-Case Normalizers

  **What to do**: Create `web/src/lib/lcu-normalizers.ts` based on `sona/src/lib/lcu.ts` normalization patterns. Handle:
  - Regalia inventory: `Array<{...}> | {[slotId: string]: {...}}` → normalized array
  - Region/platform mapping: map LCU platform to SGP region code
  - Empty/null championPickIntent: `number | undefined` (not `0` or `null`)
  - Missing player slots in lobby: fill with placeholder objects
  
  These normalizers wrap raw LCU responses before they enter Zustand stores.
  **Must NOT do**: Do not implement SGP match history (out of scope).

  **Recommended Agent Profile**:
  - Category: `deep`
  - Skills: []

  **Parallelization**: YES | Blocks: — | Blocked By: T1

  **References**:
  - Source: `https://github.com/WJZ-P/sona/blob/main/src/lib/lcu.ts` (normalize functions)
  - Target: `web/src/lib/lcu-normalizers.ts`

  **Acceptance Criteria**:
  - [x] `normalizeRegaliaInventory(input)` handles both array and object shapes.
  - [x] `normalizeChampionPickIntent(value)` returns `undefined` for `0`/`null`/`undefined`.
  - [x] All normalizers are pure functions (no side effects).

  **QA Scenarios**:
  ```
  Scenario: Regalia array vs object
    Tool: Bash
    Steps: bun test web/src/lib/lcu-normalizers.test.ts
    Expected: Both shapes normalize to same output
    Evidence: .sisyphus/evidence/step-0-t3-normalizers.log
  ```

  **Commit**: YES | `feat(web): add LCU edge-case normalizers` | Files: `web/src/lib/lcu-normalizers.ts`

- [x] T4: Adapt Deduped-Fetch Pattern for Zustand

  **What to do**: Create a utility `createDedupedQuery<T>(fetcher: () => Promise<T>)` in `web/src/lib/deduped-query.ts`. Pattern from `sona/src/lib/features.ts`:
  ```ts
  let promise: Promise<T> | null = null;
  return () => {
    if (!promise) promise = fetcher().finally(() => { promise = null; });
    return promise;
  };
  ```
  Integrate with Zustand stores so that concurrent selectors sharing the same fetch only trigger one request. Example usage in `useChampSelectStore`.
  **Must NOT do**: Do not replace Zustand with Sona's custom store.

  **Recommended Agent Profile**:
  - Category: `deep`
  - Skills: `zustand`

  **Parallelization**: YES | Blocks: — | Blocked By: —

  **References**:
  - Source: `https://github.com/WJZ-P/sona/blob/main/src/lib/features.ts` (promise dedupe)
  - Target: `web/src/lib/deduped-query.ts`

  **Acceptance Criteria**:
  - [x] Concurrent calls to same deduped query return shared promise.
  - [x] Promise resets after resolution (allows re-fetch).
  - [x] Works with Zustand selectors.

  **QA Scenarios**:
  ```
  Scenario: Deduped concurrent fetch
    Tool: Bash
    Steps: bun test web/src/lib/deduped-query.test.ts
    Expected: Only one fetch executed for 5 concurrent calls
    Evidence: .sisyphus/evidence/step-0-t4-deduped.log
  ```

  **Commit**: YES | `feat(web): add deduped query utility` | Files: `web/src/lib/deduped-query.ts`

- [x] T5: Port Fuzzy Champion Search

  **What to do**: Create `web/src/lib/fuzzy-search.ts` based on `sona/src/lib/assets.ts` fuzzy search. Provide:
  - `fuzzySearchChampions(query: string): Champion[]` — case-insensitive, partial match on name/title/alias.
  - `fuzzySearchSpells(query: string): Spell[]` — same for summoner spells.
  - Rank results by relevance (exact match > startsWith > includes).
  
  Use cached champion data from `useChampions()` (in `web/src/core/http/ddragon-client.ts`) as the search corpus. For spells, use `summonerSpellsDescriptor` (in `web/src/core/lcu/lcu-queries.ts`). No external fuzzy library unless approved.
  **Must NOT do**: Do not add fuzzy search to AssetResolver (keep separate concerns).

  **Recommended Agent Profile**:
  - Category: `deep`
  - Skills: []

  **Parallelization**: YES | Blocks: — | Blocked By: T2

  **References**:
  - Source: `https://github.com/WJZ-P/sona/blob/main/src/lib/assets.ts` (fuzzy search)
  - Target: `web/src/lib/fuzzy-search.ts`

  **Acceptance Criteria**:
  - [x] `fuzzySearchChampions("aatr")` returns Aatrox as top result.
  - [x] `fuzzySearchChampions("yas")` returns Yasuo.
  - [x] Empty query returns all champions (or empty array).
  - [x] Case-insensitive.

  **QA Scenarios**:
  ```
  Scenario: Fuzzy champion search
    Tool: Bash
    Steps: bun test web/src/lib/fuzzy-search.test.ts
    Expected: Partial matches return correct champions ranked
    Evidence: .sisyphus/evidence/step-0-t5-fuzzy-search.log
  ```

  **Commit**: YES | `feat(web): add fuzzy search for champions and spells` | Files: `web/src/lib/fuzzy-search.ts`

## Final Verification Wave (MANDATORY)
> ALL must APPROVE. Wait for user explicit "okay" before completing.
- [x] F1. Plan Compliance Audit — oracle
  ```
  Tool: Bash
  Steps: grep -r "asset-resolver\|fuzzy-search\|lcu-normalizers\|deduped-query" web/src/features/champ-select web/src/features/lobby packages/protocol-contract/src
  Expected: All 4 modules are imported by at least one downstream file
  Evidence: .sisyphus/evidence/step-0-f1-compliance.log
  ```
- [x] F2. Code Quality Review — unspecified-high
  ```
  Tool: Bash
  Steps: bun run lint && bun run fmt:check && grep -rn " any " web/src/lib/asset-resolver.ts web/src/lib/fuzzy-search.ts web/src/lib/lcu-normalizers.ts web/src/lib/deduped-query.ts
  Expected: lint and fmt pass; zero " any " matches in ported files
  Evidence: .sisyphus/evidence/step-0-f2-quality.log
  ```
- [x] F3. Integration QA — unspecified-high
  ```
  Tool: Bash
  Steps: bun test web/src/lib/asset-resolver.test.ts web/src/lib/fuzzy-search.test.ts web/src/lib/lcu-normalizers.test.ts web/src/lib/deduped-query.test.ts
  Expected: All 4 test suites pass
  Evidence: .sisyphus/evidence/step-0-f3-integration.log
  ```
- [x] F4. Scope Fidelity Check — deep
  ```
  Tool: Bash
  Steps: grep -rn "ChampSelectIconEffect\|MatchHistoryModal\|GameAnalysisModal\|ProfileBackgroundPicker" web/src/lib web/src/features packages/protocol-contract/src
  Expected: Zero matches (none of the out-of-scope UI components were ported)
  Evidence: .sisyphus/evidence/step-0-f4-scope.log
  ```
