## Visual Engineering Review: Plan 04

### Executive Summary
**Verdict: APPROVED WITH RECOMMENDATIONS**

The plan is structurally sound and aligns well with the League of Legends 2026 visual language (dark theme, gold accents, high-polish interactions). The separation of ARAM features from the core draft flow is a smart architectural decision. However, there are several critical accessibility and design system gaps that must be addressed before execution, particularly regarding motion sensitivity, color tokens, and edge-case states.

### Task-by-Task Review

#### T1: ARAM Crowd Favorite Card Styling
- **Visual/UX**: The gold sparkling border and star icon perfectly match the LoL 2026 aesthetic and build logically on the existing `isBlessed` pattern.
- **Risks**: Long localized strings for "Crowd Favorite" might break the card layout on narrow mobile viewports (360px).
- **Recommendation**: Ensure the label container uses `truncate` or `line-clamp-2` to handle text overflow gracefully. Add `aria-hidden="true"` to the star icon to prevent redundant screen reader announcements.

#### T2: ARAM Bravery Card Styling
- **Visual/UX**: The chaotic purple/magenta gradient provides excellent visual contrast against the gold Crowd Favorite cards.
- **Risks**: The `design-tokens.css` file currently lacks purple/magenta tokens. Using arbitrary Tailwind values (e.g., `bg-[#ff00ff]`) violates design system consistency.
- **Recommendation**: Add semantic tokens for the Bravery theme to `design-tokens.css` (e.g., `--lol-bravery-primary`, `--lol-bravery-gradient`) before implementing the component. Ensure the gradient maintains at least a 4.5:1 contrast ratio against white text.

#### T3: Climb Indicator UI Shell (Gated)
- **Visual/UX**: A subtle chevron or pulsing gold aura is appropriate.
- **Risks**: A pulsing aura around the `Avatar` component might be confused with a "speaking" indicator (common in voice chat UIs).
- **Recommendation**: Prefer the chevron icon placed near the rank/role badges rather than an avatar aura to avoid semantic confusion. Add visually hidden text (e.g., `<span className="sr-only">Playing above visible rank</span>`) for screen reader users, as the icon alone is purely visual.

#### T4: Premade Ready Check UI (Gated)
- **Visual/UX**: A full-screen modal with circular progress rings is a strong, focused pattern for mobile.
- **Risks**: The plan only accounts for the "accept" state. It misses the "decline" or "timeout" states for party members.
- **Recommendation**: Define visual states for when a member declines (e.g., red ring/cross icon) or times out. Ensure the circular progress rings use `role="progressbar"` and `aria-valuenow` for accessibility.

#### T5: Staggered Reveal Animations
- **Visual/UX**: Staggered entrances (0ms -> 100ms -> 200ms -> 300ms) will significantly elevate the perceived quality of the champ-select transition.
- **Risks**: Forced animations can cause motion sickness for some users.
- **Recommendation**: Wrap the animation utilities in a `motion-safe:` Tailwind modifier (e.g., `motion-safe:animate-fade-in-up`). Users with `prefers-reduced-motion` should see the elements appear instantly or with a simple opacity fade, without the upward translation.

#### T6: Skeleton Shimmer Loaders
- **Visual/UX**: Replacing static text with a shimmer gradient (`bg-lol-navy-900`) is a modern best practice. The 3-second timeout fallback is an excellent defensive UX decision.
- **Risks**: Continuous shimmering can be distracting or trigger accessibility issues.
- **Recommendation**: Similar to T5, ensure the `animate-shimmer` utility respects `prefers-reduced-motion`. Define exactly what the 3-second fallback looks like (e.g., a generic champion silhouette icon rather than just empty space).

### Cross-Cutting Concerns

1. **Accessibility (A11y)**:
   - **Motion**: T5 and T6 introduce significant motion. `prefers-reduced-motion` support is non-negotiable.
   - **Screen Readers**: New icons (star, dice, chevron) must be hidden from screen readers if they are decorative, or accompanied by `sr-only` text if they convey unique state.
2. **Design System Consistency**:
   - T2 requires new color tokens. Do not hardcode hex values in the React components. Update `design-tokens.css` first.
3. **Mobile-First**:
   - Ensure the T4 Ready Check modal accounts for mobile safe areas (notches, home indicators) using `safe-area-inset-*` CSS variables or Tailwind plugins.

### Critical Recommendations (Must-Fix Before Execution)
1. **Add Bravery Tokens**: Update `design-tokens.css` with specific purple/magenta variables before starting T2.
2. **Implement Motion Safety**: Enforce `motion-safe:` prefixes for all animations in T5 and T6.
3. **Define Ready Check Failure States**: Update T4 requirements to include visual states for declined/timed-out party members.

### Nice-to-Have Improvements
- For T1 and T2, consider adding a subtle particle effect (using CSS or a lightweight library) to the borders to truly sell the "sparkling" and "chaotic" descriptions, provided it doesn't impact mobile performance.

### Files Referenced
- `web/src/features/champ-select/components/champion-picker.tsx`
- `web/src/features/lobby/components/lobby-member.tsx`
- `web/src/routes/connected/lobby/route.tsx`
- `web/src/routes/connected/champ-select/route.tsx`
- `web/src/features/ready-check/components/ready-check-overlay.tsx`
- `web/src/styles/design-tokens.css`