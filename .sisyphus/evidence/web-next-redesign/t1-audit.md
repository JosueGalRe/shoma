# Foundation Audit: Design Tokens & Utilities

## Existing Tokens & Utilities

- **Fonts**: `Cinzel` (display), `Crimson Pro` (body)
- **Colors**:
  - `ink`: `#0a0e13`
  - `parchment`: `#f0e6d2`
  - `gold`: `#c8a96e`
  - `gold-bright`: `#f0e6d2`
  - `gold-dim`: `#785a28`
  - `teal`: `#0ac8b9`
  - `teal-dim`: `#005a82`
  - `hextech`: `#1e2328`
  - `hextech-light`: `#2a2f35`
  - `noxus`: `#c89b3c`
  - `blood`: `#d32f2f`
- **Utilities**:
  - `.text-gold`, `.text-gold-dim`, `.text-teal`
  - `.border-gold`, `.border-gold-dim`
  - `.bg-hextech`, `.bg-hextech-light`
  - `.font-display`, `.font-body`
  - `.league-card`, `.league-card-hover`, `.league-gradient-border`
- **Animations**:
  - `.animate-pulse-gold`
  - `.animate-page-enter`, `.animate-page-exit`
  - `.animate-ready-check-enter`, `.animate-ready-check-glow`
  - `.animate-queue-active`

## Missing Utilities Added

- `safe-area-padding`
- `shake` (3 oscillations, ~300ms total)
- `connection-wave` (concentric rings expanding from center, 2s loop)
- `countdown-pulse` (border glow accelerating, for ready check urgency)
- `otp-input`
- `avatar-ring-connecting`
- `avatar-ring-connected`
- `map-bg-overlay`

## Component Decisions

- **GameButton / GameCard**: Decided NOT to create separate components. The existing `Button` and `Card` components in `apps/web-next/src/components/ui/` already have League-inspired styling (e.g., `hextech` variant for Button, League styling with gradient border and hover glow for Card) and are sufficient for the redesign.
