# Rebrand Completo: Mimic → Sho'ma

## TL;DR
> **Summary**: Rebrand completo del monorepo mimic a Sho'ma. Renombrado de package names, carpetas, imports, env vars, storage keys, branding assets, CI/CD, docs y scripts. Incluye migración automática de localStorage.
> **Deliverables**: Packages renombrados a @shoma/*, carpetas web→loom/rift→leyline, imports actualizados, env vars migradas, storage keys migradas con fallback, assets renombrados, docs actualizados, CI/CD actualizado.
> **Effort**: Large
> **Parallel**: YES — 5 waves + final verification
> **Critical Path**: Wave 1 (Foundation) → Wave 2 (Code refs) → Wave 3 (Assets/UI) → Wave 4 (CI/scripts) → Wave 5 (Verification)

## Context

### Original Request
Rebrand completo de "mimic" a "Sho'ma" con componentes:
- Sho'ma Loom (web UI)
- Sho'ma Leyline (relay server)
- Sho'ma Conduit (desktop bridge)

### Interview Summary
- Root package: `shoma`
- Scripts de dev: nuevo branding (`dev:loom`, `dev:leyline`, `dev:conduit`)
- Env vars/storage: hard rename + migración automática de localStorage keys
- Tauri identifier: cambiar a `com.shoma.conduit`
- GitHub: renombrar repo actual
- legacy/ se mantiene como referencia histórica (sin cambios)
- .sisyphus/plans/ con "mimic" en nombre se mantienen históricos
- Rebrand visual (colores, logo, tipografía) va en plan separado

### Metis Review (gaps addressed)
- Exclusion globs definidos: `legacy/**`, `.sisyphus/plans/**`, build outputs
- Compatibilidad de storage: migración automática de `mimic:*` a `shoma:*`
- Compatibilidad de env vars: hard rename con docs actualizadas
- Tauri identifier: se acepta nueva identidad de app
- Lockfiles: regenerar con `bun install`, NO editar manualmente
- Apostrophe en Sho'ma: manejar escaping en JSON/HTML/strings

## Work Objectives

### Core Objective
Transformar toda la identidad del proyecto de "mimic" a "Sho'ma" en el monorepo activo, preservando completamente la funcionalidad y sin tocar código legacy.

### Deliverables
1. Root package renombrado a `shoma`
2. Workspaces renombrados: `web` → `loom`, `rift` → `leyline`, `conduit` → `conduit`, `packages/*` → `packages/*`
3. Package scope: `@mimic/*` → `@shoma/*`
4. Import paths actualizados en 25+ archivos
5. Env vars renombradas: `RIFT_*` → `LEYLINE_*`, `VITE_RIFT_*` → `VITE_LEYLINE_*`
6. Storage keys renombradas con migración automática: `mimic:*` → `shoma:*`
7. Tauri app identifier: `com.mimic.conduit` → `com.shoma.conduit`
8. Branding assets renombrados (favicon, icons, manifest, logo)
9. UI text actualizado (MIMIC → SHO'MA)
10. README, AGENTS.md, CODEBASE_SUMMARY.md, docs actualizados
11. CI/CD workflows actualizados
12. Scripts folder renombrado: `mimic-scripts/` → `shoma-scripts/`
13. Lockfiles regenerados

### Definition of Done (verifiable conditions)
```bash
# 1. Package graph installs cleanly
bun install
# Expected: success, lockfile updated

# 2. No old brand references outside exclusions
grep -r "@mimic/" --include="*.{ts,tsx,js,json,md,yml,yaml,rs,toml,html}" . \
  --exclude-dir=node_modules --exclude-dir=legacy --exclude-dir=.sisyphus --exclude-dir=dist
# Expected: no matches

# 3. Build passes
bun run build
# Expected: zero errors

# 4. Tests pass
bun run test
# Expected: zero failing tests

# 5. Lint/format pass
bun run lint
bun run fmt:check
# Expected: zero violations

# 6. React diagnostics pass
bun run doctor:react:check
# Expected: score >= threshold
```

### Must Have
- [ ] Todos los package.json actualizados con nuevos nombres
- [ ] Todas las carpetas renombradas (web→loom, rift→leyline)
- [ ] Todos los imports `@mimic/protocol-contract` → `@shoma/protocol-contract`
- [ ] Todos los env vars renombrados
- [ ] Migración automática de localStorage keys
- [ ] Todos los storage keys renombrados en código fuente
- [ ] Tauri identifier y productName actualizados
- [ ] HTML titles, manifest, favicon actualizados
- [ ] README y docs actualizados
- [ ] CI/CD workflows actualizados
- [ ] Scripts folder renombrado
- [ ] Lockfiles regenerados
- [ ] `.env` y `.env.example` actualizados

### Must NOT Have (guardrails)
- [ ] NO modificar `legacy/` en absoluto (ni carpetas, ni contenido, ni docs)
- [ ] NO modificar `.sisyphus/plans/*mimic*` (filenames ni contenido)
- [ ] NO cambiar lógica de negocio
- [ ] NO cambiar colores, tipografía, layout, UX (va en plan separado)
- [ ] NO editar lockfiles manualmente — regenerar con bun install
- [ ] NO modificar build outputs (dist/, node_modules/)
- [ ] NO cambiar funcionalidad de protocol-contract
- [ ] NO tocar nombres de funciones internas que no sean branding

## Verification Strategy
> ZERO HUMAN INTERVENTION — all verification is agent-executed.
- **Test decision**: Tests-after (verificar que todo sigue funcionando tras el rename)
- **QA policy**: Cada wave tiene verificación con Bash/grep
- **Evidence**: `.sisyphus/evidence/shoma-rebrand/*.txt`, `.png`

## Execution Strategy

### Parallel Execution Waves

**Wave 1: Foundation Rename (Package Metadata + Config)**
- Renombrar root package a `shoma`
- Renombrar packages: `@mimic/web`→`@shoma/loom`, `@mimic/rift`→`@shoma/leyline`, `@mimic/conduit`→`@shoma/conduit`, `@mimic/protocol-contract`→`@shoma/protocol-contract`
- Actualizar root `package.json` workspaces y scripts
- Actualizar `tsconfig.json` workspace roots
- Actualizar `tsconfig.base.json` path alias
- Actualizar `vite.config.ts` import sorting
- Actualizar `oxlint.config.ts` workspace patterns
- Actualizar `react-doctor.config.json` workspace ignores
- Mover carpetas: `web/` → `loom/`, `rift/` → `leyline/`
- Actualizar workspace paths en root configs

**Wave 2: Code References (Imports + Env Vars + Storage)**
- Bulk replace `@mimic/protocol-contract` → `@shoma/protocol-contract` en 25+ archivos
- Renombrar env vars: `RIFT_JWT_SECRET`→`LEYLINE_JWT_SECRET`, `RIFT_DB_PATH`→`LEYLINE_DB_PATH`, `VITE_RIFT_WS_BASE_URL`→`VITE_LEYLINE_WS_BASE_URL`, `VITE_RIFT_HTTP_BASE_URL`→`VITE_LEYLINE_HTTP_BASE_URL`, `RIFT_HUB_HTTP_URL`→`LEYLINE_HUB_HTTP_URL`, `RIFT_HUB_WS_URL`→`LEYLINE_HUB_WS_URL`
- Renombrar storage keys: `mimic:`→`shoma:`, `mimic-debug`→`shoma-debug`, `__mimicMockLcu`→`__shomaMockLcu`, `mimic:lcu-mock-update`→`shoma:lcu-mock-update`, `mimic:lobby:sticky`→`shoma:lobby:sticky`, `__mimicHarnessRoot`→`__shomaHarnessRoot`
- Implementar migración automática de localStorage en `create-persisted-store.ts`
- Actualizar `.env.example` files en web/, rift/, leyline/
- Actualizar `.env` files (con nota de no commitear secrets)

**Wave 3: Branding Assets & UI Text**
- Renombrar `web/public/favicon.svg` → contenido actualizado con marca Sho'ma
- Actualizar `web/public/manifest.webmanifest` app name/short_name
- Actualizar `loom/index.html` (antes web/index.html) title
- Actualizar `conduit/index.html` title
- Actualizar `conduit/about.html` title
- Actualizar `conduit/src-tauri/tauri.conf.json` productName, identifier, title
- Actualizar `conduit/src/i18n/en.json` y `es.json` strings
- Actualizar UI text: `MIMIC` → `SHO'MA` en routes
- Actualizar `assets/mimic-logo.png` → renombrar o reemplazar
- Actualizar `README.md` completo
- Actualizar `AGENTS.md` estructura/nombres
- Actualizar `CODEBASE_SUMMARY.md` referencias

**Wave 4: CI/CD & Scripts**
- Renombrar `.github/workflows/conduit-mac.yml` paths (apps/conduit-next → conduit/)
- Actualizar artifact names en workflows
- Renombrar `mimic-scripts/` → `shoma-scripts/`
- Actualizar contenido de scripts si referencian paths antiguos
- Actualizar `.travis.yml` si aplica (legacy, probablemente no tocar)

**Wave 5: Verification & Lockfile Regeneration**
- Regenerar `bun.lock` y `bun.lockb` con `bun install`
- Verificar que no queden `@mimic/` fuera de exclusiones
- Verificar que `legacy/` no haya sido tocado
- Verificar build pasa
- Verificar tests pasan
- Verificar lint/format pasan
- Verificar React doctor pasa

### Dependency Matrix
| Task | Wave | Blocks | Blocked By |
|------|------|--------|------------|
| Root package rename | 1 | Waves 2-5 | - |
| Folder rename (web→loom, rift→leyline) | 1 | Waves 2-5 | - |
| Package.json updates | 1 | Waves 2-5 | - |
| Config updates (tsconfig, vite, oxlint) | 1 | Waves 2-5 | - |
| Import path replacements | 2 | Waves 3-5 | Wave 1 |
| Env var renames | 2 | Waves 3-5 | Wave 1 |
| Storage key renames + migration | 2 | Waves 3-5 | Wave 1 |
| .env updates | 2 | Waves 3-5 | Wave 1 |
| HTML/manifest/Tauri updates | 3 | Wave 5 | Waves 1-2 |
| UI text updates | 3 | Wave 5 | Waves 1-2 |
| README/docs updates | 3 | Wave 5 | Waves 1-2 |
| CI/CD updates | 4 | Wave 5 | Waves 1-2 |
| Scripts folder rename | 4 | Wave 5 | Waves 1-2 |
| Lockfile regeneration | 5 | - | Waves 1-4 |
| Final verification | 5 | - | Waves 1-4 |

### Agent Dispatch Summary
| Wave | Tasks | Categories |
|------|-------|------------|
| Wave 1 | 4 | quick, deep |
| Wave 2 | 5 | quick, deep |
| Wave 3 | 4 | quick, writing |
| Wave 4 | 3 | quick |
| Wave 5 | 5 | unspecified-high, oracle |
| Final Verification | 4 | oracle, unspecified-high, deep |

## TODOs

> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [x] 1. Renombrar Root Package y Package Names

  **What to do**:
  1. Editar `package.json` root: cambiar `"name": "mimic-mono"` → `"name": "shoma"`
  2. Actualizar scripts: `"dev:web"` → `"dev:loom"`, `"dev:rift"` → `"dev:leyline"`, `"build:web"` → `"build:loom"`, `"build:rift"` → `"build:leyline"`, `"test:web"` → `"test:loom"`, `"test:rift"` → `"test:leyline"`, `"lint:web"` → `"lint:loom"`, `"lint:rift"` → `"lint:leyline"`
  3. Actualizar workspace filters: `"--filter @mimic/web"` → `"--filter @shoma/loom"`, etc.
  4. Editar `web/package.json`: `"name": "@mimic/web"` → `"@shoma/loom"`, actualizar dependencia `"@mimic/protocol-contract"` → `"@shoma/protocol-contract"`
  5. Editar `rift/package.json`: `"name": "@mimic/rift"` → `"@shoma/leyline"`, actualizar dependencia `"@mimic/protocol-contract"` → `"@shoma/protocol-contract"`
  6. Editar `conduit/package.json`: `"name": "@mimic/conduit"` → `"@shoma/conduit"`, actualizar dependencia `"@mimic/protocol-contract"` → `"@shoma/protocol-contract"`
  7. Editar `packages/protocol-contract/package.json`: `"name": "@mimic/protocol-contract"` → `"@shoma/protocol-contract"`

  **Must NOT do**:
  - No modificar `legacy/web/package.json` ni `legacy/rift/package.json`
  - No cambiar versiones de paquetes
  - No modificar otras dependencias externas

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: edits mecánicas en JSON
  - Skills: [] — Reason: solo ediciones de texto

  **Parallelization**: Can Parallel: NO (debe ser atómico) | Wave 1 | Blocks: 2-18 | Blocked By: -

  **References**:
  - File: `package.json` — root package y scripts
  - File: `web/package.json` — package name @mimic/web
  - File: `rift/package.json` — package name @mimic/rift
  - File: `conduit/package.json` — package name @mimic/conduit
  - File: `packages/protocol-contract/package.json` — shared package

  **Acceptance Criteria**:
  - [ ] Root package.json tiene `"name": "shoma"`
  - [ ] Cada workspace package.json tiene nombre @shoma/* correcto
  - [ ] Todos los scripts usan nombres nuevos (dev:loom, dev:leyline)
  - [ ] grep `"@mimic/"` en package.json files → 0 matches (excepto legacy/)

  **QA Scenarios**:
  ```
  Scenario: Package names updated
    Tool: Bash
    Steps: grep -r '"@mimic/' package.json web/package.json rift/package.json conduit/package.json packages/protocol-contract/package.json
    Expected: No matches
    Evidence: .sisyphus/evidence/shoma-rebrand/task-1-packages.txt
  ```

  **Commit**: YES | Message: `rebrand: rename package names to @shoma/*` | Files: `package.json`, `web/package.json`, `rift/package.json`, `conduit/package.json`, `packages/protocol-contract/package.json`

- [x] 2. Renombrar Carpetas y Actualizar Workspace Configs

  **What to do**:
  1. Mover carpeta: `mv web loom` (o git mv para preservar historia)
  2. Mover carpeta: `mv rift leyline`
  3. Actualizar `package.json` workspaces: `"web/*"` → `"loom/*"`, `"rift/*"` → `"leyline/*"`
  4. Actualizar `tsconfig.json`: `"web/src/**/*"` → `"loom/src/**/*"`, `"rift/src/**/*"` → `"leyline/src/**/*"`, `"rift/tests/**/*"` → `"leyline/tests/**/*"`
  5. Actualizar `tsconfig.base.json`: path alias si apunta a rutas de carpetas
  6. Actualizar `vite.config.ts`: workspace ignore patterns y `@mimic/` import sorting → `@shoma/`
  7. Actualizar `oxlint.config.ts`: workspace paths
  8. Actualizar `react-doctor.config.json`: workspace ignores

  **Must NOT do**:
  - No renombrar `legacy/web/` ni `legacy/rift/`
  - No modificar contenido dentro de las carpetas en este paso (eso es Wave 2)

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: renames y edits de config
  - Skills: [] — Reason: operaciones de filesystem y config edits

  **Parallelization**: Can Parallel: NO (debe ser atómico con task 1) | Wave 1 | Blocks: 3-18 | Blocked By: -

  **References**:
  - File: `package.json` — workspaces array
  - File: `tsconfig.json` — include paths
  - File: `tsconfig.base.json` — path aliases
  - File: `vite.config.ts` — workspace ignores
  - File: `oxlint.config.ts` — workspace patterns
  - File: `react-doctor.config.json` — workspace ignores

  **Acceptance Criteria**:
  - [ ] Carpetas `loom/` y `leyline/` existen
  - [ ] Carpetas `web/` y `rift/` ya no existen (excepto en legacy/)
  - [ ] `package.json` workspaces referencian `loom/` y `leyline/`
  - [ ] `tsconfig.json` includes apuntan a `loom/` y `leyline/`

  **QA Scenarios**:
  ```
  Scenario: Folders renamed
    Tool: Bash
    Steps: ls -d loom leyline && test ! -d web && test ! -d rift
    Expected: loom/ y leyline/ existen; web/ y rift/ no existen en root
    Evidence: .sisyphus/evidence/shoma-rebrand/task-2-folders.txt
  ```

  **Commit**: YES | Message: `rebrand: rename folders web→loom, rift→leyline` | Files: `package.json`, `tsconfig.json`, `tsconfig.base.json`, `vite.config.ts`, `oxlint.config.ts`, `react-doctor.config.json`

