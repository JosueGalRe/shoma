## 2026-05-02 - LCU HTTP client

- `rust-analyzer` is not installed in this environment, so `lsp_diagnostics` cannot run for Rust files. `cargo test` and `cargo build` were used as compiler verification.
- `cargo build` passes but emits existing dead-code warnings for Rift/protocol items that are currently only exercised by tests or later integration work.

- Rust LSP diagnostics could not run because `rust-analyzer` is not installed in the environment; `cargo test` and `cargo build` were used as compiler-backed verification.
- Existing/parallel `src-tauri` work had duplicate `main.rs`/`tray.rs` fragments and missing tray/notification API wiring; repaired to unblock the required build.

## 2026-05-02 - Mobile session handler

- `lsp_diagnostics` remains unavailable for Rust/TOML in this environment (`rust-analyzer` missing; no TOML LSP configured), so verification relied on `cargo test` and `cargo build`.
- `cargo build` passes but emits dead-code warnings because the Tauri connection manager has not wired the new mobile session, Rift client, and approval module into runtime flow yet.

## 2026-05-02 Manual QA
- cargo build passed in apps/conduit-next/src-tauri.
- cargo test passed: 44 unit/lib tests, 6 integration tests, 0 failures; binary/doc test harnesses had 0 tests.
- cargo test --test integration passed: 6/6.
- REJECT blocker: production panic!() remains in src/crypto.rs for invalid AES key lengths at lines 55 and 82.
- rust-analyzer diagnostics could not run because rust-analyzer is not installed in the environment.


## 2026-05-02 Plan compliance audit (F1)
- Verdict: REJECT. T1-T15 are marked complete, but several acceptance criteria are not implemented.
- Key gaps: lockfile paths do not match required Windows ProgramData/Riot Games/League of Legends/lockfile or Mac Library/Application Support/League of Legends/lockfile; tray menu lacks Connect/Disconnect and tooltip/status handling; device approval is not wired into handshake and persistence always returns false; Rust protocol omits LCU path/type contract definitions; no C# crypto fixture/vector evidence beyond local roundtrip/known AES test.
- Plan state gap: Definition of Done checkboxes remain unchecked in addition to F1-F4, so Final Verification Wave is not the only unchecked section.
- Verification evidence: cargo test passed (44 unit + 6 integration), bun test passed (1), conduit local Tauri build passed; Rust LSP diagnostics unavailable because rust-analyzer is not installed, TS diagnostics clean.

## 2026-05-02 Scope Fidelity Check F4
- Verdict: REJECT. Core MVP guardrails are mostly maintained, but device approval is not operationally wired: mobile/approval.rs defines the Tauri dialog, while MobileSession only checks persistence::is_device_approved(), which always returns false.
- Passing evidence: lockfile-based discovery exists with no WMI/process scraping found; Rust protocol opcode values match packages/protocol-contract; tray and About QR window exist; Windows x64 and macOS arm64 unsigned CI are configured; no updater/settings/telemetry/signing/Intel Mac CI found.
- Verification: TypeScript diagnostics clean for apps/conduit-next/src and packages/protocol-contract/src; Rust LSP unavailable because rust-analyzer is not installed; bun test passed for conduit-next and protocol-contract; cargo test passed; bunx vite build passed; cargo build passed; cargo tauri build passed locally.

## 2026-05-02 - Crypto error handling

- `rust-analyzer` is still not installed, so `lsp_diagnostics` could not run for changed Rust files. Verification used `cargo fmt --check` and `cargo test` instead.
- The task expected 50 tests, but the current crate runs 48 lib tests and 6 integration tests (54 total), all passing.

## 2026-05-03 - Capability verification
- `lsp_diagnostics` could not run for the new JSON capability file because the configured Biome LSP is not installed in this environment.
- `cargo check` still passed, and the new capability JSON parsed successfully with Node, which covers the file’s syntax despite the missing LSP.
