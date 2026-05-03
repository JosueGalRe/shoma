## F2 Cleanup Pass - 2026-05-02

- `lsp_diagnostics` briefly reported stale undefined-name errors in `invites/route.tsx` even after the build passed; rewriting the hook result binding cleared it.
- The build emits a persistent `/assets/map-bg.jpg` runtime-resolution warning, but it is unrelated to this cleanup pass.