- [x] 3. Actualizar Import Paths @mimic/protocol-contract → @shoma/protocol-contract

  **What to do**:
  1. Buscar y reemplazar en TODO el repo (excluyendo legacy/, .sisyphus/, node_modules/):
     - `from "@mimic/protocol-contract"` → `from "@shoma/protocol-contract"`
     - `from '@mimic/protocol-contract'` → `from '@shoma/protocol-contract'`
  2. Archivos afectados (25+):
     - `leyline/src/index.ts`
     - `leyline/src/core/realtime/realtime-service.ts`
     - `leyline/tests/unit/realtime.test.ts`
     - `leyline/tests/integration/runtime.test.ts`
     - `leyline/tests/integration/websocket-integration.test.ts`
     - `loom/src/core/rift/rift-client.ts`
     - `loom/src/core/rift/lcu-transport.ts`
     - `loom/src/core/rift/hooks.ts`
     - `loom/src/core/lcu/lcu-mutations.test.ts`
     - `loom/src/core/lcu/lcu-mutations.ts`
     - `loom/src/core/lcu/lcu-queries.ts`
     - `loom/src/testing/lcu-mock.ts`
     - `loom/src/testing/lcu-mock.smoke.test.ts`
     - `loom/src/routes/connected/swiftplay/route.tsx`
     - `loom/src/features/social/hooks/use-invite-friend.ts`
     - `loom/src/features/social/hooks/use-chat-lcu.ts`
     - `loom/src/features/social/hooks/use-send-chat-message.ts`
     - `loom/src/features/champ-select/hooks/use-champ-select.ts`
     - `loom/src/features/champ-select/components/rune-editor.tsx`
     - `loom/src/features/lobby/hooks/use-lobby.ts`
     - `loom/src/features/lobby/lobby-store.ts`
     - `loom/src/features/invites/use-invites.ts`

  **Must NOT do**:
  - No tocar archivos en `web/src-old/` (legacy code)
  - No cambiar otros imports que no sean `@mimic/protocol-contract`

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: bulk replace mecánico
  - Skills: [] — Reason: grep + sed/ast_grep_replace

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: 5-18 | Blocked By: 1, 2

  **References**:
  - Pattern: `from "@mimic/protocol-contract"` — en todos los archivos listados arriba

  **Acceptance Criteria**:
  - [ ] grep `from "@mimic/protocol-contract"` en source files (excluyendo legacy, src-old, .sisyphus) → 0 matches
  - [ ] grep `from "@shoma/protocol-contract"` → al menos 25 matches

  **QA Scenarios**:
  ```
  Scenario: All imports updated
    Tool: Bash
    Steps: grep -r 'from "@mimic/protocol-contract"' --include="*.ts" --include="*.tsx" . --exclude-dir=legacy --exclude-dir=web/src-old --exclude-dir=.sisyphus --exclude-dir=node_modules
    Expected: Empty output
    Evidence: .sisyphus/evidence/shoma-rebrand/task-3-imports.txt
  ```

  **Commit**: YES | Message: `rebrand: update @mimic/protocol-contract imports to @shoma/protocol-contract` | Files: todos los 25+ archivos listados

