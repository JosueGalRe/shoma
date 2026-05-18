# Sho'ma Visual Rebrand — Work Plan

## TL;DR

> **Summary**: Complete visual rebrand of Sho'ma from its League-of-Legends-derived identity to a standalone, original brand. Create `@shoma/design-system` shared package, prototype 2–3 UI variations with `prototype` skill, conduct visual engineering review, migrate Loom and Conduit, replace all logo/icon assets, and establish TDD visual testing.
> **Deliverables**: `@shoma/design-system` package, updated Loom UI, updated Conduit UI/branding, new logo/icon assets, src-old inventory and cleanup
> **Effort**: Large
> **Parallel**: YES — 4 waves
> **Critical Path**: T1 (Design System Scaffold) → T2 (Token Contracts + Tests) → T3 (Visual Identity + Prototype) → T3b (Visual Engineering Review) → T6 (Token CSS) → T8-T9 (Primitives) → T11-T13 (Loom Migration) → F1-F4 (Verification)

## Context

### Original Request

Using `docs/migration/shoma-rebrand-summary.md` as reference, plan a graphic and design-level rebranding of Sho'ma with a visual agent involved in every decision.

### Interview Summary

- **Scope**: Full visual rebrand — colors, typography, logo, icons, layout
- **Brand guide**: None exists; agent visual will propose identity from scratch
- **Architecture**: Create `@shoma/design-system` shared workspace package
- **Legacy**: Explicitly OUT of scope (legacy/web/, legacy/conduit/ excluded)
- **src-old**: Inventory first, migrate useful patterns, then delete
- **Test strategy**: TDD visual — define tokens/colors in tests first
- **Visual agent**: Involved in all design decisions

### Metis Review (gaps addressed)

- **Scope tightened**: Exact surfaces defined (Loom routes, Conduit UI, Tauri icons, PWA assets, root README assets)
- **Design system API**: Will export tokens + core primitives only (Button, Card, Input, Badge, Alert, Avatar, Skeleton, Spinner, DropdownMenu, BottomSheet, BottomNav). NO app-domain components.
- **Visual agent checkpoints**: Identity direction + prototype → visual engineering review → token palette → typography → logo → component variants → final QA
- **Prototype skill**: Used in T3 (identity) and T4 (logo) to explore radical variations before committing
- **Visual engineering review**: T3b validates feasibility, performance, accessibility, and cross-platform consistency before implementation
- **IP guardrail**: Explicitly forbid Riot/League-derived logo shapes, colors, typography, or champion/item-like iconography
- **Accessibility**: WCAG 2.2 AA minimum for contrast, focus states, keyboard behavior
- **Theme**: Dark mode primary (gaming product context). Light mode is future consideration, not required now.
- **src-old guardrail**: Inventory and explicit extraction decision before any deletion
- **Tailwind v4**: CSS-first imports across workspace boundaries; design-system exports CSS layers

## Work Objectives

### Core Objective

Establish a cohesive, original visual identity for Sho'ma and implement it across all active frontend surfaces via a shared design system.

### Deliverables

1. `@shoma/design-system` workspace package (tokens, primitives, icons)
2. Updated Loom visual system (styles, components, routes)
3. Updated Conduit visual system (React UI, Tauri icons)
4. New Sho'ma logo and icon assets (SVG source + raster exports)
5. src-old inventory report and cleanup
6. TDD visual test suite (token contracts, contrast, component variants)
7. Visual identity prototypes (2–3 UI variations) with evidence
8. Visual engineering review report (APPROVE/REQUEST_CHANGES)

### Definition of Done (verifiable conditions with commands)

- `bun run test` passes in all workspaces
- `bun run lint` passes in all workspaces
- `bun run build` passes for `@shoma/loom`, `@shoma/conduit`, `@shoma/design-system`
- `bun run doctor:react` score >= 75 for Loom
- Token contract tests verify all semantic tokens exist
- Contrast tests assert WCAG AA ratios
- Playwright screenshots captured for Loom routes and Conduit screens
- `legacy/**` has zero modified files (verified by git diff)
- `leyline/**` has zero visual-rebrand-related changes

### Must Have

- [ ] `@shoma/design-system` package created and wired into workspace
- [ ] Semantic design tokens (color, spacing, typography, radius, shadow, animation)
- [ ] Dark mode implementation (primary)
- [ ] Core UI primitives migrated to design system (11 components)
- [ ] Loom app shell and all routes visually rebranded
- [ ] Conduit React UI visually rebranded
- [ ] Tauri app icons replaced (icon.png, icon.ico)
- [ ] PWA manifest, favicons, and browser icons updated
- [ ] Root README logo asset updated
- [ ] TDD visual tests for tokens and components
- [ ] WCAG 2.2 AA contrast compliance
- [ ] src-old inventory completed
- [ ] Visual identity prototypes (2–3 UI variations) produced and reviewed
- [ ] Visual engineering review approved before implementation

### Must NOT Have (guardrails, AI slop patterns, scope boundaries)

- MUST NOT touch `legacy/web/`, `legacy/conduit/`, `legacy/rift/`
- MUST NOT change backend behavior in `leyline/`
- MUST NOT rename packages/apps
- MUST NOT introduce new features or redesign user flows beyond visual changes
- MUST NOT use Riot/League-derived visual assets, colors, or iconography
- MUST NOT add app-specific business logic inside `@shoma/design-system`
- MUST NOT use one-off page-specific tokens in the shared package
- MUST NOT delete `src-old/` without inventory and explicit extraction decision
- MUST NOT require human visual confirmation for acceptance criteria
- MUST NOT use vague criteria like "looks good" or "branding is updated"

## Verification Strategy

> ZERO HUMAN INTERVENTION — all verification is agent-executed.

- **Test decision**: TDD visual — token contracts and contrast tests written FIRST, then implementation
- **Framework**: Bun native test runner for unit/token tests, Playwright for visual regression
- **QA policy**: Every implementation task has agent-executed scenarios
- **Evidence**: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy

### Parallel Execution Waves

> Target: 5-8 tasks per wave.

**Wave 1: Foundation**

- T1: Design system package scaffold
- T2: Token contracts + TDD tests
- T3: Visual identity direction + prototype (agent visual checkpoint)
- T3b: Visual engineering review
- T4: Logo design + asset exports
- T5: src-old inventory

**Wave 2: Design System Implementation**

- T6: Token CSS implementation
- T7: Typography system
- T8: Core primitives migration (Part 1)
- T9: Core primitives migration (Part 2)
- T10: Icon system

