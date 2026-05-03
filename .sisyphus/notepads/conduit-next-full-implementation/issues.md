## 2026-05-03
- Initial Bun test run failed because `src/main.tsx` accessed `document` at module load time. Moving the mount into a guarded function fixed it.
