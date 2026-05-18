## 2026-05-15 - Updater smoke test doc verification

- `lsp_diagnostics` cannot run for `conduit/UPDATER_SMOKE_TEST.md` because no Markdown LSP is configured in this opencode environment.
- `pnpm run fmt:check` currently fails before checking files because the configured command `pnpm exec oxfmt --check .` invokes an oxfmt wrapper that only supports IDE/LSP or stdin mode and tells users to run `vp fmt` instead.

## Final Verification F2 - Code Quality Review

- REJECT: `conduit/src/components/update-prompt.tsx` calls `relaunch()` inside the updater `Finished` callback without awaiting or catching it, and before `downloadAndInstall` resolves. If relaunch fails, the promise rejection is unhandled and `isInstalling` stays true with no user-visible recovery.
- Verification notes: TS LSP clean for `conduit/src/App.tsx` and `conduit/src/components/update-prompt.tsx`; Rust LSP unavailable because `rust-analyzer` is not installed; `cargo check --manifest-path conduit/src-tauri/Cargo.toml` passed with dead-code warnings for non-Windows constants; JSON syntax valid for Tauri config and capability files; `pnpm --filter conduit run typecheck` passed.