- [x] 4. Renombrar Environment Variables

  **What to do**:
  1. En `leyline/src/core/config/env-config.ts` y tests:
     - `RIFT_JWT_SECRET` → `LEYLINE_JWT_SECRET`
     - `RIFT_DB_PATH` → `LEYLINE_DB_PATH`
  2. En `loom/src/core/config/env-config.ts` y tests:
     - `VITE_RIFT_WS_BASE_URL` → `VITE_LEYLINE_WS_BASE_URL`
     - `VITE_RIFT_HTTP_BASE_URL` → `VITE_LEYLINE_HTTP_BASE_URL`
  3. En `conduit/src-tauri/src/main.rs`, `manager.rs`, `rift/hub.rs`:
     - `RIFT_HUB_HTTP_URL` → `LEYLINE_HUB_HTTP_URL`
     - `RIFT_HUB_WS_URL` → `LEYLINE_HUB_WS_URL`
  4. Actualizar `leyline/.env.example`, `leyline/.env`
  5. Actualizar `loom/.env.example`, `loom/.env`
  6. Actualizar `conduit/src-tauri/` config si tiene env vars documentadas
  7. Actualizar docs: `docs/migration/fast-track-readiness.md`, `docs/rift-next-plan-migracion.md`, `docs/rift-next-security-hardening.md`, `docs/rift-next-diagnostico.md`

  **Must NOT do**:
  - No modificar env vars en `legacy/` (historical reference)
  - No cambiar valores de secrets, solo nombres de keys

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: search/replace mecánico
  - Skills: [] — Reason: grep + replace

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: 5-18 | Blocked By: 1, 2

  **References**:
  - File: `leyline/src/core/config/env-config.ts`
  - File: `leyline/tests/unit/env-config.test.ts`
  - File: `loom/src/core/config/env-config.ts`
  - File: `conduit/src-tauri/src/main.rs`
  - File: `conduit/src-tauri/src/manager.rs`
  - File: `conduit/src-tauri/src/rift/hub.rs`

  **Acceptance Criteria**:
  - [ ] grep `RIFT_JWT_SECRET|RIFT_DB_PATH|VITE_RIFT_|RIFT_HUB_` en source files (excluyendo legacy) → 0 matches
  - [ ] Todos los `.env.example` usan nombres nuevos

  **QA Scenarios**:
  ```
  Scenario: Env vars renamed
    Tool: Bash
    Steps: grep -rE 'RIFT_JWT_SECRET|RIFT_DB_PATH|VITE_RIFT_|RIFT_HUB_' --include="*.{ts,tsx,rs,toml,md}" . --exclude-dir=legacy --exclude-dir=.sisyphus --exclude-dir=node_modules
    Expected: Empty output
    Evidence: .sisyphus/evidence/shoma-rebrand/task-4-env.txt
  ```

  **Commit**: YES | Message: `rebrand: rename environment variables to LEYLINE_*` | Files: `leyline/src/core/config/env-config.ts`, `leyline/tests/unit/env-config.test.ts`, `loom/src/core/config/env-config.ts`, `conduit/src-tauri/src/main.rs`, `conduit/src-tauri/src/manager.rs`, `conduit/src-tauri/src/rift/hub.rs`, `.env.example` files