**Wave 3: Loom Migration**

- T11: Loom styles migration
- T12: Loom layout components migration
- T13: Loom routes rebranding

**Wave 4: Conduit + Root + Cleanup**

- T14: Conduit React UI rebranding
- T15: Conduit Tauri icons + manifest
- T16: Root assets + README
- T17: src-old cleanup

**Wave 5: Final Verification**

- F1: Plan Compliance Audit
- F2: Code Quality Review
- F3: Real Manual QA (Playwright)
- F4: Scope Fidelity Check

### Dependency Matrix (full, all tasks)

| Task  | Blocked By              | Blocks                         |
| ----- | ----------------------- | ------------------------------ |
| T1    | —                       | T2, T6, T8, T9                 |
| T2    | T1                      | T6, T8, T9, T11, T12, T13, T14 |
| T3    | —                       | T3b, T4, T6, T7                |
| T3b   | T3                      | T4, T6, T7                     |
| T4    | T3, T3b                 | T15, T16                       |
| T5    | —                       | T17                            |
| T6    | T1, T2, T3, T3b         | T8, T9, T11, T12, T14          |
| T7    | T3, T3b                 | T8, T9                         |
| T8    | T1, T2, T6, T7          | T11, T12, T13                  |
| T9    | T1, T2, T6, T7          | T11, T12, T13                  |
| T10   | T3, T3b                 | T8, T9                         |
| T11   | T6, T8, T9              | T13                            |
| T12   | T6, T8, T9              | T13                            |
| T13   | T11, T12                | —                              |
| T14   | T2, T6, T7              | —                              |
| T15   | T4                      | —                              |
| T16   | T4                      | —                              |
| T17   | T5, T13, T14, T15       | —                              |
| F1-F4 | T13, T14, T15, T16, T17 | —                              |

### Agent Dispatch Summary (wave → task count → categories)

- Wave 1: 6 tasks → quick (scaffold), deep (identity), visual-engineering (review), deep (logo), quick (inventory)
- Wave 2: 5 tasks → deep (tokens, typography, primitives, icons)
- Wave 3: 3 tasks → deep (migration)
- Wave 4: 4 tasks → deep (conduit), quick (icons, root), quick (cleanup)
- Wave 5: 4 tasks → oracle, unspecified-high, unspecified-high, deep

## TODOs

- [x] 1. Design System Package Scaffold

  **What to do**: Create `@shoma/design-system` workspace package with proper package.json, tsconfig.json, and entry points. Set up CSS-first Tailwind v4 compatibility for cross-workspace imports.

  **Must NOT do**: Add any components, tokens, or business logic yet. Do not modify existing apps.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: scaffolding is well-defined
  - Skills: [`typescript-advanced-types`] — Reason: workspace package types and exports
  - Omitted: [`react-patterns`] — Reason: no React components in this task

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T2, T6, T8, T9 | Blocked By: —

  **References**:
  - Pattern: `packages/protocol-contract/package.json` — follow workspace package structure
  - Pattern: `packages/protocol-contract/tsconfig.json` — follow TS config for workspace packages
  - Pattern: `loom/package.json` — see how Loom references `@shoma/protocol-contract`
  - External: `https://tailwindcss.com/docs/v4-beta` — Tailwind v4 CSS-first package exports

  **Acceptance Criteria**:
  - [ ] `packages/design-system/package.json` exists with name `@shoma/design-system`, version, exports field pointing to `./src/index.ts`
  - [ ] `packages/design-system/tsconfig.json` extends `../../tsconfig.base.json`
  - [ ] `packages/design-system/src/index.ts` exists as barrel export
  - [ ] Root `package.json` workspaces array includes `packages/design-system`
  - [ ] `bun install` exits 0
  - [ ] `bun run --filter @shoma/design-system build` exits 0 (if build script exists)

  **QA Scenarios**:

  ```
  Scenario: Package is resolvable from Loom
    Tool: Bash
    Steps: cd loom && bun run node -e "console.log(require.resolve('@shoma/design-system'))"
    Expected: Resolves to design-system/src/index.ts without error
    Evidence: .sisyphus/evidence/task-1-package-resolve.txt

  Scenario: Package is resolvable from Conduit
    Tool: Bash
    Steps: cd conduit && bun run node -e "console.log(require.resolve('@shoma/design-system'))"
    Expected: Resolves to design-system/src/index.ts without error
    Evidence: .sisyphus/evidence/task-1-package-resolve-conduit.txt
  ```

  **Commit**: YES | Message: `feat(design-system): scaffold @shoma/design-system package` | Files: `packages/design-system/**`, `package.json`

- [x] 2. Token Contracts + TDD Tests

  **What to do**: Define the semantic token contract for the design system and write tests FIRST. Tokens must include: background, foreground, primary, primary-foreground, secondary, accent, muted, border, ring, destructive. Include contrast ratio tests for WCAG 2.2 AA.

  **Must NOT do**: Implement the actual CSS tokens yet. Do not assume specific hex values.

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: TDD requires careful contract design
  - Skills: [`typescript-advanced-types`] — Reason: token type definitions
  - Omitted: [`react-patterns`] — Reason: no UI yet

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T6, T8, T9, T11, T12, T13, T14 | Blocked By: T1

  **References**:
  - Pattern: `loom/src/styles/design-tokens.css` — current token structure to understand what exists
  - Pattern: `loom/src/styles/typography.css` — current typography tokens
  - External: `https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html` — WCAG 2.2 AA contrast requirements

  **Acceptance Criteria**:
  - [ ] `packages/design-system/tests/token-contract.test.ts` exists with tests for all required semantic tokens
  - [ ] `packages/design-system/tests/contrast.test.ts` exists with contrast ratio assertions (4.5:1 for normal text, 3:1 for large text)
  - [ ] `packages/design-system/src/tokens/index.ts` exports a TypeScript type for the token contract
  - [ ] All tests FAIL initially (RED phase of TDD)
  - [ ] `bun test --filter @shoma/design-system` runs and shows expected failures

  **QA Scenarios**:

  ```
  Scenario: All token tests fail initially (RED)
    Tool: Bash
    Steps: bun run --filter @shoma/design-system test
    Expected: Exit code 0 or 1 with >0 failing tests for missing tokens
    Evidence: .sisyphus/evidence/task-2-tdd-red.txt

  Scenario: Token type is strongly typed
    Tool: Bash
    Steps: cd packages/design-system && bun run tsc --noEmit
    Expected: TypeScript compiles without errors
    Evidence: .sisyphus/evidence/task-2-types.txt
  ```

  **Commit**: YES | Message: `test(design-system): add token contract and contrast TDD tests` | Files: `packages/design-system/tests/**`, `packages/design-system/src/tokens/**`

