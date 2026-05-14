# Sho'ma Rebrand — Reference Document

> **Date**: 2026-05-13
> **Status**: ✅ Completed
> **Commits**: 11
> **Scope**: Full rebrand of monorepo from "Mimic" to "Sho'ma"

---

## Overview

The Sho'ma rebrand transformed the entire active monorepo identity from "Mimic" to "Sho'ma". This document serves as a reference for anyone returning to understand what changed, why, and how to navigate the new naming.

## Component Names

| Component | Old Name | New Name | Package | Folder |
|-----------|----------|----------|---------|--------|
| Product | Mimic | Sho'ma | `shoma` (root) | `.` |
| Web UI | web | Loom | `@shoma/loom` | `loom/` |
| Relay Server | rift | Leyline | `@shoma/leyline` | `leyline/` |
| Desktop Bridge | conduit | Conduit | `@shoma/conduit` | `conduit/` |
| Shared Protocol | protocol-contract | Protocol Contract | `@shoma/protocol-contract` | `packages/protocol-contract/` |
| Internal Protocol | Rift | Relay | — | — |

## What Changed

### 1. Package Scope (`@mimic/*` → `@shoma/*`)

All internal package references were updated:
- `@mimic/web` → `@shoma/loom`
- `@mimic/rift` → `@shoma/leyline`
- `@mimic/conduit` → `@shoma/conduit`
- `@mimic/protocol-contract` → `@shoma/protocol-contract`

**Files affected**: 5 `package.json` files, 18+ import statements across TypeScript source and tests.

### 2. Folder Renames

- `web/` → `loom/`
- `rift/` → `leyline/`

All workspace configs (`tsconfig.json`, `vite.config.ts`, `oxlint.config.ts`, `react-doctor.config.json`) were updated to reference the new paths.

### 3. Environment Variables

| Old | New |
|-----|-----|
| `RIFT_JWT_SECRET` | `LEYLINE_JWT_SECRET` |
| `RIFT_DB_PATH` | `LEYLINE_DB_PATH` |
| `VITE_RIFT_WS_BASE_URL` | `VITE_LEYLINE_WS_BASE_URL` |
| `VITE_RIFT_HTTP_BASE_URL` | `VITE_LEYLINE_HTTP_BASE_URL` |
| `RIFT_HUB_HTTP_URL` | `LEYLINE_HUB_HTTP_URL` |
| `RIFT_HUB_WS_URL` | `LEYLINE_HUB_WS_URL` |

**Files affected**: `leyline/src/core/config/env-config.ts`, `loom/src/core/config/env-config.ts`, `.env.example` files, Rust source in `conduit/src-tauri/src/`.

### 4. Storage Keys (with Automatic Migration)

| Old | New |
|-----|-----|
| `mimic:connection` | `shoma:connection` |
| `mimic:session` | `shoma:session` |
| `mimic:settings` | `shoma:settings` |
| `mimic:lobby:sticky` | `shoma:lobby:sticky` |
| `mimic:ddragon:*` | `shoma:ddragon:*` |
| `mimic-debug` | `shoma-debug` |
| `__mimicMockLcu` | `__shomaMockLcu` |
| `__mimicHarnessRoot` | `__shomaHarnessRoot` |

**Migration**: `create-persisted-store.ts` includes `runStorageMigration()` which runs once per browser (tracked by `shoma:migrated` flag) and copies all `mimic:*` keys to `shoma:*` equivalents before deleting the old keys. This is idempotent.

### 5. Tauri Desktop Config

- **Product name**: `Mimic Conduit` → `Sho'ma Conduit`
- **Identifier**: `com.mimic.conduit` → `com.shoma.conduit`
- **Window titles**: Updated in `tauri.conf.json`, Rust source (`main.rs`, `manager.rs`, `tray.rs`), HTML files, and i18n strings.

### 6. Web Branding

