## Final Visual QA Findings

### Design Tokens

- **Consistency**: The hex values used across the application match the League of Legends design system palette (Background: `#010a13`, Card bg: `#0a1428`, Gold accent: `#c8a96e`, Teal accent: `#0ac8b9`, Text: `#f0e6d2`, Muted: `#a09b8c`, Destructive: `#d32f2f`).
- **Implementation Issue**: While the colors are visually correct, they are extensively hardcoded as arbitrary Tailwind values (e.g., `bg-[#010a13]`, `text-[#c8a96e]`, `border-[#785a28]`) in the `.tsx` files instead of using the semantic Tailwind classes defined in `src/styles.css` (e.g., `bg-background`, `text-primary`, `bg-card`, `text-destructive`). This makes future theme updates difficult.

### Fonts

- **Headers**: `Cinzel` is correctly applied to headers and primary UI elements using the `font-display` class.
- **Body**: `Crimson Pro` is correctly applied as the default body font and via the `font-body` class.

### Animations

- **Definitions**: Custom animations (`page-enter`, `pulse-gold`, `ready-check-glow`, `queue-active-shift`) are properly defined in `src/styles.css`.
- **Usage**: These animations are correctly applied via utility classes (`animate-page-enter`, `animate-pulse-gold`, `animate-ready-check-glow`, `animate-queue-active`) across the components.

### Visual Consistency

- **Dark Theme**: The dark theme is applied consistently across all routes (`/connected`, `/connected/lobby`, `/connected/champ-select`, `/connected/invites`). No light theme inconsistencies were found.
- **Accents**: Gold accents are consistently used for primary actions, borders, and active states. Teal accents are used appropriately for secondary highlights.
- **Primitives**: UI primitives (`Button`, `Card`, `Skeleton`, `Spinner`) consistently follow the established aesthetic, utilizing the correct background colors, borders, and hover effects.

### Conclusion

The visual migration is complete and consistent with the LoL aesthetic. The only technical debt identified is the use of hardcoded hex values in Tailwind classes instead of semantic design tokens.

- Local `lsp_diagnostics` for `apps/web-next/src/routes/connected/lobby/-lobby-utils.ts` could not run because `typescript-language-server` is not installed in this environment; build verification was used instead.
- Local `lsp_diagnostics` for the updated lobby TSX files also could not run because `typescript-language-server` is not installed in this environment; `bun run build` was used as the verification source of truth.
- Local `lsp_diagnostics` for the touched web-next TSX files could not run for the same reason; the workspace is missing `typescript-language-server`.

## 2026-05-01 Debug logging gotchas

- `lsp_diagnostics` could not run because `typescript-language-server` is not installed in this environment.
- A raw `console.log(...)` expression inside JSX caused a TypeScript `void` render error; wrapping it in an IIFE that returns `null` preserved the log without breaking the build.
- The workspace build emits two non-blocking Vite 8 warnings: `vite-tsconfig-paths` is now redundant with native `resolve.tsconfigPaths`, and `rolldown`'s `advancedChunks` option is deprecated in favor of `codeSplitting`.

## Accessibility Violations (apps/web-next)

1. **Contrast Ratios**:
   - The `destructive` color (`#d32f2f`) on the background (`#010a13`) has a contrast ratio of 4.00:1. This fails the WCAG AA requirement of 4.5:1 for normal text (though it passes the 3:1 requirement for large text).

2. **Form Inputs**:
   - In `ChampSelectCard.tsx`, the champion search `<Input>` is missing an `aria-label` or an associated `<label>`.

3. **Interactive Elements (aria-labels)**:
   - In `SkinsCard.tsx`, the skin selection `<button>` elements lack an accessible name when `thumbUrl` is present. The `<img>` has `alt=""` and there is no text content. They should have `aria-label={skin.name}` or the image should have `alt={skin.name}`.

4. **Roles**:
   - The champion grid in `ChampSelectCard.tsx` lacks an appropriate role (e.g., `role="grid"` or `role="listbox"`).
   - The rune tree slots in `rune-panel/index.tsx` lack appropriate grouping roles (e.g., `role="radiogroup"` or `role="group"`).

5. **Modals/Dialogs**:
   - No modals or dialogs were found in the inspected components, so no `role="dialog"` or `aria-modal` attributes are missing.

6. **Focus Outlines**:
   - Focus outlines are visible and properly implemented using `focus-visible:ring-[3px]` and `outline-ring/50`.

7. **Buttons**:
   - All interactive button elements correctly use the `<button>` tag (or the `<Button>` component which renders a `<button>`).

8. **Icon-only Buttons**:
   - The `LanguageSwitcher` button has text content (`EN` or `ES`) so it is not icon-only.
   - The `SkinsCard` previous/next buttons have `aria-label`s.
   - The `SpellsCard` buttons have `alt` text on their images.
   - The `ChampSelectCard` champion grid buttons have `alt` text on their images and text content in a `div`.