- [x] 3. Visual Identity Direction + Prototype (Agent Visual Checkpoint)

  **What to do**: Agent visual proposes the Sho'ma visual identity direction using the `prototype` skill. Must produce: (a) a written identity brief, and (b) **2–3 radically different UI prototype variations** (e.g., dark tactical, minimal glassmorphism, neon cyberpunk) toggleable from a single route in Loom. The prototypes are throwaway — they flesh out the design space before committing. Output identity brief in `.sisyphus/evidence/task-3-identity-brief.md` and prototype evidence in `.sisyphus/evidence/task-3-prototypes/`.

  **Must NOT do**: Produce final assets or code for production. Prototypes are throwaway only. Must not use Riot/League-derived visual language.

  **Recommended Agent Profile**:
  - Category: `artistry` — Reason: creative visual direction
  - Skills: [`prototype`, `web-design-guidelines`] — Reason: `prototype` for radical UI variations; `web-design-guidelines` for accessibility and design system constraints
  - Omitted: [`tanstack-router-best-practices`] — Reason: not relevant for throwaway prototypes

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T3b, T4, T6, T7 | Blocked By: —

  **References**:
  - Context: `docs/migration/shoma-rebrand-summary.md` — product context
  - Context: `README.md` — product description
  - Pattern: `loom/src/styles/design-tokens.css` — current palette to move away from
  - External: `skill://prototype` — prototype skill for throwaway UI variations

  **Acceptance Criteria**:
  - [ ] Identity brief document exists at `.sisyphus/evidence/task-3-identity-brief.md`
  - [ ] Brief includes: color philosophy (dark mode primary), typography scale, spacing scale, shape language, motion principles, logo concept description
  - [ ] Brief explicitly avoids Riot/League visual language
  - [ ] Brief defines accessibility bar (WCAG 2.2 AA)
  - [ ] At least 2 UI prototype variations exist in `.sisyphus/evidence/task-3-prototypes/` (screenshots or runnable route evidence)

  **QA Scenarios**:

  ```
  Scenario: Identity brief is complete
    Tool: Bash
    Steps: test -f .sisyphus/evidence/task-3-identity-brief.md && wc -l .sisyphus/evidence/task-3-identity-brief.md
    Expected: File exists and has >50 lines
    Evidence: .sisyphus/evidence/task-3-brief-check.txt

  Scenario: Brief does not propose Riot/League-derived visual language
    Tool: Bash
    Steps: grep -iE "rune|hextech|noxus|demacia|ionia|bilgewater|void|summoner|poro|yordle|teemo|jinx|ahri" .sisyphus/evidence/task-3-identity-brief.md; echo "Exit: $?"
    Expected: No visual-identity matches (exit code 1). Product context mentions like "League of Legends client" are allowed.
    Evidence: .sisyphus/evidence/task-3-no-riot-visual.txt

  Scenario: Prototype variations exist
    Tool: Bash
    Steps: ls -1 .sisyphus/evidence/task-3-prototypes/ | wc -l
    Expected: >= 2 files (screenshots or route exports)
    Evidence: .sisyphus/evidence/task-3-prototypes-list.txt
  ```

  **Commit**: NO | Message: N/A | Files: N/A (evidence only)

- [x] 3b. Visual Engineering Review

  **What to do**: A `visual-engineering` agent reviews the T3 identity brief and prototypes. Validates: technical feasibility of tokens in Tailwind v4, performance of proposed animations, accessibility compliance, and cross-platform consistency (mobile Loom + desktop Conduit). Outputs a review report at `.sisyphus/evidence/task-3b-visual-review.md` with APPROVE or REQUEST_CHANGES.

  **Must NOT do**: Redesign or override the visual direction — only review for engineering feasibility. Do not produce code.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: frontend UI/UX engineering review
  - Skills: [`web-design-guidelines`, `vercel-react-best-practices`] — Reason: accessibility and React performance
  - Omitted: [`prototype`] — Reason: review phase, not exploration

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: T4, T6, T7 | Blocked By: T3

  **References**:
  - Context: `.sisyphus/evidence/task-3-identity-brief.md` — identity brief to review
  - Context: `.sisyphus/evidence/task-3-prototypes/` — prototypes to review
  - Pattern: `loom/src/styles/design-tokens.css` — current Tailwind v4 token structure
  - Pattern: `loom/src/styles/animations.css` — current animation patterns

  **Acceptance Criteria**:
  - [ ] Review report exists at `.sisyphus/evidence/task-3b-visual-review.md`
  - [ ] Report covers: token feasibility, animation performance, accessibility, cross-platform consistency
  - [ ] Report verdict is APPROVE or REQUEST_CHANGES with specific actionable feedback
  - [ ] If REQUEST_CHANGES, T3 is revisited before proceeding to T4

  **QA Scenarios**:

  ```
  Scenario: Review report is complete
    Tool: Bash
    Steps: test -f .sisyphus/evidence/task-3b-visual-review.md && wc -l .sisyphus/evidence/task-3b-visual-review.md
    Expected: File exists and has >30 lines
    Evidence: .sisyphus/evidence/task-3b-review-check.txt

  Scenario: Review has a clear verdict
    Tool: Bash
    Steps: grep -iE "APPROVE|REQUEST_CHANGES" .sisyphus/evidence/task-3b-visual-review.md
    Expected: Contains APPROVE or REQUEST_CHANGES
    Evidence: .sisyphus/evidence/task-3b-verdict.txt
  ```

  **Commit**: NO | Message: N/A | Files: N/A (evidence only)