- [x] 5. Renombrar Storage Keys e Implementar Migración Automática

  **What to do**:
  1. En `loom/src/core/state/create-persisted-store.ts`:
     - Cambiar prefix de key: `mimic:` → `shoma:`
     - Agregar función de migración que, al iniciar, busque todas las keys con prefijo `mimic:` en localStorage, las copie a `shoma:` equivalente, y las elimine. Ejecutar una sola vez, marcar con `shoma:migrated` flag.
  2. Renombrar storage keys en código:
     - `mimic-debug` → `shoma-debug`
     - `__mimicMockLcu` → `__shomaMockLcu`
     - `mimic:lcu-mock-update` → `shoma:lcu-mock-update`
     - `mimic:lobby:sticky` → `shoma:lobby:sticky`
     - `__mimicHarnessRoot` → `__shomaHarnessRoot`
  3. Actualizar archivos que usan estas keys:
     - `loom/src/core/state/session-store.ts`
     - `loom/src/core/state/settings-store.ts`
     - `loom/src/core/http/ddragon-client.ts`
     - `loom/src/core/debug.ts`
     - `loom/src/core/rift/lcu-mock-dev.ts`
     - `loom/src/features/lobby/lobby-store.ts`
     - Test files: `loom/tests/unit/persist-hydration.test.ts`, `loom/tests/unit/ddragon-client.test.ts`, `loom/tests/e2e/*.pw.ts`

  **Must NOT do**:
  - No tocar keys en `legacy/` o `web/src-old/`
  - No romper funcionalidad de persistencia

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: requiere entender localStorage API y migración segura
  - Skills: [] — Reason: TypeScript + localStorage

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: 6-18 | Blocked By: 1, 2

  **References**:
  - File: `loom/src/core/state/create-persisted-store.ts` — core persistence logic
  - File: `loom/src/core/state/session-store.ts` — session storage keys
  - File: `loom/src/core/state/settings-store.ts` — settings storage keys
  - File: `loom/src/core/http/ddragon-client.ts` — cache prefix

  **Acceptance Criteria**:
  - [ ] Todas las keys `mimic:*` renombradas a `shoma:*` en source files
  - [ ] Función de migración existe y es idempotente (no corre 2x)
  - [ ] grep `mimic:` en source files (excluyendo legacy) → solo en strings de migración o comentarios

  **QA Scenarios**:
  ```
  Scenario: Storage keys migrated
    Tool: Bash
    Steps: grep -r 'mimic:' --include="*.{ts,tsx}" loom/src/ --exclude-dir=web/src-old | grep -v 'migration' | grep -v 'comment'
    Expected: Empty output (excepto en comentarios de migración)
    Evidence: .sisyphus/evidence/shoma-rebrand/task-5-storage.txt
  ```

  **Commit**: YES | Message: `rebrand: rename storage keys and add automatic localStorage migration` | Files: `loom/src/core/state/create-persisted-store.ts`, `loom/src/core/state/session-store.ts`, `loom/src/core/state/settings-store.ts`, `loom/src/core/http/ddragon-client.ts`, `loom/src/core/debug.ts`, `loom/src/core/rift/lcu-mock-dev.ts`, `loom/src/features/lobby/lobby-store.ts`, test files

