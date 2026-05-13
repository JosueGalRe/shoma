## 2026-05-12 - T5 fuzzy search utility
- Kept fuzzy search in `web/src/lib/fuzzy-search.ts` instead of extending `asset-resolver.ts`, preserving separate concerns between asset resolution and UI search.
- Stable input order is used as the tie-breaker within the same rank so search results are deterministic without inventing extra ranking rules.

## 2026-05-12 - T1 Playwright mobile baselines
- Kept production source untouched and captured stateful UI through E2E-only fixtures because the task was explicitly baseline/config scoped.
- Limited the screenshot spec to Mobile-360 and Mobile-390 projects so the task produces exactly 18 requested baseline files despite other Playwright projects remaining configured.