- [x] 4. Logo Design + Asset Exports

  **What to do**: Based on T3 identity brief and T3b visual engineering review, agent visual designs the Sho'ma logo. Use the `prototype` skill to explore 2–3 radically different logo concepts before finalizing. Produce: SVG source, PNG exports (logo, favicon), and app icon sizes. Must be original work, not derivative of Riot/League IP.

  **Must NOT do**: Use AI-generated logos without ensuring originality. Do not overwrite assets before tests confirm paths.

  **Recommended Agent Profile**:
  - Category: `artistry` — Reason: logo design
  - Skills: [`prototype`, `web-design-guidelines`] — Reason: `prototype` for exploring logo concepts; `web-design-guidelines` for iconography and accessibility
  - Omitted: [`react-patterns`] — Reason: not relevant

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T15, T16 | Blocked By: T3, T3b

  **References**:
  - Context: `.sisyphus/evidence/task-3-identity-brief.md` — visual direction
  - Pattern: `assets/shoma-logo.png` — current logo to replace
  - Pattern: `loom/public/favicon.svg` — current favicon format
  - Pattern: `conduit/src-tauri/icons/icon.png` — current app icon format

  **Acceptance Criteria**:
  - [ ] `assets/shoma-logo.svg` exists (SVG source)
  - [ ] `assets/shoma-logo.png` exists (raster, >= 512x512)
  - [ ] `loom/public/favicon.svg` updated with new logo
  - [ ] `loom/public/icon-192.svg` updated with new logo
  - [ ] `conduit/src-tauri/icons/icon.png` updated (256x256 or 512x512)
  - [ ] `conduit/src-tauri/icons/icon.ico` updated
  - [ ] All exported assets pass `file` command validation

  **QA Scenarios**:

  ```
  Scenario: Logo assets exist and are valid
    Tool: Bash
    Steps: file assets/shoma-logo.svg assets/shoma-logo.png loom/public/favicon.svg conduit/src-tauri/icons/icon.png conduit/src-tauri/icons/icon.ico
    Expected: All files report valid image formats
    Evidence: .sisyphus/evidence/task-4-assets-valid.txt

  Scenario: SVG is valid XML
    Tool: Bash
    Steps: xmllint --noout assets/shoma-logo.svg 2>&1; echo "Exit: $?"
    Expected: Exit code 0
    Evidence: .sisyphus/evidence/task-4-svg-valid.txt
  ```

  **Commit**: YES | Message: `assets(brand): add Sho'ma logo and icon exports` | Files: `assets/**`, `loom/public/favicon.svg`, `loom/public/icon-192.svg`, `conduit/src-tauri/icons/**`

- [x] 5. src-old Inventory

  **What to do**: Inventory `loom/src-old/` to identify any patterns, assets, or tokens worth extracting before deletion. Produce inventory report at `.sisyphus/evidence/task-5-src-old-inventory.md`.

  **Must NOT do**: Delete or modify src-old/ yet. Do not copy files without explicit decision.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: inventory is read-only analysis
  - Skills: [] — Reason: no specialized skills needed
  - Omitted: [`react-patterns`] — Reason: not needed for inventory

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T17 | Blocked By: —

  **References**:
  - Source: `loom/src-old/styles.css` — archived theme
  - Source: `loom/src-old/components/ui/*` — archived primitives
  - Source: `loom/src-old/lib/utils.ts` — archived utilities

  **Acceptance Criteria**:
  - [ ] Inventory report exists at `.sisyphus/evidence/task-5-src-old-inventory.md`
  - [ ] Report lists every file in `loom/src-old/` with: path, purpose, extraction recommendation (YES/NO), reason
  - [ ] Report includes summary: total files, recommended extractions, safe deletions

  **QA Scenarios**:

  ```
  Scenario: Inventory covers all files
    Tool: Bash
    Steps: find loom/src-old -type f | wc -l; grep -c "^- " .sisyphus/evidence/task-5-src-old-inventory.md
    Expected: File count in src-old matches or is less than markdown list items
    Evidence: .sisyphus/evidence/task-5-inventory-complete.txt
  ```

  **Commit**: NO | Message: N/A | Files: N/A (evidence only)

- [x] 6. Token CSS Implementation

  **What to do**: Implement the semantic design tokens in CSS based on T3 identity brief. Use Tailwind v4 CSS-first `@theme` syntax. Tokens: background, foreground, primary, primary-foreground, secondary, accent, muted, border, ring, destructive. Include dark mode as default.

  **Must NOT do**: Use hardcoded hex values without semantic naming. Do not implement light mode.

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: CSS architecture and Tailwind v4
  - Skills: [`typescript-advanced-types`] — Reason: token type exports
  - Omitted: [`react-patterns`] — Reason: no React components

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: T8, T9, T11, T12, T14 | Blocked By: T1, T2, T3

  **References**:
  - Pattern: `loom/src/styles/design-tokens.css` — current token structure
  - Pattern: `loom/src/styles.css` — Tailwind v4 entrypoint
  - External: `https://tailwindcss.com/docs/v4-beta` — `@theme` syntax

  **Acceptance Criteria**:
  - [ ] `packages/design-system/src/styles/tokens.css` exists with all semantic tokens
  - [ ] `packages/design-system/src/styles/theme.css` imports tokens and defines `@theme`
  - [ ] All T2 token tests PASS (GREEN phase)
  - [ ] Contrast tests PASS with WCAG AA ratios
  - [ ] `bun run --filter @shoma/design-system build` exits 0

  **QA Scenarios**:

  ```
  Scenario: Token tests pass (GREEN)
    Tool: Bash
    Steps: bun run --filter @shoma/design-system test
    Expected: All tests pass (exit code 0)
    Evidence: .sisyphus/evidence/task-6-tdd-green.txt

  Scenario: Tokens are importable in CSS
    Tool: Bash
    Steps: cd loom && echo "@import '@shoma/design-system/src/styles/theme.css';" > /tmp/test-theme.css && bunx tailwindcss -i /tmp/test-theme.css -o /tmp/test-theme.out.css 2>&1
    Expected: No import errors
    Evidence: .sisyphus/evidence/task-6-css-import.txt
  ```

  **Commit**: YES | Message: `feat(design-system): implement semantic token CSS` | Files: `packages/design-system/src/styles/**`

- [x] 7. Typography System

  **What to do**: Implement the typography system based on T3 identity brief. Define font family, sizes (xs to 4xl), weights, line heights, and letter spacing. Export as CSS custom properties and Tailwind v4 theme values.

  **Must NOT do**: Use app-specific font choices. Must be suitable for both Loom (mobile) and Conduit (desktop).

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: typography scales require precision
  - Skills: [`web-design-guidelines`] — Reason: readability and accessibility
  - Omitted: [`tanstack-query-best-practices`] — Reason: not relevant

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: T8, T9 | Blocked By: T3

  **References**:
  - Pattern: `loom/src/styles/typography.css` — current typography rules
  - Pattern: `loom/package.json` — current font package dependencies

  **Acceptance Criteria**:
  - [ ] `packages/design-system/src/styles/typography.css` exists with font definitions
  - [ ] Typography tokens included in `@theme` (font-family, font-size, font-weight, line-height, letter-spacing)
  - [ ] `packages/design-system/tests/typography.test.ts` verifies all type scales exist
  - [ ] All typography tests pass

  **QA Scenarios**:

  ```
  Scenario: Typography tests pass
    Tool: Bash
    Steps: bun run --filter @shoma/design-system test
    Expected: All tests pass
    Evidence: .sisyphus/evidence/task-7-typography-tests.txt
  ```

  **Commit**: YES | Message: `feat(design-system): add typography system` | Files: `packages/design-system/src/styles/typography.css`, `packages/design-system/tests/typography.test.ts`

