## 2026-05-13

- `@shoma/design-system` follows the same direct-TS workspace pattern as `@shoma/protocol-contract`: `main`/`types` point at `./src/index.ts`, and `tsconfig.json` extends `../../tsconfig.base.json`.
- Bun only resolved the new workspace from `loom` and `conduit` after adding `@shoma/design-system": "workspace:*"` to each consumer package.
- `bun install` succeeded after the workspace wiring and saved the lockfile without adding new external dependencies.
- `lsp_diagnostics` is currently blocked for JSON files because the configured Biome server is not installed in this environment.
## Task 5 — src-old inventory
- `loom/src-old/styles.css` is the only archive file I would actively mine first: it still carries the old League theme tokens, page/ready-check/queue animations, and a few utility classes that are not fully represented in the new split CSS files.
- `loom/src/lib/utils.ts` already matches the old `cn()` helper, so the archive copy is redundant.
- Most of `loom/src-old/` is either already replaced at the same path in `loom/src/` or is feature-scaffold code that the redesign superseded; utility/hook modules are the only other plausible extraction candidates.

## Visual Identity Prototype Learnings (2026-05-13)
- **Dark Mode Primary**: The gaming context demands a dark mode primary approach. We explored Dark Tactical, Minimal Glassmorphism, and Neon Cyberpunk.
- **Riot/League Independence**: The visual language must be completely independent of League of Legends. No runes, hextech, or gold/navy borders.
- **Accessibility**: WCAG 2.2 AA is a strict requirement. High contrast text, clear focus states, and minimum 44x44px touch targets are essential.
- **Prototyping Approach**: Using TanStack Router's search params (`?variant=`) is an effective way to toggle between radically different UI variations on a single throwaway route.

## Task 6 — semantic token contract RED phase
- `@shoma/design-system` now exposes a type-level semantic token contract from `src/tokens/index.ts`; the required names are `background`, `foreground`, `primary`, `primary-foreground`, `secondary`, `accent`, `muted`, `border`, `ring`, and `destructive`.
- RED tests intentionally read the future `packages/design-system/src/tokens/semantic.css` file instead of Loom's existing `--lol-*` tokens, so the later CSS implementation must create `--shoma-*` semantic variables.
- Contrast tests assert WCAG 2.2 AA thresholds through computed ratios: 4.5:1 for normal text pairs and 3:1 for large/prominent text pairs, without locking the implementation to specific hex values.
- Current expected verification state: `bun run --filter @shoma/design-system build` passes, while `bun run --filter @shoma/design-system test` fails RED with 0 pass / 15 fail until `semantic.css` exists.

## Task 3b: Visual Identity Engineering Review
- **Tailwind v4 Tokens**: The `@theme` syntax is excellent for the new design system, but legacy `--lol-*` tokens must be completely removed first. Prototypes should not use hardcoded hex values.
- **Mobile Performance**: Heavy use of `backdrop-blur` and large `blur` filters (as seen in Variant B) is a major performance risk for the mobile Loom app and should be avoided or heavily optimized.
- **Animation Timing**: The brief specifies 150-200ms for snappy animations. Existing animations (220ms-300ms) need to be sped up to match this new standard.
- **Accessibility**: Strict adherence to WCAG 2.2 AA requires careful checking of contrast ratios, especially with neon/accent colors on dark backgrounds, and ensuring focus rings are prominent (>= 2px).

## Task 6 RED Token Contract Tests (2026-05-13)
- `@shoma/design-system` now exposes the semantic token contract from `src/tokens/index.ts` and root `src/index.ts`; actual CSS token declarations are intentionally still absent for the RED phase.
- The RED tests target future `packages/design-system/src/tokens/semantic.css` declarations named `--shoma-{token}` and expect WCAG 2.2 AA contrast: 4.5:1 for normal text pairs and 3:1 for large text/accent pairs.
- `bun run --filter @shoma/design-system test` reaches the package test script and currently fails as expected with 0 pass / 15 fail because `semantic.css` has not been implemented yet.

## Task 4: Logo Design + Asset Exports
- Explored 3 logo concepts using a prototype HTML file.
- Selected a clean monogram 'S' with a subtle cyan-to-purple gradient, fitting the modern gaming aesthetic and avoiding League IP.
- Used `rsvg-convert` to generate PNGs from the SVG.
- Used `bunx png-to-ico` to generate the ICO file for Tauri.
- Validated all assets with `file` and `xmllint`.

