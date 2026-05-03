## 2026-05-03
- Initial Bun test run failed because `src/main.tsx` accessed `document` at module load time. Moving the mount into a guarded function fixed it.
- `rust-analyzer` is not installed in this environment, so `lsp_diagnostics` cannot validate Rust files here; `cargo check` is the reliable backend verification.