- [x] 8. Core Primitives Migration (Part 1)

  **What to do**: Migrate Button, Card, Input, Badge, Alert from `loom/src/components/ui/` to `@shoma/design-system`. Preserve all CVA variants, Radix functionality, and accessibility. Update imports in Loom to use the design system.

  **Must NOT do**: Lose any existing variant or behavior. Do not add new features.

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: component migration requires care
  - Skills: [`react-patterns`, `vercel-composition-patterns`] — Reason: component structure and composition
  - Omitted: [`tanstack-router-best-practices`] — Reason: not relevant

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: T11, T12, T13 | Blocked By: T1, T2, T6, T7

  **References**:
  - Pattern: `loom/src/components/ui/button.tsx` — CVA variants
  - Pattern: `loom/src/components/ui/card.tsx` — branded card
  - Pattern: `loom/src/components/ui/input.tsx` — input primitive
  - Pattern: `loom/src/components/ui/badge.tsx` — badge variants
  - Pattern: `loom/src/components/ui/alert.tsx` — alert variants

  **Acceptance Criteria**:
  - [ ] `packages/design-system/src/components/button.tsx` exists with all variants
  - [ ] `packages/design-system/src/components/card.tsx` exists
  - [ ] `packages/design-system/src/components/input.tsx` exists
  - [ ] `packages/design-system/src/components/badge.tsx` exists
  - [ ] `packages/design-system/src/components/alert.tsx` exists
  - [ ] Loom components re-export from `@shoma/design-system` OR import directly
  - [ ] `bun run test --filter @shoma/loom` passes

  **QA Scenarios**:

  ```
  Scenario: Button renders all variants
    Tool: Bash
    Steps: bun run --filter @shoma/design-system test --test-name-pattern "Button"
    Expected: All button variant tests pass
    Evidence: .sisyphus/evidence/task-8-button-variants.txt

  Scenario: Loom tests still pass
    Tool: Bash
    Steps: bun run --filter @shoma/loom test
    Expected: Exit code 0
    Evidence: .sisyphus/evidence/task-8-loom-tests.txt
  ```

  **Commit**: YES | Message: `feat(design-system): migrate button, card, input, badge, alert primitives` | Files: `packages/design-system/src/components/**`, `loom/src/components/ui/**`

- [x] 9. Core Primitives Migration (Part 2)

  **What to do**: Migrate Avatar, Skeleton, Spinner, DropdownMenu, BottomSheet, BottomNav from `loom/src/components/ui/` to `@shoma/design-system`. Update Loom imports.

  **Must NOT do**: Lose Radix behavior or accessibility. Do not add new features.

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: complex component migration
  - Skills: [`react-patterns`] — Reason: component behavior preservation
  - Omitted: [`tanstack-query-best-practices`] — Reason: not relevant

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: T11, T12, T13 | Blocked By: T1, T2, T6, T7

  **References**:
  - Pattern: `loom/src/components/ui/avatar.tsx` — avatar with status
  - Pattern: `loom/src/components/ui/skeleton.tsx` — skeleton loader
  - Pattern: `loom/src/components/ui/skeleton-shimmer.tsx` — shimmer variant
  - Pattern: `loom/src/components/ui/spinner.tsx` — spinner with i18n
  - Pattern: `loom/src/components/ui/dropdown-menu.tsx` — Radix dropdown
  - Pattern: `loom/src/components/ui/bottom-sheet.tsx` — draggable bottom sheet
  - Pattern: `loom/src/components/ui/bottom-nav.tsx` — mobile bottom nav

  **Acceptance Criteria**:
  - [ ] All 7 components migrated to `packages/design-system/src/components/`
  - [ ] Loom imports updated
  - [ ] `bun run test --filter @shoma/loom` passes

  **QA Scenarios**:

  ```
  Scenario: Loom tests pass after full migration
    Tool: Bash
    Steps: bun run --filter @shoma/loom test
    Expected: Exit code 0
    Evidence: .sisyphus/evidence/task-9-loom-tests.txt
  ```

  **Commit**: YES | Message: `feat(design-system): migrate avatar, skeleton, spinner, dropdown, bottom-sheet, bottom-nav` | Files: `packages/design-system/src/components/**`, `loom/src/components/ui/**`

- [x] 10. Icon System

  **What to do**: Create a unified icon system for `@shoma/design-system`. Evaluate whether to keep Lucide (current) or switch to a custom icon set. If keeping Lucide, establish icon sizing and color token integration. Export `Icon` wrapper component.

  **Must NOT do**: Introduce multiple icon libraries. Must not use League/Riot-derived icons.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: decision + wrapper component
  - Skills: [`web-design-guidelines`] — Reason: icon accessibility
  - Omitted: [`tanstack-router-best-practices`] — Reason: not relevant

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: T8, T9 | Blocked By: T3

  **References**:
  - Pattern: `loom/components.json` — shows Lucide is current icon library
  - Pattern: `loom/src/components/ui/icon-grid-selector.tsx` — custom icon usage

  **Acceptance Criteria**:
  - [ ] `packages/design-system/src/components/icon.tsx` exists as wrapper
  - [ ] Icon component accepts `size` and `className` props
  - [ ] Icon colors use design system tokens
  - [ ] Decision documented: `.sisyphus/evidence/task-10-icon-decision.md`

  **QA Scenarios**:

  ```
  Scenario: Icon wrapper renders
    Tool: Bash
    Steps: bun run --filter @shoma/design-system test --test-name-pattern "Icon"
    Expected: Tests pass
    Evidence: .sisyphus/evidence/task-10-icon-tests.txt
  ```

  **Commit**: YES | Message: `feat(design-system): add icon system` | Files: `packages/design-system/src/components/icon.tsx`, `.sisyphus/evidence/task-10-icon-decision.md`