## Task 7 — Typography System
- `packages/design-system/src/styles/typography.css` owns the shared typography CSS tokens and Tailwind v4 `@theme` aliases; TypeScript exports stay in `src/styles/typography.ts` so the direct-TS package does not import CSS during build.
- The shared type scale uses Manrope for primary UI text, Space Grotesk for display text, and system monospace fallbacks for technical/tooling data without adding new font dependencies.
- Typography tests validate every xs–4xl size/leading/tracking token, font family fallback, font weight, and corresponding Tailwind theme alias; `bun run --filter @shoma/design-system test` passes 40/40.

## Task 10: Icon system
- `loom/components.json` confirms Lucide is the current icon library, and Loom already imports `lucide-react` directly in many UI files.
- `packages/design-system` needed `"jsx": "react-jsx"` in its local `tsconfig.json` before adding a TSX wrapper.
- Lucide's `DynamicIcon` is a good fit for the design system wrapper: it keeps the package thin, supports name-based icons, and lets the wrapper standardize token-based sizing and color.
- The focused icon test passes even though the package-wide `bun run --filter @shoma/design-system test` still has an unrelated typography failure.

## Task 6 GREEN Token CSS (2026-05-13)
- The T2 token tests read `packages/design-system/src/tokens/semantic.css` directly, so GREEN needs that file even though consumer-facing CSS also lives under `src/styles/`.
- `src/styles/tokens.css` should contain concrete `--shoma-*` declarations, and `src/styles/theme.css` should import it before Tailwind v4 `@theme` mappings like `--color-primary: var(--shoma-primary)`.
- The dark semantic palette `#050505` background, `#f5f7fa` foreground, `#00e5ff` primary/ring, `#b026ff` accent, and `#ff4d6d` destructive passes the existing WCAG AA contrast tests without using legacy League gold/navy tokens.
- Package-wide design-system tests are now green after enabling `jsx: react-jsx` in the package tsconfig for the existing TSX icon export; CSS/JSON LSP diagnostics remain blocked by missing Biome.

## Task 8 — Core primitives part 1
- Button, Card, Input, Badge, and Alert now live in `packages/design-system/src/components/` and Loom's matching `src/components/ui/*` files are compatibility re-export shims from `@shoma/design-system`.
- The migrated primitives should use Tailwind v4 semantic token aliases (`background`, `foreground`, `primary`, `secondary`, `muted`, `border`, `ring`, `destructive`) instead of legacy `lol-*` classes; arbitrary shadows can reference concrete CSS vars like `var(--shoma-primary)` when Tailwind has no semantic shadow token.
- The source Button declared `asChild` but never used Radix Slot; preserving backward compatibility meant keeping the prop type and exact `<button>` runtime behavior rather than introducing new Radix behavior during migration.
- `bun run --filter @shoma/design-system test`, focused `bun test packages/design-system/tests/button.test.ts`, `bun run --filter @shoma/design-system build`, and `bun run --filter @shoma/loom build` pass. Full `bun run --filter @shoma/loom test` is blocked by unrelated relay/i18n/lcu/lobby-storage failures recorded in `.sisyphus/evidence/task-8-loom-tests.txt`.

## Task 9 — Core primitives part 2
- Avatar, Skeleton, SkeletonShimmer, Spinner, DropdownMenu, BottomSheet, and BottomNav now live in `packages/design-system/src/components/`; Loom's matching UI files are compatibility re-export shims from `@shoma/design-system`.
- The shimmer API came from Loom's separate `skeleton-shimmer.tsx`, but the design-system implementation belongs in `components/skeleton.tsx` alongside `Skeleton`, then Loom keeps a direct `skeleton-shimmer` shim for existing imports.
- Legacy `lol-*` classes in these primitives map cleanly to semantic aliases: surface colors use `background`/`secondary`, text uses `foreground`/`muted`, borders/focus use `border`/`ring`, status/accent states use `primary`/`accent`, and destructive badges use `destructive`.
- `bun run --filter @shoma/design-system test`, `bun run --filter @shoma/design-system build`, and `bun run --filter @shoma/loom build` pass. Full `bun run --filter @shoma/loom test` still exits 1 with unrelated relay/i18n/lcu/lobby-storage failures recorded in `.sisyphus/evidence/task-9-loom-tests.txt`.