- [x] 6. Actualizar Tauri Config y Desktop Branding

  **What to do**:
  1. Editar `conduit/src-tauri/tauri.conf.json`:
     - `productName`: `"Mimic Conduit"` → `"Sho'ma Conduit"`
     - `identifier`: `"com.mimic.conduit"` → `"com.shoma.conduit"`
     - `windows.title`: actualizar si aplica
  2. Editar `conduit/src-tauri/Cargo.toml` si tiene `name` o `package.name` con "mimic"
  3. Editar `conduit/src-tauri/Cargo.lock` — puede necesitar `cargo update` tras cambio de nombre
  4. Editar `conduit/index.html`: `<title>` → "Sho'ma Conduit"
  5. Editar `conduit/about.html`: `<title>` → "About Sho'ma Conduit"
  6. Editar `conduit/src/i18n/en.json`: reemplazar "Mimic Conduit" → "Sho'ma Conduit"
  7. Editar `conduit/src/i18n/es.json`: reemplazar "Mimic Conduit" → "Sho'ma Conduit"
  8. Renombrar iconos en `conduit/src-tauri/icons/` si sus nombres contienen "mimic" (mantener formatos .ico, .png)

  **Must NOT do**:
  - No modificar funcionalidad de Tauri
  - No cambiar versiones de dependencias de Tauri

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: config edits y string replacements
  - Skills: [] — Reason: JSON + HTML edits

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: 10-18 | Blocked By: 1, 2

  **References**:
  - File: `conduit/src-tauri/tauri.conf.json` — Tauri config
  - File: `conduit/src-tauri/Cargo.toml` — Rust package config
  - File: `conduit/index.html` — page title
  - File: `conduit/about.html` — about page title
  - File: `conduit/src/i18n/en.json` — English strings
  - File: `conduit/src/i18n/es.json` — Spanish strings

  **Acceptance Criteria**:
  - [ ] `tauri.conf.json` tiene productName "Sho'ma Conduit" e identifier "com.shoma.conduit"
  - [ ] `index.html` y `about.html` tienen titles correctos
  - [ ] i18n strings actualizadas

  **QA Scenarios**:
  ```
  Scenario: Tauri config updated
    Tool: Bash
    Steps: cat conduit/src-tauri/tauri.conf.json | grep -E 'productName|identifier'
    Expected: Shows "Sho'ma Conduit" and "com.shoma.conduit"
    Evidence: .sisyphus/evidence/shoma-rebrand/task-6-tauri.txt
  ```

  **Commit**: YES | Message: `rebrand: update Tauri config and desktop branding` | Files: `conduit/src-tauri/tauri.conf.json`, `conduit/index.html`, `conduit/about.html`, `conduit/src/i18n/en.json`, `conduit/src/i18n/es.json`