- [x] 11. Loom Styles Migration

  **What to do**: Migrate Loom's global styles to use `@shoma/design-system`. Update `loom/src/styles.css` to import the design system theme. Remove or deprecate `loom/src/styles/design-tokens.css`, `typography.css`, `animations.css` in favor of the shared package.

  **Must NOT do**: Break any existing animations or reduced-motion handling. Do not leave orphaned CSS files.

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: global style migration can have cascading effects
  - Skills: [`react-patterns`] — Reason: understanding component style dependencies
  - Omitted: [`tanstack-router-best-practices`] — Reason: not relevant

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: T13 | Blocked By: T6, T8, T9

  **References**:
  - Pattern: `loom/src/styles.css` — current Tailwind entrypoint
  - Pattern: `loom/src/styles/design-tokens.css` — current tokens to replace
  - Pattern: `loom/src/styles/animations.css` — current animations
  - Pattern: `packages/design-system/src/styles/theme.css` — new theme

  **Acceptance Criteria**:
  - [ ] `loom/src/styles.css` imports `@shoma/design-system/src/styles/theme.css`
  - [ ] `loom/src/styles/design-tokens.css` removed or reduced to app-specific overrides only
  - [ ] `loom/src/styles/typography.css` removed or reduced
  - [ ] `loom/src/styles/animations.css` preserved if not in design system yet
  - [ ] `bun run --filter @shoma/loom build` exits 0
  - [ ] `bun run test --filter @shoma/loom` passes

  **QA Scenarios**:

  ```
  Scenario: Loom build passes after style migration
    Tool: Bash
    Steps: bun run --filter @shoma/loom build
    Expected: Exit code 0
    Evidence: .sisyphus/evidence/task-11-loom-build.txt

  Scenario: Loom tests pass after style migration
    Tool: Bash
    Steps: bun run --filter @shoma/loom test
    Expected: Exit code 0
    Evidence: .sisyphus/evidence/task-11-loom-tests.txt
  ```

  **Commit**: YES | Message: `refactor(loom): migrate styles to @shoma/design-system` | Files: `loom/src/styles.css`, `loom/src/styles/**`

- [x] 12. Loom Layout Components Migration

  **What to do**: Migrate AppShell, SafeArea, and LandscapeWarning from `loom/src/components/layout/` to use `@shoma/design-system` tokens. Update background colors, spacing, and responsive behavior to match the new identity.

  **Must NOT do**: Change layout structure or break safe-area behavior. Do not add new layout components.

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: layout changes affect all routes
  - Skills: [`react-patterns`, `vercel-composition-patterns`] — Reason: layout composition
  - Omitted: [`tanstack-query-best-practices`] — Reason: not relevant

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: T13 | Blocked By: T6, T8, T9

  **References**:
  - Pattern: `loom/src/components/layout/AppShell.tsx` — app shell
  - Pattern: `loom/src/components/layout/SafeArea.tsx` — safe area
  - Pattern: `loom/src/components/layout/LandscapeWarning.tsx` — orientation warning
  - Pattern: `packages/design-system/src/styles/tokens.css` — spacing tokens

  **Acceptance Criteria**:
  - [ ] AppShell uses design system background and foreground tokens
  - [ ] SafeArea uses design system spacing tokens
  - [ ] LandscapeWarning uses design system color tokens
  - [ ] All layout components render without errors
  - [ ] `bun run test --filter @shoma/loom` passes

  **QA Scenarios**:

  ```
  Scenario: Layout components render correctly
    Tool: Bash
    Steps: bun run --filter @shoma/loom test --test-name-pattern "layout|AppShell|SafeArea"
    Expected: Tests pass
    Evidence: .sisyphus/evidence/task-12-layout-tests.txt
  ```

  **Commit**: YES | Message: `refactor(loom): migrate layout components to design system tokens` | Files: `loom/src/components/layout/**`

- [x] 13. Loom Routes Rebranding

  **What to do**: Update all Loom routes to use the new visual identity. This includes: connect screen, connected shell, lobby route, and any sub-routes. Apply new colors, typography, spacing, and component variants. Ensure the visual agent reviews key screens.

  **Must NOT do**: Change routing structure or user flows. Do not add new features.

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: route-level changes are high-impact
  - Skills: [`react-patterns`, `tanstack-router-best-practices`] — Reason: route composition and data loading
  - Omitted: [`tanstack-query-best-practices`] — Reason: not relevant for visual changes

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: — | Blocked By: T11, T12

  **References**:
  - Pattern: `loom/src/routes/connected/route.tsx` — main shell
  - Pattern: `loom/src/routes/connected/lobby/route.tsx` — lobby screen
  - Pattern: `loom/src/features/connect/components/connect-screen.tsx` — connect screen
  - Pattern: `packages/design-system/src/components/**` — new primitives

  **Acceptance Criteria**:
  - [ ] All Loom routes use design system components and tokens
  - [ ] Connect screen displays new branding
  - [ ] Lobby screen displays new branding
  - [ ] `bun run --filter @shoma/loom build` exits 0
  - [ ] `bun run test --filter @shoma/loom` passes
  - [ ] Playwright screenshots captured for /, /connected, /connected/lobby

  **QA Scenarios**:

  ```
  Scenario: Playwright screenshots show rebranded routes
    Tool: Playwright
    Steps: npx playwright screenshot --viewport-size=390,844 http://localhost:5176/ .sisyphus/evidence/task-13-loom-home.png
    Expected: Screenshot captured without errors
    Evidence: .sisyphus/evidence/task-13-loom-home.png

  Scenario: Loom tests pass after route rebrand
    Tool: Bash
    Steps: bun run --filter @shoma/loom test
    Expected: Exit code 0
    Evidence: .sisyphus/evidence/task-13-loom-tests.txt

  Scenario: Loom build passes
    Tool: Bash
    Steps: bun run --filter @shoma/loom build
    Expected: Exit code 0
    Evidence: .sisyphus/evidence/task-13-loom-build.txt
  ```

  **Commit**: YES | Message: `refactor(loom): rebrand all routes with new design system` | Files: `loom/src/routes/**`, `loom/src/features/**`

