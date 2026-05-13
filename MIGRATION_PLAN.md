# Sho'ma Migration Master Plan

Order of migration (recommended):

1. Leyline (formerly Rift) -> Bun + Elysia
2. Loom (formerly Web) -> React/Solid + Tailwind (TypeScript kept)
3. Conduit -> Electron/Electrobun app (TypeScript core)

This plan is split per app and designed for incremental cutovers with rollback points.

---

## 0) Program-level guardrails (all apps)

## Goals

- Preserve behavior and protocol compatibility while modernizing stack.
- Avoid big-bang release across all components.
- Keep production rollback possible at every migration stage.

## Non-goals

- Redesigning product behavior during migration (do parity first, enhancements later).
- Simultaneously changing protocol + architecture + UI paradigms in one step.

## Compatibility contract (must hold through migration)

- Leyline opcodes and message semantics remain stable until all clients are migrated.
- Loom <-> Conduit handshake remains compatible during transition.
- Existing 6-digit code + JWT registration/check flow remains semantically unchanged.

## Release strategy

- Feature flags per component.
- Canary/staged rollouts.
- Side-by-side old/new service option for each component.

---

## 1) Leyline migration plan (Node/Express -> Bun + Elysia)

Risk: LOW-MEDIUM

## Scope

- Replace HTTP API and WS upgrade handling in Bun/Elysia.
- Preserve current endpoint behavior and opcodes.
- Keep DB schema compatible (or use additive migrations only).

## Target architecture

- `leyline/` Bun runtime.
- Elysia app for `/`, `/register`, `/check`.
- WS handlers for `/conduit` and `/mobile` with same routing semantics.
- SQLite adapter preserving current table and query behavior.

## Phases

1. Protocol lock and tests
   - Freeze current protocol docs (opcodes, expected payloads, error semantics).
   - Add contract tests for register/check and socket flows.
2. Build parity service
   - Implement endpoints and JWT verification/signing parity.
   - Implement connection maps and peer lifecycle parity.
3. Shadow verification
   - Run new Leyline in pre-prod with replay/synthetic load.
   - Compare behavior with old Leyline using contract suite.
4. Canary cutover
   - Route small traffic share to new Leyline.
   - Monitor disconnect rates, latency, auth failures.
5. Full cutover + old service standby
   - Keep old service hot for fast rollback during stabilization window.

## Exit criteria

- 100% contract tests pass.
- No regression in successful CONNECT and REPLY message flow.
- Error and disconnect rates are at or below baseline.

## Leyline-next status update (2026-02-19)

Completed

- Bun + Elysia parity service implemented in `leyline` for `/`, `/register`, `/check`, `/conduit`, and `/mobile`.
- SQLite adapter parity implemented (same `conduit_instances` semantics; SQLite retained by decision).
- Legacy-compatible conduit auth extraction implemented (query + header + URL fallbacks).
- Websocket parity implemented:
  - conduit/mobile relay (`OPEN`, `MSG`, `REPLY`, `RECEIVE`, `CLOSE`)
  - duplicate conduit eviction for same code
  - stale/invalid auth rejection
  - mobile disconnect and conduit disconnect cleanup semantics
- Keepalive + runtime lifecycle parity implemented (`startRuntime`, idempotent `stop`, websocket shutdown).
- Structured logging implemented with pino backend, log-level filtering, and test silencing controls.
- Source tree reorganized into `src/core/*` and tests reorganized into `tests/{unit,integration,helpers}`.
- Validation green:
  - `bun test` passing
  - `bun run --filter @shoma/leyline build` passing

Remaining before calling Leyline migration fully complete

- Execute real-client smoke validation against `leyline` (loom + conduit handshake and relay on live runtime).
- Capture and resolve any parity deltas found in real-client run.

## Rollback

- DNS/LB switch back to old Leyline.
- No data migration dependency that blocks rollback.

---

