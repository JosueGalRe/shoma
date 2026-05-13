## Visual Engineering Review: Plan 03

### Executive Summary
**APPROVED WITH RECOMMENDATIONS**

The plan is solid and addresses critical social features of the champ select phase. The visual distinction between swap types and the anti-tilt ban UI are excellent additions that align with the project's goals. However, there are a few mobile-first and accessibility gaps that need to be addressed before execution, particularly regarding the use of tooltips on mobile devices and screen reader support for new interactive elements.

### Task-by-Task Review

**T1: Members refactor**
- **Visual/UX**: The use of 70% opacity combined with a pulsing border for `pickIntent` is a good balance of subtle and active states. The addition of role icons and anti-tilt shields will greatly improve scannability.
- **Risks**: 70% opacity might be confused with a "disconnected" or "disabled" state if the pulsing animation is too subtle.
- **Recommendation**: Ensure the pulsing border (`animate-pulse` or a custom keyframe) is distinct and feels like an "active intent" rather than an error state. Verify that the upcoming `ChampionIdentity` component includes a fallback state for failed image loads, as the current `members.tsx` does not handle `onError` for the champion icon.

**T2: Bench refactor**
- **Visual/UX**: A horizontal scrollable strip is the perfect pattern for a mobile-first bench, saving vertical space while keeping options accessible. Circular avatars provide a nice visual contrast to the likely square/rounded-rect member cards.
- **Risks**: Native scrollbars on mobile/desktop can look clunky if not styled.
- **Recommendation**: Apply CSS to hide the scrollbar visually while maintaining scrollability (e.g., `scrollbar-width: none` and `::-webkit-scrollbar { display: none; }`). Ensure the "Swap" button inside the card has a clear hierarchy and doesn't conflict with tapping the card itself.

**T3: Anti-Tilt Ban UI**
- **Visual/UX**: The shield overlay and disabled state are excellent for preventing accidental bans of hovered champions.
- **Risks**: The plan specifies a "tooltip" to explain why the champion is disabled. Tooltips are a desktop-first pattern and do not work well on touch devices (requiring a long-press which is often mapped to other OS functions, or not working at all).
- **Recommendation**: For mobile, if a user taps a shielded champion, provide immediate feedback via a Toast notification (e.g., "Ally wants to play this champion") instead of relying solely on a hover tooltip. Add `aria-disabled="true"` and an `aria-label` explaining the disabled state for screen readers.

**T4: Swap visuals**
- **Visual/UX**: Using distinct icons (↻ vs ⇄) and colors (blue vs purple) is a strong, accessible way to differentiate Role vs Pick swaps.
- **Risks**: Placing two new buttons "near position" and "near champion" could clutter the member card, especially on narrow viewports (360px).
- **Recommendation**: Explicitly mandate that these swap buttons must have a minimum touch target of 44x44px, even if the visual icon is smaller. Consider a layout where these buttons are grouped or aligned to the right edge to maintain a clean hierarchy. Ensure they have descriptive `aria-label`s (e.g., "Swap Role with [Name]").

### Cross-Cutting Concerns
- **Accessibility**: The plan lacks explicit mentions of ARIA attributes for the new interactive elements and states. Icon-only buttons must have screen reader text.
- **Mobile-First**: The reliance on tooltips in T3 is an anti-pattern for mobile interfaces.
- **Consistency**: The color choices (blue/purple accents) and gold borders align well with the LoL 2026 Hextech/Ionia aesthetic and the existing `lol-navy-*` / `lol-gold` theme.

### Critical Recommendations (must-fix before execution)
1. **Mobile Tooltips (T3)**: Replace or supplement the desktop tooltip with a mobile-friendly interaction (e.g., a Toast notification when tapping the disabled champion).
2. **Accessibility (All Tasks)**: Mandate `aria-label`s for all icon-only buttons (Swap buttons in T2 and T4) and `aria-disabled="true"` with explanatory text for the anti-tilt shielded champions.
3. **Touch Targets (T4)**: Explicitly require the 44x44px minimum touch target for the new Role/Pick swap buttons, matching the requirement already specified in T2.

### Nice-to-Have Improvements
- **Scrollbar Styling (T2)**: Hide the scrollbar on the horizontal bench strip for a cleaner mobile UI.
- **Animation Polish (T1)**: Define the exact easing and duration for the "pulsing border" to ensure it feels like a "hover/intent" state rather than an "error/warning" state.

### Files Referenced
- `web/src/features/champ-select/components/members.tsx`
- `web/src/features/champ-select/components/bench.tsx`
- `web/src/features/champ-select/components/champion-picker.tsx`