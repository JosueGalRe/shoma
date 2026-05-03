## 2026-05-03
- `conduit-next` now uses `@vitejs/plugin-react`, `react`, and `react-dom` with `jsx: react-jsx` in `tsconfig.json`.
- Guarding the React mount behind `typeof document !== "undefined"` keeps Bun tests from failing on module import.
- `vite.config.ts` should only reference existing HTML entry points; the missing `about.html` input was removed so builds succeed.
