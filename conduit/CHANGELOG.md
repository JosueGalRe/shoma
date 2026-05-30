# Changelog

All notable changes to Sho'ma Conduit are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