## Task 11 — Loom global style migration
- `loom/src/styles.css` now imports `@shoma/design-system/src/styles/theme.css`; the design-system theme imports both `tokens.css` and `typography.css` so consumers get semantic color and font `@theme` aliases through one stylesheet.
- Loom's old `design-tokens.css` and `typography.css` were removed. Temporary `lol-*` Tailwind compatibility aliases remain in `styles.css`, but they map to `--shoma-*` semantic variables instead of concrete legacy League palette tokens because route/layout migration is reserved for T12/T13.
- Animation aliases and keyframes that are not yet in the design system live in `loom/src/styles/animations.css`, preserving existing `motion-safe:animate-*` usage and the reduced-motion override.
- CSS package exports need explicit `style`/`import`/`default` conditions for Vite/Tailwind to resolve `@shoma/design-system/src/styles/theme.css` during Loom builds.
- `bun run --filter @shoma/loom build` passes with evidence in `.sisyphus/evidence/task-11-loom-build.txt`; full Loom tests still exit 1 with the inherited 231 pass / 11 fail / 2 errors shape in `.sisyphus/evidence/task-11-loom-tests.txt`.


## Task 12 — Layout token migration
- `AppShell` should use semantic Tailwind aliases (`bg-background`, `text-foreground`) instead of the legacy League `lol-*` gradient shell.
- `SafeArea` can preserve `env(safe-area-inset-*)` behavior while adding token-scale breathing room via Tailwind v4's `var(--spacing)` base unit.
- `LandscapeWarning` already had semantic background/primary usage; body/icon treatments should stay on `foreground`, `muted`, `secondary`, and `border` tokens.
- Loom's CSS import of `@shoma/design-system/src/styles/theme.css` requires explicit CSS subpath exports from `packages/design-system/package.json`; otherwise the production build fails in Tailwind/Vite resolution before app code is bundled.
- `bun run --filter @shoma/loom build` is green after the export fix. Full Loom tests still exit 1 with the unrelated 231 pass / 11 fail / 2 errors pattern captured in `.sisyphus/evidence/task-12-layout-tests.txt`.

## Task 13 — Loom route visual rebrand
- Route and feature UI TSX surfaces now use semantic design-system Tailwind aliases (`background`, `secondary`, `foreground`, `muted`, `primary`, `accent`, `border`, `ring`, `destructive`) instead of legacy `lol-*` route styling; the only remaining `lol` text match is the CommunityDragon `rcp-be-lol-game-data` asset URL.
- `ConnectScreen` imports `assets/shoma-logo.svg` and renders it inside design-system `Card`/`CardContent` with `Input` and `Button`, keeping the 6-digit connection flow unchanged.
- Progress bars that previously used inline width styles now use native `<progress>` elements with token-colored pseudo-element classes, preserving dynamic values without inline visual styling.
- `bun run --filter @shoma/loom build` passes with evidence in `.sisyphus/evidence/task-13-loom-build.txt`; full Loom tests still exit 1 with the inherited 231 pass / 11 fail / 2 errors pattern recorded in `.sisyphus/evidence/task-13-loom-tests.txt`.

## Task 14 — Conduit UI rebrand
- Conduit now imports `@shoma/design-system/src/styles/theme.css` from `conduit/src/style.css`; because design-system primitives use Tailwind v4 classes, Conduit also needs `@import "tailwindcss"`, `@tailwindcss/vite`, and an `@source "../../packages/design-system/src"` hint.
- `conduit/package.json` did not actually have `@shoma/design-system` despite inherited context, so the dependency had to be added with the primitive runtime deps used by the design-system exports (`class-variance-authority`, `lucide-react`).
- The Conduit frontend bundle builds successfully during `bun run --filter @shoma/conduit build`, but the full Tauri build is blocked on Linux by existing backend/Tauri issues: a stale generated permissions path under `apps/conduit-next` and `irelia` constants gated to Windows/macOS.

## Task 15 — Conduit tauri icons
- `conduit/index.html` and `conduit/src-tauri/tauri.conf.json` were already aligned with `Sho'ma Conduit`; no manifest/title code changes were needed.
- `assets/shoma-logo.png` is a wide `451x128` PNG, so `png-to-ico` failed on the raw file; the ICO was generated from a square `256x256` render of `assets/shoma-logo.svg` instead.
- `conduit/src-tauri/icons/icon.png` remains the direct copied logo asset, and `conduit/src-tauri/icons/icon.ico` now validates as a Windows icon resource.
- Rebuilt assets/shoma-logo.png from assets/shoma-logo.svg with rsvg-convert at 512x512; file reports PNG 512x512 RGBA, non-interlaced.
- README.md already used the current Sho'ma logo path and did not need a visual-identity text change.


