- 2026-05-09: Ready-check code quality review rejected due to timer expiry on null/404 ready-check data and non-stacked body scroll lock restoration risk.
- 2026-05-09: Fixed ready-check hook edge cases by clamping negative elapsed timers to 0 and treating null ready-check snapshots as expired so the overlay stays hidden.
2026-05-09: Bun test module mocks for `@tanstack/react-query` could not override the resolved package in this environment, which blocked the focused ready-check test run from passing.