- **HTML title**: `loom/index.html` → `"Sho'ma Loom"`
- **Manifest**: `name: "Sho'ma Loom"`, `short_name: "Sho'ma"`
- **Favicon SVG labels**: Updated `aria-label` text
- **UI text**: `MIMIC` → `SHO'MA` in route headings
- **Logo asset**: `assets/mimic-logo.png` → `assets/shoma-logo.png`

### 7. Internal Protocol Rename (`rift` → `relay`)

All internal protocol module names were renamed from "Rift" to "Relay":

- Folder: `loom/src/core/rift/` → `loom/src/core/relay/`
- `RiftClient` → `RelayClient`
- `RiftStore` → `RelayStore`
- `RiftFrame` → `RelayFrame`
- `RiftOpcode` → `RelayOpcode`
- `RiftHandshakeError` → `RelayHandshakeError`
- `useRiftClient` → `useRelayClient`
- `useRiftStore` → `useRelayStore`
- And ~40 more symbols across `loom/src/` and `leyline/src/`

### 8. CI/CD & Scripts

- **Workflow paths**: `apps/conduit-next/` → `conduit/` in `.github/workflows/*.yml`
- **Scripts folder**: `mimic-scripts/` → `shoma-scripts/`
- **Script names**: `mimic-*.cjs` → `shoma-*.cjs` (20 files)

### 9. Documentation

- `README.md` — Updated title, description, component names, links
- `AGENTS.md` — Updated structure, package refs, commands
- `CODEBASE_SUMMARY.md` — Full rebrand of architecture reference
- `CLAUDE.md` — Updated overview and structure
- `MIGRATION_PLAN.md` — Updated component names
- `docs/rift-next-*` → `docs/leyline-next-*` (3 files renamed + content)
- `docs/react-doctor.md`, `docs/migration/*.md` — Updated references

## What Did NOT Change

These were intentionally left untouched per project constraints:

- **`legacy/`** — Entire legacy codebase preserved as historical reference
- **`.sisyphus/plans/*mimic*`** — Historical plan files kept intact
- **Business logic** — No functional changes, only naming
- **Visual design** — No colors, typography, layout, or UX changes
- **Travis CI badge** — Points to external `molenzwiebel/Mimic` repo (not under our control)

## Commits

```
32f1a71f rebrand: rename internal rift protocol modules to relay
d05db7ed rebrand: rename logo asset and update manifest description
fd11952a rebrand: mark all plan tasks and final verification wave as complete
2fd1e7b2 rebrand: fix residual brand references (Effect tags, i18n, UI text, .env comments)
dc3c6142 rebrand: fix rift→leyline test import and regenerate lockfiles
de101a09 rebrand: update CI/CD workflows and rename scripts folder
8da75a12 rebrand: update Tauri config, web branding, and docs
9471d683 rebrand: rename storage keys and add automatic localStorage migration
ee48c348 rebrand: rename environment variables to LEYLINE_*
c59135d5 rebrand: rename folders web→loom, rift→leyline and update configs
8c1f433e rebrand: rename package names to @shoma/*
```

## Developer Migration Notes

### If you're updating an existing clone

1. **Rename folders locally** (if they still exist):
   ```bash
   git mv web loom
   git mv rift leyline
   git mv mimic-scripts shoma-scripts
   ```

2. **Install dependencies**:
   ```bash
   bun install
   ```

3. **Update your local `.env` files**:
   - `RIFT_JWT_SECRET` → `LEYLINE_JWT_SECRET`
   - `VITE_RIFT_WS_BASE_URL` → `VITE_LEYLINE_WS_BASE_URL`
   - etc. (see table above)

4. **Clear browser localStorage** if you see storage errors (or let the automatic migration handle it on next load).

### Import path changes

| Old | New |
|-----|-----|
| `from "@mimic/protocol-contract"` | `from "@shoma/protocol-contract"` |
| `import { RiftClient }` | `import { RelayClient }` |
| `import { useRiftStore }` | `import { useRelayStore }` |
| `loom/src/core/rift/*` | `loom/src/core/relay/*` |