- [x] 14. Conduit React UI Rebranding

  **What to do**: Update Conduit's React UI to use `@shoma/design-system` tokens and components. Update `conduit/src/style.css` to import the design system theme. Apply new colors, typography, and spacing to all Conduit UI surfaces.

  **Must NOT do**: Change Tauri backend or Rust code. Do not add new features.

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: cross-app migration
  - Skills: [`react-patterns`] — Reason: Conduit also uses React
  - Omitted: [`tanstack-router-best-practices`] — Reason: Conduit may not use TanStack Router

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: — | Blocked By: T2, T6, T7

  **References**:
  - Pattern: `conduit/src/style.css` — current Conduit styles
  - Pattern: `conduit/index.html` — entry point
  - Pattern: `packages/design-system/src/styles/theme.css` — shared theme

  **Acceptance Criteria**:
  - [ ] `conduit/src/style.css` imports `@shoma/design-system/src/styles/theme.css`
  - [ ] Conduit UI uses design system color and typography tokens
  - [ ] `bun run --filter @shoma/conduit build` exits 0
  - [ ] Playwright screenshot captured for Conduit main window

  **QA Scenarios**:

  ```
  Scenario: Conduit build passes
    Tool: Bash
    Steps: bun run --filter @shoma/conduit build
    Expected: Exit code 0
    Evidence: .sisyphus/evidence/task-14-conduit-build.txt

  Scenario: Conduit screenshot captured
    Tool: Playwright
    Steps: npx playwright screenshot --viewport-size=1280,720 http://localhost:1420/ .sisyphus/evidence/task-14-conduit-ui.png
    Expected: Screenshot captured
    Evidence: .sisyphus/evidence/task-14-conduit-ui.png
  ```

  **Commit**: YES | Message: `refactor(conduit): apply design system tokens and branding` | Files: `conduit/src/style.css`, `conduit/src/**/*.tsx`

- [x] 15. Conduit Tauri Icons + Manifest

  **What to do**: Replace Tauri app icons with the new Sho'ma logo exports. Update `tauri.conf.json` product name and identifier if needed (already done in name rebrand, but verify). Update `conduit/index.html` title.

  **Must NOT do**: Change Tauri backend behavior. Do not modify Rust source unless for window titles.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: asset replacement
  - Skills: [] — Reason: straightforward file replacement
  - Omitted: [`react-patterns`] — Reason: not relevant

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: — | Blocked By: T4

  **References**:
  - Pattern: `conduit/src-tauri/tauri.conf.json` — Tauri config
  - Pattern: `conduit/src-tauri/icons/icon.png` — current icon
  - Pattern: `conduit/index.html` — window title
  - Pattern: `assets/shoma-logo.png` — new logo

  **Acceptance Criteria**:
  - [ ] `conduit/src-tauri/icons/icon.png` replaced with new logo
  - [ ] `conduit/src-tauri/icons/icon.ico` replaced with new logo
  - [ ] `conduit/index.html` title is "Sho'ma Conduit"
  - [ ] `tauri.conf.json` product name verified as "Sho'ma Conduit"

  **QA Scenarios**:

  ```
  Scenario: Tauri icons are valid
    Tool: Bash
    Steps: file conduit/src-tauri/icons/icon.png conduit/src-tauri/icons/icon.ico
    Expected: Valid PNG and ICO files
    Evidence: .sisyphus/evidence/task-15-tauri-icons.txt
  ```

  **Commit**: YES | Message: `assets(conduit): update Tauri app icons` | Files: `conduit/src-tauri/icons/**`, `conduit/index.html`

- [x] 16. Root Assets + README

  **What to do**: Update root-level branding assets. Replace `assets/shoma-logo.png` with new logo. Update `README.md` if it references old visual identity (colors, screenshots, etc.).

  **Must NOT do**: Change README content beyond visual identity references. Do not modify installation/development instructions.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: asset and doc update
  - Skills: [] — Reason: straightforward
  - Omitted: [`react-patterns`] — Reason: not relevant

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: — | Blocked By: T4

  **References**:
  - Pattern: `assets/shoma-logo.png` — current root logo
  - Pattern: `README.md` — root readme

  **Acceptance Criteria**:
  - [ ] `assets/shoma-logo.png` replaced with new logo export
  - [ ] `assets/shoma-logo.svg` exists as source
  - [ ] README.md references updated visual identity (if applicable)

  **QA Scenarios**:

  ```
  Scenario: Root logo exists
    Tool: Bash
    Steps: file assets/shoma-logo.png assets/shoma-logo.svg
    Expected: Valid files
    Evidence: .sisyphus/evidence/task-16-root-assets.txt
  ```

  **Commit**: YES | Message: `assets(brand): update root logo and README references` | Files: `assets/**`, `README.md`

- [x] 17. src-old Cleanup

  **What to do**: Based on T5 inventory report, either migrate useful patterns to the design system or delete `loom/src-old/`. If deleting, ensure no runtime references exist.

  **Must NOT do**: Delete without inventory confirmation. Do not leave broken imports.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: cleanup based on prior decision
  - Skills: [] — Reason: straightforward
  - Omitted: [`react-patterns`] — Reason: not needed for deletion

  **Parallelization**: Can Parallel: NO | Wave 4 | Blocks: — | Blocked By: T5, T13, T14, T15

  **References**:
  - Context: `.sisyphus/evidence/task-5-src-old-inventory.md` — inventory report
  - Pattern: `loom/src-old/**` — archive to clean up

  **Acceptance Criteria**:
  - [ ] `loom/src-old/` deleted OR useful files migrated
  - [ ] No references to `src-old/` in any active file
  - [ ] `bun run test --filter @shoma/loom` passes
  - [ ] `bun run --filter @shoma/loom build` passes

  **QA Scenarios**:

  ```
  Scenario: No src-old references remain
    Tool: Bash
    Steps: grep -r "src-old" loom/src/ leyline/src/ conduit/src/ packages/ || echo "No references found"
    Expected: "No references found"
    Evidence: .sisyphus/evidence/task-17-no-references.txt

  Scenario: Loom tests pass after cleanup
    Tool: Bash
    Steps: bun run --filter @shoma/loom test
    Expected: Exit code 0
    Evidence: .sisyphus/evidence/task-17-loom-tests.txt
  ```

  **Commit**: YES | Message: `chore(loom): remove src-old archive` | Files: `loom/src-old/**`

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.