## Task 17 — `loom/src-old/` archive cleanup
- `loom/src/styles.css` already carries the old League color/token mappings, and `loom/src/styles/animations.css` already owns the archive's animation utilities; there was nothing left worth mining from `loom/src-old/styles.css`.
- The only live `src-old/` references were stale config/docs entries (`react-doctor.config.json`, `loom/AGENTS.md`, and `docs/migration/shoma-rebrand-summary.md`), and removing them left the active tree clean before archive deletion.
- `loom/src-old/` was deleted successfully.
- `bun run --filter @shoma/loom build` passed.
- `bun run --filter @shoma/loom test` still fails with inherited issues: 231 pass / 11 fail / 2 errors, including the known `use-lobby.sticky.test.ts` failures plus existing relay/i18n/lcu regressions.
- Evidence written to `.sisyphus/evidence/task-17-no-references.txt` and `.sisyphus/evidence/task-17-loom-tests.txt`.
- Successfully captured Playwright screenshots for Loom (home, connected, lobby) and Conduit UI.
- Verified new branding (dark background, cyan/purple accents, Sho'ma logo) is visible in the captured screenshots.

## F4 — Scope fidelity check
- `git diff --name-only HEAD -- legacy/` and `git diff --name-only HEAD -- leyline/src/` both returned empty, so legacy and Leyline backend scopes stayed untouched in tracked diffs.
- `loom/src/routeTree.gen.ts` registers a new `/prototype/visual-identity` route, and `loom/src/routes/prototype.visual-identity.tsx` is untracked; this fails the "no new routes" F4 constraint.
- No tracked package names changed, but dependency scope is not clean: `class-variance-authority`, `lucide-react`, and root `playwright` were added outside the explicitly allowed `@shoma/design-system` and Tailwind/CSS dependency set.
- Evidence files: `.sisyphus/evidence/f4-legacy-scope.txt`, `.sisyphus/evidence/f4-leyline-scope.txt`, `.sisyphus/evidence/f4-package-names.txt`.

## F1 Plan Compliance Audit (2026-05-13)
- T1–T17 all have at least one `task-{N}-*.txt` or `task-{N}-*.md` evidence file, and T3b has `.sisyphus/evidence/task-3b-visual-review.md`.
- A stricter check against every explicit `Evidence:` path in `.sisyphus/plans/shoma-visual-rebrand.md` found missing implementation evidence for T1, T2, T3, T3b, T5, T13 screenshot, and T14 screenshot; final-wave F2–F4 evidence is also not present yet.
- `bun run --filter @shoma/design-system test` passes with 44/44 tests; `bun run --filter @shoma/loom test` fails with 231 pass / 11 fail / 2 errors.
- The Loom failure distribution does not match the provided “11 sticky failures” context: current failures also include relay handshake timeouts, an i18n `Mimic` vs `Sho'ma` expectation, and an LCU request-frame mismatch.
- `bun run --filter @shoma/design-system build`, `bun run --filter @shoma/loom build`, and `bunx vite build` from `conduit/` all pass; Conduit only emits chunk-size warnings.


## F2 Code Quality Review - 2026-05-13

- `bun run lint` currently exits 1 before source linting because `bunx oxlint` resolves to an IDE-extension-only wrapper; output says to use `vp lint`. Evidence: `.sisyphus/evidence/f2-lint.txt`.
- `bun run fmt:check` currently exits 1 before checking formatting because `bunx oxfmt --check .` resolves to an IDE-extension-only wrapper; output says to use `vp fmt`.
- `bun run doctor:react:check` passes with `loom:90` and `conduit:100`, satisfying the Loom >=75 target. It still warns about `tsconfig.base.json` path mapping without `baseUrl`.
- `bun run typecheck` exits 2 with broad root `tsc` issues: TSX checked without `--jsx`, missing Loom alias targets, duplicate Effect package warnings, and Leyline `loadConfig` redeclarations.
- Explicit `any` scan found no authored changed-file violations; changed matches are in generated `loom/src/routeTree.gen.ts` (`as any`), with unchanged test globals in `loom/src/bun-test.d.ts`.

## Task 18 — Prototype route cleanup
- Deleting `loom/src/routes/prototype.visual-identity.tsx` and running `bun run --filter @shoma/loom build` was enough to regenerate `loom/src/routeTree.gen.ts`; no manual generated-file edit was needed.
- A repo-wide `loom/src/` search for `prototype.visual-identity` and `PrototypeVisualIdentityRoute` came back empty after the build.