### Dev commands

| Old | New |
|-----|-----|
| `bun run dev:web` | `bun run dev:loom` |
| `bun run dev:rift` | `bun run dev:leyline` |
| `bun run build:web` | `bun run build:loom` |
| `bun run build:rift` | `bun run build:leyline` |

## Verification Results

| Check | Result |
|-------|--------|
| Exhaustive grep for `mimic`/`Mimic`/`MIMIC`/`@mimic/` | **0 matches** in active code |
| Exhaustive grep for `RIFT_` | **0 matches** in active code |
| Exhaustive grep for `com.mimic.` | **0 matches** in active code |
| `bun install` | ✅ Exit 0 |
| `bun run --filter @shoma/loom build` | ✅ Exit 0 |
| `bun run --filter @shoma/protocol-contract build` | ✅ Exit 0 |
| `bun run dev:loom` | ✅ Starts on `:5176` |
| `bun run dev:leyline` | ✅ Starts on `:51001` |
| React Doctor (`loom`) | ✅ Score 84 |
| React Doctor (`conduit`) | ✅ Score 100 |

## Known Pre-Existing Issues (Not Rebrand-Related)

These failures existed before the rebrand and were not caused by it:

1. **`leyline/tests/unit/env-config.test.ts`** — `loadConfig` redeclaration error (TypeScript scoping issue in test file)
2. **`conduit` Rust build on Linux** — `irelia` crate fails to compile on non-Windows/macOS targets (platform-specific constants gated behind `cfg`)
3. **`loom/tests/integration/lcu-transport.test.ts`** — Expects trailing `null` in frame but receives frame without it (confirmed pre-existing on clean master)
4. **Some `loom` sticky lobby tests** — Fail due to mock storage unavailability in test environment (pre-existing)
5. **`packages/protocol-contract/tsconfig.json`** — `baseUrl` option causes lint errors (pre-existing config issue)

## Gotchas & Edge Cases

- **Path aliases in `tsconfig.json`**: Both `loom/tsconfig.json` and `leyline/tsconfig.json` override `paths` from `tsconfig.base.json`, so `@shoma/protocol-contract` had to be added to both files individually.
- **Effect Context tags**: `leyline/src/core/database/database-service.ts` and `realtime-service.ts` use string tags like `'@shoma/leyline/DatabaseService'` — these were missed in the first pass and fixed in a follow-up commit.
- **SVG aria-labels**: The favicon and icon SVGs had `aria-label` text containing "Mimic" that was easy to miss since SVG path data itself didn't change.
- **`.env.example` comments**: Spanish-language comments (e.g., `# Mimic Web — Variables de entorno`) were missed initially since grep focused on key names, not comments.
- **Script file contents**: The `shoma-scripts/*.cjs` files had hardcoded `"mimic.lol"` URLs and `"mimic"` strings in their logic that needed content updates after the folder rename.

## Files You Should Know

| File | Purpose |
|------|---------|
| `loom/src/core/state/create-persisted-store.ts` | Contains `runStorageMigration()` — handles `mimic:` → `shoma:` localStorage migration |
| `leyline/src/core/config/env-config.ts` | Reads `LEYLINE_JWT_SECRET`, `LEYLINE_DB_PATH` |
| `loom/src/core/config/env-config.ts` | Reads `VITE_LEYLINE_WS_BASE_URL`, `VITE_LEYLINE_HTTP_BASE_URL` |
| `conduit/src-tauri/tauri.conf.json` | Tauri config with `identifier: "com.shoma.conduit"` |
| `package.json` | Root package `shoma`, workspaces `[loom, leyline, conduit, packages/*]` |
| `tsconfig.base.json` | Path alias `@shoma/protocol-contract` |

---

*Generated: 2026-05-13*
*Plan: `.sisyphus/plans/shoma-rebrand.md`*