- [x] F1. Plan Compliance Audit — oracle

  **What to do**: Verify that every task in this plan has been completed. Check: all acceptance criteria have evidence files, all commits follow conventional commits format, all builds pass, all tests pass.

  **Must NOT do**: Skip any task or accept missing evidence.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: audit requires thoroughness
  - Skills: [`git-master`] — Reason: commit history verification
  - Omitted: [`prototype`] — Reason: not relevant

  **Acceptance Criteria**:
  - [ ] All 17 tasks have evidence files in `.sisyphus/evidence/`
  - [ ] All commits follow `type(scope): description` format
  - [ ] `bun run test` passes in all workspaces
  - [ ] `bun run lint` passes in all workspaces
  - [ ] `bun run build` passes for `@shoma/loom`, `@shoma/conduit`, `@shoma/design-system`

  **QA Scenarios**:

  ```
  Scenario: All tasks have evidence
    Tool: Bash
    Steps: for i in $(seq 1 17); do test -f .sisyphus/evidence/task-${i}-*.txt || echo "Missing evidence for task $i"; done
    Expected: No missing evidence messages
    Evidence: .sisyphus/evidence/f1-audit-results.txt

  Scenario: Conventional commits check
    Tool: Bash
    Steps: git log --oneline --grep="^[a-z]" | head -20
    Expected: All commit messages follow conventional commit format
    Evidence: .sisyphus/evidence/f1-commits.txt
  ```

- [x] F2. Code Quality Review — unspecified-high

  **What to do**: Review code quality across all modified files. Check: `bun run lint` passes, `bun run fmt:check` passes, React Doctor score >= 75 for Loom, TypeScript strict mode errors, no explicit `any`.

  **Must NOT do**: Skip any workspace.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: quality review
  - Skills: [`vercel-react-best-practices`] — Reason: React quality checks
  - Omitted: [`prototype`] — Reason: not relevant

  **Acceptance Criteria**:
  - [ ] `bun run lint` exits 0 across all workspaces
  - [ ] `bun run fmt:check` exits 0 across all workspaces
  - [ ] `bun run doctor:react` score >= 75 for Loom
  - [ ] `bun run typecheck` exits 0 across all workspaces
  - [ ] No new `@typescript-eslint/no-explicit-any` violations

  **QA Scenarios**:

  ```
  Scenario: Lint passes everywhere
    Tool: Bash
    Steps: bun run lint
    Expected: Exit code 0
    Evidence: .sisyphus/evidence/f2-lint.txt

  Scenario: React Doctor score
    Tool: Bash
    Steps: bun run doctor:react:check
    Expected: Exit code 0 (score >= 75)
    Evidence: .sisyphus/evidence/f2-doctor.txt
  ```

- [x] F3. Real Manual QA — unspecified-high (+ playwright if UI)

  **What to do**: Capture Playwright screenshots of all rebranded surfaces. Verify visually that the new identity is applied. Check contrast ratios with automated tool. Verify Tauri icons render correctly.

  **Must NOT do**: Skip any surface or rely solely on build success.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: UI verification
  - Skills: [`playwright`] — Reason: screenshot automation
  - Omitted: [`tanstack-router-best-practices`] — Reason: not relevant

  **Acceptance Criteria**:
  - [ ] Playwright screenshots captured for Loom home, connected, lobby
  - [ ] Playwright screenshot captured for Conduit main window (port 1420)
  - [ ] Automated contrast check passes WCAG AA for all screenshots
  - [ ] Logo visible and correct in all screenshots
  - [ ] Tauri icon files pass `file` validation

  **QA Scenarios**:

  ```
  Scenario: Loom screenshots
    Tool: Playwright
    Steps: npx playwright screenshot --viewport-size=390,844 http://localhost:5176/ .sisyphus/evidence/f3-loom-home.png
    Expected: Screenshot captured, new branding visible
    Evidence: .sisyphus/evidence/f3-loom-home.png

  Scenario: Conduit screenshot
    Tool: Playwright
    Steps: npx playwright screenshot --viewport-size=1280,720 http://localhost:1420/ .sisyphus/evidence/f3-conduit-ui.png
    Expected: Screenshot captured, new branding visible
    Evidence: .sisyphus/evidence/f3-conduit-ui.png

  Scenario: Tauri icons valid
    Tool: Bash
    Steps: file conduit/src-tauri/icons/icon.png conduit/src-tauri/icons/icon.ico
    Expected: Valid image files
    Evidence: .sisyphus/evidence/f3-tauri-icons.txt
  ```

- [x] F4. Scope Fidelity Check — deep

  **What to do**: Verify that nothing outside scope was modified. Check: `legacy/` has zero changes, `leyline/` has zero visual changes, no packages renamed, no new features added, no backend behavior changed.

  **Must NOT do**: Accept scope creep.

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: deep codebase analysis for scope verification
  - Skills: [`git-master`] — Reason: git diff analysis
  - Omitted: [`prototype`] — Reason: not relevant

  **Acceptance Criteria**:
  - [ ] `git diff --name-only legacy/` returns empty
  - [ ] `git diff --name-only leyline/src/` returns empty or only non-visual files
  - [ ] No package.json names changed
  - [ ] No new dependencies added without justification
  - [ ] No new routes or API endpoints added

  **QA Scenarios**:

  ```
  Scenario: Legacy untouched
    Tool: Bash
    Steps: git diff --name-only HEAD -- legacy/ || echo "No legacy changes"
    Expected: "No legacy changes"
    Evidence: .sisyphus/evidence/f4-legacy-scope.txt

  Scenario: Leyline no visual changes
    Tool: Bash
    Steps: git diff --name-only HEAD -- leyline/src/ || echo "No leyline changes"
    Expected: "No leyline changes" or only backend files
    Evidence: .sisyphus/evidence/f4-leyline-scope.txt

  Scenario: Package names unchanged
    Tool: Bash
    Steps: git diff HEAD -- '**/package.json' | grep -E '"name"' || echo "No name changes"
    Expected: "No name changes"
    Evidence: .sisyphus/evidence/f4-package-names.txt
  ```

## Commit Strategy

- One commit per task (atomic commits)
- Commit messages follow conventional commits: `type(scope): description`
- T1-T5: Wave 1 commits
- T6-T10: Wave 2 commits
- T11-T13: Wave 3 commits
- T14-T17: Wave 4 commits
- Final verification results committed as `docs: add visual rebrand verification evidence`

## Success Criteria

- `@shoma/design-system` is consumable from both Loom and Conduit
- All Loom routes display the new Sho'ma visual identity
- Conduit displays the new Sho'ma visual identity
- All logo/icon assets are replaced with original Sho'ma branding
- `bun run test`, `bun run lint`, `bun run build` pass across all workspaces
- WCAG 2.2 AA contrast compliance verified by automated tests
- `legacy/**` and `leyline/**` remain unmodified
- src-old is either migrated or deleted with explicit inventory documentation
