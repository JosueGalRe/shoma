## Visual Engineering Review: Plan 05

### Executive Summary

**Verdict: APPROVED WITH RECOMMENDATIONS**

The plan provides a solid foundation for QA hardening, but there are critical discrepancies between the plan's stated viewports and the actual Playwright configuration. Additionally, several mobile-first and accessibility scenarios are missing and should be added to ensure a truly robust, production-ready mobile experience.

### Task-by-Task Review

**T1: Playwright Mobile Screenshot Comparison**

- **Current State:** Good baseline comparison strategy.
- **Gaps:**
  - **Viewport Mismatch:** The plan specifies `360x800` and `390x844`, but `web/playwright.config.ts` only defines a single `Mobile` project at `375x812`.
  - **Orientation:** No landscape orientation testing. Mobile users frequently rotate their devices, especially for gaming-related apps.
  - **Pixel Density:** No testing for high-DPI (Retina) displays, which can affect image rendering and 1px borders.

**T2: Interaction Tests for Custom Selectors**

- **Current State:** Covers the basic happy path for custom selectors.
- **Gaps:**
  - **Touch Gestures:** Missing swipe-to-dismiss tests for the `BottomSheet`. Mobile users expect to swipe down to close, not just tap the backdrop or press Escape.
  - **Keyboard Navigation:** While T3 checks focus traps, T2 should explicitly test keyboard interactions (Arrow keys for grids, Space/Enter to select) for `IconGridSelector` and `ChampionPicker`.
  - **Thumb Zone Reachability:** No verification that primary actions (e.g., "Lock In") are within the comfortable bottom thumb zone.

**T3: Accessibility Checks**

- **Current State:** Strong baseline with axe-core, touch targets (>= 44px), and focus traps.
- **Gaps:**
  - **Screen Reader Announcements:** Missing checks for `aria-live` regions. When a user selects a champion or locks in, screen readers must announce this dynamic state change.
  - **Reduced Motion:** No verification that animations (e.g., BottomSheet sliding, glowing effects) respect `prefers-reduced-motion`.
  - **Zoom/Scaling:** No test to ensure the UI remains usable and doesn't break when text is scaled to 200% (a WCAG requirement).

**T4: Final Build / Lint / Test Verification**

- **Current State:** Standard build and lint checks.
- **Gaps:**
  - **Type Checking:** Ensure `bun run build` actually runs `tsc --noEmit` or add it explicitly.
  - **Bundle Size / Performance:** No checks for bundle size regressions. Mobile web apps must remain lightweight.

### Cross-Cutting Concerns

- **Mobile Emulation:** Playwright should use actual device emulation (e.g., `devices['iPhone 13']`, `devices['Pixel 5']`) rather than just setting viewport dimensions, to accurately simulate touch events and mobile user agents.
- **Network Conditions:** No testing for flaky or slow mobile networks (3G/4G throttling).

### Critical Recommendations (must-fix before execution)

1. **Fix Viewport Discrepancy:** Update `web/playwright.config.ts` to include `Mobile-360` (360x800) and `Mobile-390` (390x844) projects, or update the plan to match the existing `375x812` config.
2. **Add Device Emulation:** Configure Playwright to use `isMobile: true` and `hasTouch: true` for the mobile projects to ensure touch events (like swipe) are accurately simulated.
3. **Add Swipe-to-Dismiss Tests:** Add interaction tests in T2 for swiping down to close the `BottomSheet`.
4. **Add `aria-live` Verification:** Add tests in T3 to verify that dynamic updates (champion selection, lock-in status) are announced to screen readers.

### Nice-to-Have Improvements

1. **Landscape Testing:** Add a landscape viewport project to T1 to catch overflow issues when the device is rotated.
2. **Reduced Motion Tests:** Add a Playwright test with `colorScheme` and `reducedMotion` emulation to ensure animations are disabled.
3. **200% Zoom Test:** Add a visual test at 200% text scale to ensure no text clipping or overlap occurs.

### Files Referenced

- `web/playwright.config.ts`
- `web/tests/e2e/screenshots.pw.ts`
- `web/tests/e2e/interactions.pw.ts`
- `web/tests/e2e/a11y.pw.ts`
