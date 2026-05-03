## 2026-05-03
- Kept `APP_NAME` exported from the React entry path by re-exporting it from `src/main.tsx` so the existing test stays valid.
- Used a minimal React shell in `src/App.tsx` to preserve the current placeholder behavior while switching the runtime from vanilla DOM code.
- Added the configured hub HTTP URL to the connection snapshot so QR generation stays tied to backend configuration instead of a hardcoded domain.
