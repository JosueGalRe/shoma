# Changelog

All notable changes to Sho'ma Conduit are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] — 2026-08-01

### Added
- feat(conduit): internationalize update prompt, error toast, and title bar (d36b0a3)

### Fixed
- fix(conduit): point muted color refs at defined design token (3f09f26)
- fix(conduit): restore settings back button sizing with utilities (e6396bb)
- fix(conduit): drop undefined class from error-toast styles (d20ca84)
- fix(conduit): satisfy updated lint rules in ui components (e4c557a)
- fix(conduit): poll for GitHub Actions run after tag push (070cd82)

### Changed
- refactor(conduit): split use-i18n into hook, types, and utils modules (728f1ab)
- refactor(conduit): group components by domain into subdirectories (831c996)
- refactor(conduit): extract use-i18n and group hooks under hooks directory (b826928)
- refactor(conduit): extract connection event wiring into use-connection-events hook (6f9e4a8)
- refactor(conduit): extract device approval flow into use-device-approval hook (48ac053)
- refactor(conduit): extract updater logic from app into use-updater hook (5ef1667)
- refactor(conduit): extract component prop types to dedicated types files (401dc8d)
- refactor(conduit): remove migrated classes from style.css (686800f)
- refactor(conduit): migrate app shell to tailwind utilities (e3ba4d3)
- refactor(conduit): migrate settings-panel to tailwind utilities (0d08266)
- refactor(conduit): remove migrated classes from style.css (223a35f)
- refactor(conduit): migrate error-toast to tailwind utilities (a82e63e)
- refactor(conduit): migrate device-approval-modal to tailwind utilities (b9cdf03)
- refactor(conduit): migrate title-bar to tailwind utilities (aca8056)
- refactor(conduit): remove migrated access-code classes from style.css (7855667)
- refactor(conduit): migrate access-code-section to tailwind utilities (a005a76)
- refactor(conduit): migrate access-code-display to tailwind utilities (9a4639e)
- refactor(conduit): migrate generating-state to tailwind utilities (ca9bdbf)
- refactor(conduit): migrate pill-status to tailwind utilities (e447f26)
- refactor(conduit): migrate retry-button to tailwind utilities (e1be1a1)
- refactor(conduit): drop unnecessary memo hooks in prompt, retry, settings components (a2e7866)

### Maintenance
- docs(conduit): sync AGENTS.md with new frontend structure (0d7bc52)
- chore(conduit): bump rust majors and drop unused pkcs8/pem deps (540d4e5)
- chore(conduit): bump rust dependencies within semver ranges (1af19dc)
- chore(deps): bump workspace dependencies and pin vite-plus to 0.2.6 (c9b5979)

### Other
- style(conduit): clean orphaned type imports after extraction (77550f3)
- style(conduit): fix oxfmt violations failing CI vp check (f29d829)

## [0.1.17] — 2026-05-30

### Added

- feat(conduit): add release automation skill and tooling (3538a30)

### Fixed

- fix(conduit): stricter AGENTS.md filter and regression test (051e7c5)
- fix(conduit): enforce updater URL suffixes, fix AGENTS.md filter, add poll delay (cdca183)

## [0.1.16] — 2026-05-30

### Added

- **Configurable Loom web URL for QR codes** — Conduit now supports a `LOOM_WEB_URL` environment variable (and `--loom-web-url` CLI flag) to specify the URL encoded in access-code QR codes. This allows the QR code to point to the web deployment (`https://app.shoma.lol`) while the API connection continues to use the relay URL (`https://api.shoma.lol`). The variable uses the same resolution chain as hub URLs: CLI arg → env → `.env` file → compile-time → default (`http://localhost:5176`).

## [0.1.15] — 2026-05-29

### Added

- **Exponential backoff reconnect** — Instead of retrying every 5 seconds, Conduit now uses exponential backoff with jitter after connection failures: 5s, 10s, 20s, 40s, then capped at 60s. This reduces unnecessary load on both the relay and the League Client.
- **Debounced retry button** — A "Retry Now" button appears when Conduit encounters a connection error or is actively retrying. It is debounced (3s cooldown) to prevent accidental spam-clicking. The current retry attempt count is shown as a badge.
- **Window focus on device approval** — When a mobile device requests connection approval, the Conduit window automatically shows and focuses so the user doesn't miss the prompt.
- **Reconnect now command** — Added a `reconnect_now` Tauri command that bypasses the backoff delay and resets the attempt counter to zero, used by the retry button.

### Fixed

- **Invalid Date in update prompt** — The update prompt now validates the release date before formatting. If the date is missing or unparseable, the field is hidden instead of displaying "Invalid Date".

## [0.1.14] — 2025-04-02

### Added

- Cross-platform desktop bridge with Tauri v2.
- League Client lockfile detection and LCU proxy.
- Encrypted mobile session relay through Leyline.
- Device approval flow with custom modal dialog.
- System tray integration with show/quit actions.
- Auto-startup support (macOS LaunchAgent).
- QR code and access code display for mobile pairing.
- Settings panel with language switcher and device revocation.
- Daily background update checks.