## 2) Loom migration plan (Vue 2 -> React or Solid + Tailwind)

Risk: MEDIUM-HIGH

## Scope

- Rebuild UI layer in TS with React or Solid.
- Preserve transport/protocol behavior first.
- Replace Stylus styles with Tailwind + minimal design tokens.

## Target architecture

- `loom/` with Vite + TypeScript.
- Domain/service layer separated from rendering framework:
  - socket transport client
  - observer/request API client
  - typed models for lobby/queue/champ-select
- UI composition with route-free shell (matching current app shape), then optional routing cleanup.

## Phases

1. Foundation
   - Choose React or Solid.
   - Port `LeylineSocket` + root protocol orchestration into framework-agnostic TS module.
   - Snapshot key UI/flows for parity checks.
2. Vertical slices (feature-by-feature)
   - Connection states + code entry
   - Lobby + queue
   - Ready check + invites
   - Champ select (largest slice)
3. Styling migration
   - Introduce Tailwind config and tokens.
   - Recreate critical states/animations and responsive behavior.
4. Parallel beta
   - Host loom behind separate URL/path.
   - Internal/beta users validate feature parity on real matches.
5. Cutover
   - Switch default loom app to loom.
   - Keep old loom app available for emergency rollback for a fixed window.

## Exit criteria

- End-to-end parity on all game-flow screens.
- No handshake/connect regression.
- Mobile performance (TTI, interaction responsiveness) equal or better.

## Rollback

- Toggle deployment back to old Vue app.
- No protocol changes required for rollback.

---

## 3) Conduit migration plan (C# WPF -> Electron/Electrobun)

Risk: HIGH

## Scope

- Replace C# tray app and bridge runtime with Electron/Electrobun desktop app.
- Preserve system tray UX, approval prompts, League detection, JWT registration, and encrypted messaging behavior.

## Target architecture

- `conduit/`
  - Main process: tray icon, notifications, startup integration, prompt windows.
  - Core bridge service (TS): League detection + LCU IO + Leyline socket + protocol handling.
  - Secure persistence layer for token/keys/devices.
- Native integrations via OS APIs/modules:
  - startup at login
  - process inspection/WMI equivalent
  - admin elevation path

## Phases

1. Core protocol daemon (headless)
   - Implement crypto, handshake, Leyline tunnel handling, request/observe pipeline.
   - Validate with existing leyline and loom components.
2. League integration parity
   - Implement robust League process detection and LCU auth extraction.
   - Reconnect behavior parity with stress tests (client restarts/crashes).
3. Desktop shell parity
   - Tray menu, code display, notification, settings/about window, allow/deny prompt.
   - Startup toggle and uninstall behavior.
4. Installer/signing/update pipeline
   - Build signed installers and auto-update strategy.
5. Controlled rollout
   - Internal alpha -> limited beta -> broader rollout.
   - Keep C# conduit available in parallel during adoption.

## Exit criteria

- End-to-end parity in real sessions over sustained test period.
- Stable reconnect and low crash rate.
- No regression in security handshake and device approval behavior.

## Rollback

- Keep C# conduit installer and update channel active.
- Allow users to switch back quickly if issues occur.

---

## 4) Testing strategy (all migrations)

## Test pyramid

- Unit tests: protocol codecs, crypto helpers, state transitions.
- Integration tests: mock + real websocket/session tests.
- E2E tests: full phone->leyline->conduit->LCU scenarios.

## Contract suite (critical)

- Build a reusable protocol contract test package used by all migrated apps.
- Include:
  - JWT register/check semantics
  - Leyline opcode routing behavior
  - Mobile opcode handshake/request/subscribe/update behavior
  - disconnect and reconnect edge cases

## Observability baseline

- Metrics: handshake success rate, connect latency, websocket close codes, reconnect attempts.
- Logs: correlation IDs per mobile peer UUID and per desktop code.

---

## 5) Suggested timeline (initial estimate)

