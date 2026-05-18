## 2026-05-02 - LCU HTTP client

- Chose request-construction unit tests instead of a mock TLS server so auth headers, base URL construction, JSON bodies, and GET/POST/PATCH/DELETE methods can be verified without depending on a real LCU self-signed certificate.
- Kept refresh behavior narrow: the client refreshes lockfile info on request failure and retries once only if the refreshed lockfile differs from the stored one, avoiding generic retry/caching logic.

- Device approval uses `MessageDialogButtons::OkCancelCustom("Approve", "Reject")` with the required title/body, returning `false` if the dialog callback channel closes before a response.
- Approval tests mock a small `DeviceApprovalDialog` trait and assert prompt construction plus approve/reject mapping without opening native UI.

## 2026-05-02 - Mobile session handler

- Introduced a small object-safe `MobileHttpClient` trait rather than binding tests to `reqwest::Response`; production implements it for `LcuHttpClient`, while tests capture method/path/body directly.
- Kept the secret negotiation response unencrypted (`[2, true/false]`) to match the legacy C# handshake; all later outgoing frames use AES when the key is present.
- Added `persistence::is_device_approved` as a minimal false-returning hook so T10 can provide approval/storage later without this session module inventing persistent device storage.

## 2026-05-02 - Windows CI workflow

- Added `.github/workflows/conduit-windows.yml` for Windows x64 Tauri CI using root `bun install`, app `bun run build`, and `cargo tauri build --target x86_64-pc-windows-msvc --bundles msi,nsis`.
- Used explicit `--bundles msi,nsis` so CI can emit both MSI and EXE installers without changing `apps/conduit-next/src-tauri/tauri.conf.json`.

## 2026-05-02 - Crypto error handling

- Kept `CryptoError` limited to the requested variants; RSA public-key DER encoding failures map to `InvalidFormat` because no RSA-specific variant was in scope.
- Kept AES wire format unchanged as `base64(iv):base64(ciphertext)` and mapped malformed format/base64/key/padding/UTF-8 failures before any panic boundary.

## 2026-05-03 - Capability wiring

- Kept the new capability file self-contained in `src-tauri/capabilities/main.json` instead of editing `tauri.conf.json`; the repo already discovers capability manifests from the capabilities folder.
- Included `core:menu:default` alongside `core:tray:default` because the tray implementation builds a native menu and listens for menu events, not just tray clicks.
