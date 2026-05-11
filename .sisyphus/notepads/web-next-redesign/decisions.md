## Decisions — 2026-05-02

- Use `.pw.ts` for Playwright tests and `testMatch: '**/*.pw.ts'` to keep Bun and Playwright test discovery separate.
- Keep screenshots route-focused and viewport-driven rather than adding extra fixtures or auth mocks.