- [x] 7. Actualizar Web Branding (HTML, Manifest, Favicon)

  **What to do**:
  1. Editar `loom/index.html`:
     - `<title>` → "Sho'ma Loom"
     - Meta tags: `application-name`, `apple-mobile-web-app-title` → "Sho'ma Loom"
  2. Editar `loom/public/manifest.webmanifest`:
     - `name`: "Mimic" → "Sho'ma Loom"
     - `short_name`: "Mimic" → "Sho'ma"
     - `description`: actualizar
  3. Actualizar `loom/public/favicon.svg`: actualizar contenido SVG para reflejar marca Sho'ma (o al menos quitar referencias a "Mimic")
  4. Actualizar `loom/public/icon-192.svg` e `icon-512.svg` igualmente
  5. Editar `loom/src/routes/index/route.tsx`: "MIMIC" → "SHO'MA" en UI text
  6. Editar `loom/src/routes/connected/route.tsx`: "MIMIC" → "SHO'MA" en UI text
  7. Editar `loom/src/core/rift/lcu-mock-dev.ts`: texto de error "Mimic" → "Sho'ma"

  **Must NOT do**:
  - No rediseñar el favicon visualmente (va en plan separado de rebrand visual)
  - Solo actualizar texto/metadatos en assets existentes

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: text edits y config updates
  - Skills: [] — Reason: HTML + JSON + SVG text edits

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: 10-18 | Blocked By: 1, 2

  **References**:
  - File: `loom/index.html` — app metadata
  - File: `loom/public/manifest.webmanifest` — PWA manifest
  - File: `loom/public/favicon.svg` — favicon
  - File: `loom/src/routes/index/route.tsx` — landing page text
  - File: `loom/src/routes/connected/route.tsx` — header text

  **Acceptance Criteria**:
  - [ ] `index.html` title es "Sho'ma Loom"
  - [ ] `manifest.webmanifest` name es "Sho'ma Loom", short_name "Sho'ma"
  - [ ] No hay "MIMIC" ni "Mimic" en UI text de loom (excluyendo comentarios)

  **QA Scenarios**:
  ```
  Scenario: Web branding updated
    Tool: Bash
    Steps: grep -r 'MIMIC\|Mimic' loom/src/routes/ loom/index.html loom/public/manifest.webmanifest
    Expected: Empty output
    Evidence: .sisyphus/evidence/shoma-rebrand/task-7-web-brand.txt
  ```

  **Commit**: YES | Message: `rebrand: update web app branding (titles, manifest, UI text)` | Files: `loom/index.html`, `loom/public/manifest.webmanifest`, `loom/public/favicon.svg`, `loom/src/routes/index/route.tsx`, `loom/src/routes/connected/route.tsx`

- [x] 8. Actualizar README, AGENTS.md, CODEBASE_SUMMARY.md y Docs

  **What to do**:
  1. Editar `README.md`:
     - Título: "Mimic" → "Sho'ma"
     - Descripción: "Mimic is..." → "Sho'ma is..."
     - Componentes: "web" → "Loom", "rift" → "Leyline", "conduit" → "Conduit"
     - Links a carpetas: `/web` → `/loom`, `/rift` → `/leyline`
     - GitHub repo URL si se renombra
     - Logo reference si cambia
  2. Editar `AGENTS.md`:
     - Nombres de componentes y carpetas
     - Referencias a `@mimic/*`
     - Estructura del repo actualizada
  3. Editar `CODEBASE_SUMMARY.md`:
     - Referencias de marca
     - URLs runtime si aplica (dominios nuevos)
     - Estructura de carpetas
  4. Editar `docs/migration/fast-track-readiness.md`:
     - `@mimic/*` → `@shoma/*`
     - `RIFT_JWT_SECRET` → `LEYLINE_JWT_SECRET`
  5. Editar otros docs que referencien nombres antiguos (buscar en `docs/`)
  6. Actualizar `assets/mimic-logo.png` → renombrar a `assets/shoma-logo.png` (o reemplazar con placeholder)

  **Must NOT do**:
  - No modificar `.sisyphus/plans/` con "mimic" en nombre
  - No cambiar contenido técnico de docs, solo nombres

  **Recommended Agent Profile**:
  - Category: `writing` — Reason: documentation updates
  - Skills: [] — Reason: markdown editing

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: 10-18 | Blocked By: 1, 2

  **References**:
  - File: `README.md` — root documentation
  - File: `AGENTS.md` — project knowledge base
  - File: `CODEBASE_SUMMARY.md` — architecture reference
  - Dir: `docs/` — migration and technical docs

  **Acceptance Criteria**:
  - [ ] README.md no tiene "Mimic" como nombre de producto (excepto en contexto histórico)
  - [ ] AGENTS.md estructura actualizada
  - [ ] CODEBASE_SUMMARY.md referencias actualizadas

  **QA Scenarios**:
  ```
  Scenario: Docs updated
    Tool: Bash
    Steps: grep -r 'Mimic' README.md AGENTS.md CODEBASE_SUMMARY.md docs/ --include="*.md" | grep -v 'legacy' | grep -v 'historical'
    Expected: Empty output o solo en contexto histórico
    Evidence: .sisyphus/evidence/shoma-rebrand/task-8-docs.txt
  ```

  **Commit**: YES | Message: `rebrand: update README, AGENTS.md, CODEBASE_SUMMARY.md and docs` | Files: `README.md`, `AGENTS.md`, `CODEBASE_SUMMARY.md`, `docs/**/*.md`

- [x] 9. Actualizar CI/CD Workflows

  **What to do**:
  1. Editar `.github/workflows/conduit-mac.yml`:
     - Actualizar paths si referencian `apps/conduit-next` o carpetas antiguas
     - Actualizar artifact names si contienen "mimic" o "conduit-next"
  2. Editar `.github/workflows/conduit-windows.yml`:
     - Igual que arriba
  3. Si hay referencias a `mimic-scripts/` en workflows, actualizar a `shoma-scripts/`
  4. Buscar en `.github/` cualquier otra referencia a nombres antiguos

  **Must NOT do**:
  - No modificar lógica de build en workflows
  - No cambiar triggers o runners

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: YAML path/name updates
  - Skills: [] — Reason: GitHub Actions config

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: 10-18 | Blocked By: 1, 2

  **References**:
  - File: `.github/workflows/conduit-mac.yml`
  - File: `.github/workflows/conduit-windows.yml`

  **Acceptance Criteria**:
  - [ ] Workflows no referencian paths de carpetas antiguas
  - [ ] Artifact names actualizados

  **QA Scenarios**:
  ```
  Scenario: CI updated
    Tool: Bash
    Steps: grep -r 'mimic\|Mimic' .github/workflows/ || true
    Expected: Empty output
    Evidence: .sisyphus/evidence/shoma-rebrand/task-9-ci.txt
  ```

  **Commit**: YES | Message: `rebrand: update CI/CD workflow paths and artifact names` | Files: `.github/workflows/conduit-mac.yml`, `.github/workflows/conduit-windows.yml`

