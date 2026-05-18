- `lsp_diagnostics` could not run because the configured `biome` LSP server is not installed in this environment.

## 2026-05-04 - Verification blockers

- `lsp_diagnostics` for `apps/conduit-next/src-tauri/src/mobile/session.rs` could not run because `rust-analyzer` is not installed in this environment.
- `cargo test event_forward_regression` currently fails before crate tests on Linux while compiling `irelia 0.9.2`: `CLIENT_PROCESS_NAME` and `GAME_PROCESS_NAME` are cfg-gated to Windows/macOS. A `RUSTFLAGS=\"--cfg docsrs\"` workaround is not viable on stable because transitive crates enable nightly docsrs features.
- `cargo fmt --check` reports pre-existing formatting diffs in `src/lcu/lockfile.rs`, `src/manager.rs`, and `src/main.rs`; the changed file passes `rustfmt --edition 2021 --check src/mobile/session.rs`.

## Scope Fidelity Check - 2026-05-04

- Verdict: REJECT. `apps/web-next` contains runtime/product behavior changes beyond type-only LCU adoption: Swiftplay validation/i18n, champ-select Arena/ARAM behavior, and unit test changes.
- Boundary verified: no `apps/rift-next` diff and no tunnel/opcode/encryption/framing path diff found.
- Dependencies: expected additions only (`irelia` in conduit-next, `@hasagi/types` in protocol-contract/bun.lock).
- Lockfile: `src/lcu/lockfile.rs` has no diff and remains used by `ConnectionManager::run`; static path/env discovery remains present, but Irelia adapters ignore the passed `LockfileInfo` for direct HTTP/WS client creation.