- Leyline: 2-4 weeks (parity + canary + cutover)
- Loom: 6-10 weeks (depends heavily on champ select parity)
- Conduit: 8-14+ weeks (native integration + packaging/signing complexity)

Total program: ~4-7 months, depending on team size and parallelization.

---

## 6) Team/workstream split

- Workstream A (Backend): Leyline-next + protocol contract suite
- Workstream B (Frontend): Loom-next + Tailwind design system
- Workstream C (Desktop): Conduit-next shell + native integrations
- Workstream D (Quality): E2E harness, telemetry, rollout safety

---

## 7) Open decisions and questions (blocking final execution plan)

Answering these will let us turn this into sprint-level tickets.

## Product / rollout

1. Are you okay with running old and new components in parallel for a while (recommended)?
2. What is your acceptable downtime target during each cutover?
3. Do you want a private alpha channel before public rollout?

## Leyline-next

4. Should Leyline remain SQLite-based initially, or migrate DB now?
5. Any expected peak concurrent connections we should size for?
6. Do you need multi-region deployment now, or single region first?

## Loom-next

7. Do you prefer React or Solid? (If undecided, React is the safer default.)
8. Keep current visual style first, or redesign while migrating?
9. Which mobile browsers/OS versions must be officially supported?
10. Do you want PWA/offline behavior unchanged at first?

## Conduit-next

11. Do you want Electron or Electrobun specifically? (Electron currently has broader ecosystem maturity.)
12. Is Windows-only still acceptable, or do you want cross-platform ambition?
13. How strict are you about memory footprint compared to current C# app?
14. Do you already have code signing certificates and installer/update infra?
15. Is admin-elevation flow mandatory from day 1, or acceptable as phase-2 hardening?

## Security / compliance

16. Should we preserve current crypto protocol exactly for compatibility, then improve later?
17. Any compliance requirements for storing tokens/keys/device approvals on disk?
18. Do you want a formal threat model pass before Conduit cutover?

## Engineering process

19. Preferred package manager/workspace setup for new monorepo layout?
20. CI/CD platform and constraints (GitHub Actions, self-hosted, etc.)?
21. Preferred test tools (Playwright/Vitest/Jest/others)?
22. Team size and who can own each workstream?

---

## 7A) Decisions captured (from user input, 2026-02-18)

- Rollout strategy: **no public rollout required** (non-released fork).
- Cutover downtime target: **not a major constraint** (same reason as above).
- Private alpha: **not required** (same reason as above).
- Leyline DB: **keep SQLite**.
- Scale target: **modest/low expected concurrency**.
- Loom framework: **React**.
- Loom UX strategy: **preserve current design first (parity before redesign)**.
- Browser support target: **latest Vite-supported browsers**.
- Conduit runtime preference: **Electrobun** (with maturity check).
- Desktop target OS: **cross-platform, at least Windows + macOS**.
- Signing/update infra currently available: **no**.
- Crypto/protocol freeze preference: **not strict** (user open to changes).

## 7B) Electrobun maturity check (initial)

Initial signal is promising but still less battle-tested than Electron for production desktop distribution:

- Active public repo and documentation
- Meaningful community traction (stars/contributors)
- Clear cross-platform desktop positioning

Planning implication:

1. Proceed with **Electrobun-first prototype** for Conduit-next.
2. Define an explicit **fallback path to Electron** if blockers arise in:
   - native integration parity (tray/startup/elevation/process APIs)
   - packaging/signing/update workflows
   - Windows+macOS stability under long-running websocket sessions

## 7C) Decisions captured (finalized from user input)

1. Leyline deployment topology: **single region/local is fine for this fork**.
2. Loom PWA behavior: **keep existing service worker/offline behavior in v1**.
3. Conduit memory budget: **no strict budget target set now**.
4. Admin elevation: **if needed for parity, include in phase 1**.
5. Local secret storage: **no additional constraints beyond current behavior**.
6. Threat modeling: **yes, perform lightweight review before Conduit cutover**.
7. Workspace/tooling: **Bun workspaces**.
8. CI environment: **local/manual for now**.
9. Test stack: **Playwright + Vitest approved**.
10. Team capacity: **solo (single contributor)**.