- [x] 10. Renombrar Scripts Folder y Actualizar Referencias

  **What to do**:
  1. Mover carpeta: `mv mimic-scripts shoma-scripts`
  2. Si los scripts internos referencian paths como `web/` o `rift/`, actualizar a `loom/` y `leyline/`
  3. Si los scripts tienen strings con "mimic" en mensajes o URLs, actualizar
  4. Buscar en root cualquier referencia a `mimic-scripts/` (package.json scripts, docs, etc.) y actualizar

  **Must NOT do**:
  - No modificar lógica de los scripts

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: folder rename + path updates
  - Skills: [] — Reason: filesystem operations

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: 11-18 | Blocked By: 1, 2

  **References**:
  - Dir: `mimic-scripts/` → `shoma-scripts/`
  - File: `package.json` — si referencia scripts folder

  **Acceptance Criteria**:
  - [ ] Carpeta `shoma-scripts/` existe
  - [ ] Carpeta `mimic-scripts/` ya no existe
  - [ ] Referencias en root actualizadas

  **QA Scenarios**:
  ```
  Scenario: Scripts folder renamed
    Tool: Bash
    Steps: test -d shoma-scripts && test ! -d mimic-scripts
    Expected: shoma-scripts exists, mimic-scripts does not
    Evidence: .sisyphus/evidence/shoma-rebrand/task-10-scripts.txt
  ```

  **Commit**: YES | Message: `rebrand: rename mimic-scripts to shoma-scripts` | Files: `mimic-scripts/` → `shoma-scripts/`, `package.json` si aplica

- [ ] 11. Regenerar Lockfiles

  **What to do**:
  1. Ejecutar `bun install` para regenerar `bun.lock` y `bun.lockb`
  2. Verificar que lockfiles contienen referencias a `@shoma/*` y no `@mimic/*`
  3. Si hay problemas, resolver dependencias (posiblemente borrar `node_modules` y reinstalar)

  **Must NOT do**:
  - NO editar lockfiles manualmente
  - No commitear si hay inconsistencias

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: single command
  - Skills: [] — Reason: bun install

  **Parallelization**: Can Parallel: NO | Wave 5 | Blocks: 12-16 | Blocked By: 1-10

  **References**:
  - Files: `bun.lock`, `bun.lockb`

  **Acceptance Criteria**:
  - [ ] `bun install` completa sin errores
  - [ ] `bun.lock` contiene `@shoma/*` workspace refs
  - [ ] `bun.lock` no contiene `@mimic/*` workspace refs

  **QA Scenarios**:
  ```
  Scenario: Lockfile regenerated
    Tool: Bash
    Steps: bun install && grep '@shoma/' bun.lock | head -5 && grep '@mimic/' bun.lock || true
    Expected: @shoma/ refs present, @mimic/ refs absent
    Evidence: .sisyphus/evidence/shoma-rebrand/task-11-lockfile.txt
  ```

  **Commit**: YES | Message: `rebrand: regenerate lockfiles` | Files: `bun.lock`, `bun.lockb`

- [ ] 12. Verificar Builds Pasan

  **What to do**:
  1. `bun run build` desde root
  2. Si falla, diagnosticar y fix (probablemente por paths de carpetas renombradas en configs)
  3. Verificar builds individuales si es necesario

  **Must NOT do**:
  - No ignorar errores de build

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: build troubleshooting
  - Skills: [] — Reason: build system debugging

  **Parallelization**: Can Parallel: NO | Wave 5 | Blocks: 13-16 | Blocked By: 11

  **References**:
  - File: `package.json` — build scripts

  **Acceptance Criteria**:
  - [ ] `bun run build` exit 0

  **QA Scenarios**:
  ```
  Scenario: Build passes
    Tool: Bash
    Steps: bun run build
    Expected: Exit code 0
    Evidence: .sisyphus/evidence/shoma-rebrand/task-12-build.txt
  ```

  **Commit**: NO (parte de wave 5)

- [ ] 13. Verificar Tests Pasan

  **What to do**:
  1. `bun run test` desde root
  2. Si fallan tests por paths renombrados o storage keys, fix

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: test troubleshooting
  - Skills: [] — Reason: test debugging

  **Parallelization**: Can Parallel: NO | Wave 5 | Blocks: 14-16 | Blocked By: 12

  **Acceptance Criteria**:
  - [ ] `bun run test` exit 0

  **QA Scenarios**:
  ```
  Scenario: Tests pass
    Tool: Bash
    Steps: bun run test
    Expected: Exit code 0
    Evidence: .sisyphus/evidence/shoma-rebrand/task-13-tests.txt
  ```

  **Commit**: NO

- [ ] 14. Verificar Lint/Format Pasan

  **What to do**:
  1. `bun run lint`
  2. `bun run fmt:check`
  3. Fix cualquier violation

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: lint troubleshooting
  - Skills: [] — Reason: lint fixing

  **Parallelization**: Can Parallel: NO | Wave 5 | Blocks: 15-16 | Blocked By: 13

  **Acceptance Criteria**:
  - [ ] `bun run lint` exit 0
  - [ ] `bun run fmt:check` exit 0

  **QA Scenarios**:
  ```
  Scenario: Lint passes
    Tool: Bash
    Steps: bun run lint && bun run fmt:check
    Expected: Both exit 0
    Evidence: .sisyphus/evidence/shoma-rebrand/task-14-lint.txt
  ```

  **Commit**: NO

