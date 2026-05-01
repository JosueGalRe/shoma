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