---

## 8) Sprint-by-sprint execution plan (solo, local-first)

Sprint length assumption: 1 week. Adjust if needed.

### Sprint 0 - Program setup and guardrails

- Create Bun workspace layout and package boundaries.
- Establish shared protocol-contract package (types, opcodes, fixtures).
- Define local test environments and smoke scripts.

Deliverables

- Monorepo skeleton
- Contract test harness scaffold
- Baseline docs (runbook + architecture notes)

### Sprint 1 - Leyline-next parity foundation

- Implement Bun + Elysia HTTP parity (`/`, `/register`, `/check`).
- Implement SQLite adapter with current schema compatibility.
- Add JWT and DB contract tests.

Deliverables

- `leyline` minimal parity service
- Passing contract tests for HTTP flows

### Sprint 2 - Leyline-next websocket parity + cutover

- Implement `/conduit` and `/mobile` websocket flows.
- Implement peer lifecycle maps and disconnect semantics.
- Run local synthetic load + contract suite.
- Switch local environment to Leyline-next as default.

Deliverables

- Leyline-next full local parity
- Cutover checklist + rollback command

### Sprint 3 - Loom-next foundation (React + Tailwind)

- Bootstrap Vite + React + TS app.
- Port `LeylineSocket` and root transport orchestration into framework-agnostic module.
- Add connection flow UI parity (code entry + connection states).

Deliverables

- `loom` foundation
- Connection flow parity passing smoke tests

### Sprint 4 - Loom-next feature parity I

- Port lobby + queue modules.
- Port ready-check + invites.
- Preserve existing UX and interaction semantics.

Deliverables

- Feature parity for non-champ-select gameplay flows
- Playwright e2e flows for these screens

### Sprint 5 - Loom-next feature parity II (champ select)

- Port champ-select module and child overlays.
- Validate runes/skins/summoner interactions and subscriptions.
- Final parity pass and local switch to loom.

Deliverables

- Full loom parity
- Browser verification on latest Vite-supported targets

### Sprint 6 - Conduit-next core daemon (Electrobun-first)

- Implement protocol core: handshake, encryption, leyline messaging, request/observe pipeline.
- Validate with existing loom and leyline components.
- Add Vitest integration tests around protocol flows.

Deliverables

- `conduit` headless core bridge
- Compatibility report vs legacy conduit behavior

### Sprint 7 - Conduit-next desktop shell + OS integrations

- Add tray menu, notifications, code display, settings window.
- Implement startup behavior and local persistence.
- Implement admin-elevation path in phase 1 (required for parity cases).
- Add Windows + macOS packaging prototype.

Deliverables

- Desktop shell parity MVP
- OS integration checklist (Windows/macOS)

### Sprint 8 - Conduit-next hardening and security review

- Perform lightweight threat model review.
- Stress reconnect/disconnect behavior and long-lived websocket sessions.
- Decide Electrobun go/no-go; fall back to Electron if blockers remain.
- Finalize local migration documentation.

Deliverables

- Security review notes + mitigations
- Stability report + runtime decision memo (Electrobun vs Electron fallback)

---

## 9) Dependency graph

1. Program setup (Sprint 0)
   -> required by all subsequent sprints.
2. Leyline-next parity (Sprints 1-2)
   -> unblocks stable integration target for loom and conduit.
3. Loom-next parity (Sprints 3-5)
   -> can begin once Leyline-next contract tests are stable.
4. Conduit-next core/shell (Sprints 6-7)
   -> depends on stable protocol contract and Leyline-next behavior.
5. Security + hardening (Sprint 8)
   -> final gate before declaring migration complete.

