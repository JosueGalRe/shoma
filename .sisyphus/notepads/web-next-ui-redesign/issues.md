# Issues

- Code-quality review flagged hardcoded Spanish copy versus the existing i18n pattern as a maintainability concern. This was accepted to satisfy the requested exact screen text.
- Context mining also surfaced broader queue/ready-check concerns outside this redesign scope: route text still bypasses `useTranslation()`, and the underlying ready-check state reset/mutation invalidation issues live in feature code rather than these routes.
## 2026-05-04 — Connect screen QA regression

- The connect screen shows the same connection error twice after a failed submit: once in the status line and once in the error block.
- The `Cancel` button is disabled while `isConnecting` is true, which makes it unavailable during the most relevant recovery states.