- [ ] 15. Verificar React Doctor Pasa

  **What to do**:
  1. `bun run doctor:react:check`
  2. Verificar que score sigue >= threshold

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: React diagnostics
  - Skills: [] — Reason: command execution

  **Parallelization**: Can Parallel: NO | Wave 5 | Blocks: 16 | Blocked By: 14

  **Acceptance Criteria**:
  - [ ] `bun run doctor:react:check` exit 0
  - [ ] Score >= configured threshold

  **QA Scenarios**:
  ```
  Scenario: React doctor passes
    Tool: Bash
    Steps: bun run doctor:react:check
    Expected: Exit 0
    Evidence: .sisyphus/evidence/shoma-rebrand/task-15-doctor.txt
  ```

  **Commit**: NO

- [ ] 16. Búsqueda Exhaustiva de Referencias Residuales

  **What to do**:
  1. Ejecutar búsqueda global de strings antiguos con exclusiones correctas:
     ```bash
     grep -rE 'mimic|Mimic|MIMIC|@mimic/|mimic-scripts|RIFT_JWT_SECRET|RIFT_DB_PATH|VITE_RIFT_|RIFT_HUB_|com\.mimic\.' \
       --include="*.{ts,tsx,js,jsx,json,md,yml,yaml,toml,rs,html,svg,vue,css,scss}" . \
       --exclude-dir=node_modules \
       --exclude-dir=.git \
       --exclude-dir=legacy \
       --exclude-dir=.sisyphus \
       --exclude-dir=dist \
       --exclude-dir=.turbo \
       --exclude-dir=.vite \
       --exclude=bun.lockb \
       --exclude-dir=web/src-old
     ```
  2. Documentar matches restantes (deberían ser 0 o solo en contexto histórico/documentado)
  3. Si quedan matches inesperados, crear tareas de fix

  **Must NOT do**:
  - No modificar archivos en exclusiones (legacy, .sisyphus/plans, etc.)

  **Recommended Agent Profile**:
  - Category: `oracle` — Reason: exhaustive search and judgment of remaining refs
  - Skills: [] — Reason: grep + analysis

  **Parallelization**: Can Parallel: NO | Wave 5 | Blocks: - | Blocked By: 15

  **Acceptance Criteria**:
  - [ ] 0 matches inesperados de brand names antiguos
  - [ ] Cualquier match restante está documentado y justificado

  **QA Scenarios**:
  ```
  Scenario: No residual brand references
    Tool: Bash
    Steps: grep -rE 'mimic|Mimic|MIMIC|@mimic/|mimic-scripts|RIFT_JWT_SECRET|RIFT_DB_PATH|VITE_RIFT_|RIFT_HUB_|com\.mimic\.' --include="*.{ts,tsx,js,jsx,json,md,yml,yaml,toml,rs,html,svg,vue,css,scss}" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=legacy --exclude-dir=.sisyphus --exclude-dir=dist --exclude-dir=.turbo --exclude-dir=.vite --exclude=bun.lockb --exclude-dir=web/src-old | tee /tmp/residual.txt
    Expected: /tmp/residual.txt is empty or only contains expected legacy references
    Evidence: .sisyphus/evidence/shoma-rebrand/task-16-residual.txt
  ```

  **Commit**: NO (parte de wave 5)

## Final Verification Wave (MANDATORY — after ALL implementation tasks)
> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.

- [ ] F1. Plan Compliance Audit — oracle
  - Verificar que todas las tareas del plan fueron completadas
  - Verificar que no se modificó `legacy/` ni `.sisyphus/plans/*mimic*`
  - Verificar que no se cambió lógica de negocio
  - Verificar que todos los package names son @shoma/*
  - Verificar que carpetas renombradas correctamente

- [ ] F2. Code Quality Review — unspecified-high
  - Verificar que no hay imports rotos
  - Verificar que builds pasan
  - Verificar que tests pasan
  - Verificar lint/format pasan

- [ ] F3. Real Manual QA — unspecified-high
  - Verificar que `bun install` funciona
  - Verificar que `bun run dev:loom`, `bun run dev:leyline`, `bun run dev:conduit` arrancan
  - Verificar que no hay errores de runtime por storage keys

- [ ] F4. Scope Fidelity Check — deep
  - Verificar que solo se renombró, no se rediseñó
  - Verificar que visual branding no cambió (colores, tipografía, layout)
  - Confirmar que rebrand visual va en plan separado

## Commit Strategy
- Wave 1 (tasks 1-2): 2 commits separados para package names y folder rename
- Wave 2 (tasks 3-5): 3 commits separados para imports, env vars, y storage
- Wave 3 (tasks 6-8): 3 commits separados para Tauri, web branding, y docs
- Wave 4 (tasks 9-10): 2 commits separados para CI y scripts
- Wave 5 (tasks 11-16): NO commits durante verificación, solo al final si todo pasa
- Final: 1 commit consolidado con `git merge --squash` de feature branch, o mantener historia granular

## Success Criteria
- [ ] Todos los packages renombrados a @shoma/*
- [ ] Carpetas renombradas (web→loom, rift→leyline)
- [ ] Todos los imports actualizados
- [ ] Env vars renombradas
- [ ] Storage keys migradas con función automática
- [ ] Tauri identifier actualizado
- [ ] Web branding (titles, manifest, UI text) actualizado
- [ ] README y docs actualizados
- [ ] CI/CD actualizado
- [ ] Scripts folder renombrado
- [ ] Lockfiles regenerados
- [ ] Build, test, lint, React doctor pasan
- [ ] 0 referencias residuales inesperadas
- [ ] legacy/ y .sisyphus/plans/ históricos NO modificados