Critical path (solo):
Sprint 0 -> Sprints 1-2 -> Sprints 3-5 -> Sprints 6-8

---

## 10) Initial backlog with acceptance criteria

## Leyline-next (Bun + Elysia)

LEYLINE-1: HTTP parity endpoints

- Acceptance
  - `/register` and `/check` pass contract fixtures for valid/invalid requests.
  - JWT payload compatibility matches legacy behavior.

LEYLINE-2: SQLite compatibility

- Acceptance
  - Existing `conduit_instances` table works without destructive migration.
  - Local data can be read by both legacy and next implementation.

LEYLINE-3: WS broker parity

- Acceptance
  - Mobile CONNECT -> pubkey lookup -> OPEN/MSG/CLOSE flows match expected opcodes.
  - Disconnect handling removes stale maps and closes dependent peers.

LEYLINE-4: Regression suite and local cutover

- Acceptance
  - Contract suite green in local CI command.
  - Documented rollback path to legacy leyline.

## Loom-next (React + Tailwind)

LOOM-1: Transport layer extraction and parity

- Acceptance
  - Framework-agnostic transport module passes unit tests.
  - Handshake + encrypted send/receive behavior matches legacy test vectors.

LOOM-2: Connection flow parity

- Acceptance
  - Code entry, connect, denied/offline states match legacy behavior.
  - Manual smoke run verifies reconnection and persisted code behavior.

LOOM-3: Lobby/queue/ready-check/invites parity

- Acceptance
  - Playwright scenarios pass for each flow.
  - API request/observe messages match expected payload shapes.

LOOM-4: Champ-select parity

- Acceptance
  - Core champ-select interactions work end-to-end.
  - No critical regression vs legacy for pick/ban/runes/skins.

LOOM-5: Final parity and browser verification

- Acceptance
  - Verified on latest Vite-supported browser matrix.
  - PWA/service-worker behavior unchanged in v1.

## Conduit-next (Electrobun-first)

CONDUIT-1: Headless protocol daemon parity

- Acceptance
  - Can connect to Leyline-next and process mobile handshake + encrypted messaging.
  - LCU request/observe proxy works in local integration tests.

CONDUIT-2: League detection and reconnect parity

- Acceptance
  - Correctly detects League process and extracts auth token/port.
  - Reconnect behavior survives League restarts and socket interruptions.

CONDUIT-3: Desktop shell parity

- Acceptance
  - Tray UI, notification, code display, and approval prompts are functional.
  - Startup-at-login behavior functional on Windows + macOS.

CONDUIT-4: Admin elevation phase-1 support

- Acceptance
  - Privileged League scenario handled without breaking core flow.
  - Elevation path documented and tested on Windows.

CONDUIT-5: Security review and hardening

- Acceptance
  - Lightweight threat review document completed.
  - High-severity findings addressed or explicitly accepted with rationale.

CONDUIT-6: Runtime decision checkpoint

- Acceptance
  - Electrobun stability criteria evaluated.
  - If unmet, fallback migration path to Electron is activated with tracked tasks.

---

## 11) Risk register (initial)

- R1: Electrobun runtime gaps for required desktop/native integrations.
  - Mitigation: explicit fallback-to-Electron gate in Sprint 8.
- R2: Solo capacity bottleneck slows sequential migration.
  - Mitigation: strict scope control (parity-first) and defer redesign.
- R3: Protocol regressions across components.
  - Mitigation: shared contract suite from Sprint 0 and mandatory green gate.
- R4: Cross-platform differences (Windows/macOS) in process/system integration.
  - Mitigation: OS-specific test checklist and early prototype coverage.
- R5: Admin/elevation edge cases break League detection flow.
  - Mitigation: include elevation support in phase 1 and validate early on Windows.

---

## 12) Immediate next step

Run real-client smoke validation against `leyline` (loom + conduit flows), then lock Leyline as complete and begin Loom-next foundation work.
