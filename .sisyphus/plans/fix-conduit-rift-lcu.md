# Refactor LCU Integration: Irelia in conduit-next + hasagi-types in protocol-contract

## TL;DR

> **Summary**: Replace hand-rolled Rust LCU client in `apps/conduit-next` with the Irelia crate, and add `@hasagi/types` to `packages/protocol-contract` for typed LCU API contracts. The encrypted mobile tunnel protocol and `rift-next` relay remain untouched.
> **Deliverables**: Irelia-backed LCU HTTP + WebSocket in conduit-next; typed protocol-contract exports; web-next consuming typed responses.
> **Effort**: Medium
> **Parallel**: YES - 5 waves
> **Critical Path**: Wave 1 regression tests → Wave 2 Irelia HTTP adapter → Wave 3 Irelia WS adapter → Wave 5 hasagi-types → Wave 7 verification

## Context

### Original Request

"Hay que corregir conduit y rift y cómo interactuan con el LCU y su api, la idea es que funcione bien: https://github.com/AlsoSylv/Irelia y https://github.com/dysolix/hasagi-types"

### Interview Summary

- **Intent**: Refactor/estandarización (no specific bugs). Replace custom LCU implementation with mature libraries.
- **Scope IN**: `apps/conduit-next` (Rust backend), `packages/protocol-contract` (shared types), `apps/web-next` (type consumers)
- **Scope OUT**: `apps/rift-next` (remains pure relay), encrypted tunnel protocol behavior, opcodes, encryption
- **hasagi-types placement**: `packages/protocol-contract` so all TS consumers can use them

### Metis Review (gaps addressed)

- **Risk**: Irelia defaults to MsgPack; current tunnel uses JSON. **Decision**: Normalize to JSON before tunnel serialization.
- **Risk**: Protocol drift if Irelia response shapes differ. **Guardrail**: Preserve exact `MobileOpcode.REQUEST/SUBSCRIBE/UPDATE` envelopes.
- **Risk**: Reconnect/subscription lifecycle regression. **Guardrail**: Add regression tests before refactor; match current behavior exactly.
- **Risk**: Scope creep into rift-next or tunnel redesign. **Guardrail**: Explicit no-touch for rift-next runtime.
- **Risk**: hasagi-types is compile-time only; no runtime validation. **Guardrail**: Do not add runtime schema validation unless explicitly requested.

## Work Objectives

### Core Objective

Replace the hand-rolled LCU HTTP/WebSocket/lockfile implementation in `conduit-next` with Irelia, and expose `@hasagi/types` through `protocol-contract`, while preserving every observable behavior of the mobile tunnel.

### Deliverables

1. Irelia crate integrated into `apps/conduit-next/src-tauri/Cargo.toml`
2. Irelia-based LCU HTTP adapter implementing `MobileHttpClient` trait
3. Irelia-based LCU WebSocket event adapter compatible with current `LcuEvent` shape
4. Lockfile lifecycle handled by Irelia auto-discovery or wrapped to match current behavior
5. `@hasagi/types` installed in `packages/protocol-contract`
6. Typed exports from `protocol-contract` for LCU endpoints, methods, responses, and WebSocket events
7. `apps/web-next` updated to consume typed LCU responses from `protocol-contract`

### Definition of Done (verifiable conditions with commands)

- `cd apps/conduit-next/src-tauri && cargo test` passes
- `cd apps/rift-next && bun test` passes
- `cd apps/web-next && bun test` passes
- `cd packages/protocol-contract && bun test` passes (or `tsc --noEmit` if no tests)
- A mocked LCU REST request proxied through `MobileSession` returns the same JSON envelope as before.
- A mocked `OnJsonApiEvent` forwarded as `MobileOpcode.UPDATE` has the same shape as before.
- Missing lockfile / League-not-running emits the same Tauri events and connection states as before.

### Must Have

- Backward-compatible mobile tunnel protocol (opcode frames, encryption, error semantics)
- Existing Rust tests in conduit-next continue to pass (after updating mocks if needed)
- Existing Bun tests in web-next and rift-next pass without modification
- JSON responses through tunnel (not MsgPack)

### Must NOT Have (guardrails, AI slop patterns, scope boundaries)

- Do NOT modify `apps/rift-next` runtime behavior
- Do NOT redesign encrypted tunnel protocol or opcodes
- Do NOT add new LCU-facing product features
- Do NOT introduce runtime schema validation with hasagi-types
- Do NOT remove the `MobileSession` proxy abstraction; Irelia lives behind it
- Do NOT break `protocol-contract` public API for existing consumers

## Verification Strategy

- **Test decision**: Tests-after (behavior-preserving refactor). Add regression tests first, then refactor, then run all existing tests.
- **QA policy**: Every implementation task has agent-executed QA scenarios (happy + failure paths)
- **Evidence**: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy

### Parallel Execution Waves

> Target: 5-8 tasks per wave.

**Wave 1**: Foundation & Regression Tests (can run partially in parallel with Wave 2 setup)
**Wave 2**: Irelia HTTP Adapter
**Wave 3**: Irelia WebSocket Adapter
**Wave 4**: hasagi-types in protocol-contract (can parallel with Waves 2-3 if types are additive)
**Wave 5**: web-next Type Adoption
**Wave 6**: Integration Verification

### Dependency Matrix (full, all tasks)

| Task  | Blocks | Blocked By |
| ----- | ------ | ---------- |
| 1     | 2,3,4  | -          |
| 2     | 6,7    | 1          |
| 3     | 6,7    | 1          |
| 4     | 5      | 1          |
| 5     | 8,9,10 | 4          |
| 6     | 8      | 2,3        |
| 7     | 8      | 2,3        |
| 8     | 11,12  | 6,7        |
| 9     | 11     | 5          |
| 10    | 12     | 5          |
| 11    | 13     | 8,9        |
| 12    | 13     | 8,10       |
| 13    | -      | 11,12      |
| F1-F4 | -      | 13         |

### Agent Dispatch Summary (wave → task count → categories)

- Wave 1: 4 tasks → deep (Rust analysis), quick (dependency addition)
- Wave 2: 2 tasks → unspecified-high (Rust adapter)
- Wave 3: 2 tasks → unspecified-high (Rust adapter)
- Wave 4: 3 tasks → quick (TS types)
- Wave 5: 2 tasks → quick (TS adoption)
- Wave 6: 1 task → unspecified-high (integration verification)

## TODOs

- [x] 1. Map current LCU client usages in conduit-next

  **What to do**: Find every reference to `LcuHttpClient`, `LcuWebSocketClient`, `LockfileInfo`, `LockfileEvent`, and `lcu::` modules in `apps/conduit-next/src-tauri/src/`. Produce a reference map with file paths, line numbers, and usage context (request proxying, event subscription, lockfile lifecycle, connection state).

  **Must NOT do**: Do not modify any files.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: Requires careful Rust codebase analysis
  - Skills: [] - No special skills needed
  - Omitted: [] - None

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: [2,3,4] | Blocked By: []

  **References**:
  - Pattern: `apps/conduit-next/src-tauri/src/manager.rs:192-209` - `connect_for_lockfile` creates LcuHttpClient and LcuWebSocketClient
  - Pattern: `apps/conduit-next/src-tauri/src/manager.rs:259-317` - `peer_factory` clones http_client into MobileSession
  - Pattern: `apps/conduit-next/src-tauri/src/mobile/session.rs:352-371` - `MobileHttpClient` trait impl for `LcuHttpClient`
  - Pattern: `apps/conduit-next/src-tauri/src/lcu/lockfile.rs` - lockfile discovery and watch
  - API/Type: `apps/conduit-next/src-tauri/src/lcu/http.rs:LcuHttpClient` - manual reqwest client
  - API/Type: `apps/conduit-next/src-tauri/src/lcu/websocket.rs:LcuWebSocketClient` - manual tokio-tungstenite client
  - Test: `apps/conduit-next/src-tauri/src/mobile/session.rs:385-689` - MobileSession tests with MockHttpClient

  **Acceptance Criteria**:
  - [ ] A markdown list exists mapping every `lcu::` usage to its purpose (request proxy / event subscribe / lockfile watch / state change)
  - [ ] `lsp_find_references` or `grep` output captured for `LcuHttpClient`, `LcuWebSocketClient`, `LockfileInfo`

  **QA Scenarios**:

  ```
  Scenario: Reference map completeness
    Tool: Bash
    Steps: Run grep -rn 'LcuHttpClient\|LcuWebSocketClient\|LockfileInfo\|lcu::' apps/conduit-next/src-tauri/src/
    Expected: All matches are documented in the reference map with file:line context
    Evidence: .sisyphus/evidence/task-1-reference-map.md
  ```

  **Commit**: NO

- [x] 2. Add Irelia dependency to conduit-next Cargo.toml

  **What to do**: Add `irelia = { version = "0.9", features = ["ws"] }` to `[dependencies]` in `apps/conduit-next/src-tauri/Cargo.toml`. Ensure the version matches the latest compatible with the project's tokio/reqwest versions. Run `cargo check` to verify resolution.

  **Must NOT do**: Do not upgrade other dependencies unless required for compatibility.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: Single file dependency addition
  - Skills: []
  - Omitted: []

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: [6,7] | Blocked By: [1]

  **References**:
  - File: `apps/conduit-next/src-tauri/Cargo.toml`
  - External: https://crates.io/crates/irelia - version and features

  **Acceptance Criteria**:
  - [ ] `cargo check` in `apps/conduit-next/src-tauri` succeeds with Irelia added
  - [ ] `irelia` appears in `Cargo.lock` after resolution

  **QA Scenarios**:

  ```
  Scenario: Dependency resolution
    Tool: Bash
    Steps: cd apps/conduit-next/src-tauri && cargo check
    Expected: Command exits 0 with no unresolved import errors for irelia
    Evidence: .sisyphus/evidence/task-2-cargo-check.txt
  ```

  **Commit**: YES | Message: `deps(conduit-next): add irelia crate with ws feature` | Files: [apps/conduit-next/src-tauri/Cargo.toml, Cargo.lock]

- [x] 3. Add regression test for MobileSession request proxying

  **What to do**: Before refactoring, add a test in `mobile/session.rs` (or a new `mobile/session_regression.rs`) that exercises the full request proxy path: encrypted MobileOpcode.REQUEST → decrypt → HTTP client request → response → encrypted MobileOpcode.RESPONSE. Assert exact JSON shapes. This test must continue to pass after Irelia migration.

  **Must NOT do**: Do not test Irelia itself; test the MobileSession proxy contract.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: Needs to understand current test patterns
  - Skills: []
  - Omitted: []

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: [6,7] | Blocked By: [1]

  **References**:
  - Test pattern: `apps/conduit-next/src-tauri/src/mobile/session.rs:487-520` - `request_proxying_uses_http_client_and_sends_response`
  - Trait: `mobile/session.rs:38-45` - `MobileHttpClient` trait

  **Acceptance Criteria**:
  - [ ] New test exists that sends `[MobileOpcode::Request, id, path, method, body]` through encrypted frame
  - [ ] Test asserts response frame is `[MobileOpcode::Response, id, status, body_json]`
  - [ ] `cargo test` in conduit-next passes with new test

  **QA Scenarios**:

  ```
  Scenario: Regression test passes before refactor
    Tool: Bash
    Steps: cd apps/conduit-next/src-tauri && cargo test request_proxy_regression
    Expected: Test passes (1 test, 0 failures)
    Evidence: .sisyphus/evidence/task-3-regression-test.txt
  ```

  **Commit**: YES | Message: `test(conduit-next): add request proxy regression test` | Files: [apps/conduit-next/src-tauri/src/mobile/session.rs or new file]

- [x] 4. Add regression test for MobileSession event forwarding

  **What to do**: Add a test that exercises `handle_lcu_event` with Create/Update/Delete events and asserts the exact encrypted `MobileOpcode.UPDATE` frame shape. Test path filtering (observed vs unobserved) and status code mapping (200 for Create/Update, 404 for Delete).

  **Must NOT do**: Do not change event handling logic yet.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: Needs to match current behavior exactly
  - Skills: []
  - Omitted: []

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: [6,7] | Blocked By: [1]

  **References**:
  - Test pattern: `apps/conduit-next/src-tauri/src/mobile/session.rs:555-576` - `event_filtering_uses_observed_regex_and_status_mapping`
  - Handler: `apps/conduit-next/src-tauri/src/mobile/session.rs:137-157` - `handle_lcu_event`

  **Acceptance Criteria**:
  - [ ] Test sends LcuEvent { path, event_type, data } and asserts exact UPDATE frame
  - [ ] Test verifies unobserved paths are dropped
  - [ ] `cargo test` passes

  **QA Scenarios**:

  ```
  Scenario: Event forwarding regression test
    Tool: Bash
    Steps: cd apps/conduit-next/src-tauri && cargo test event_forward_regression
    Expected: Test passes (1 test, 0 failures)
    Evidence: .sisyphus/evidence/task-4-event-regression.txt
  ```

  **Commit**: YES | Message: `test(conduit-next): add event forwarding regression test` | Files: [apps/conduit-next/src-tauri/src/mobile/session.rs or new file]

- [x] 5. Install @hasagi/types in protocol-contract

  **What to do**: Add `@hasagi/types` as a dependency in `packages/protocol-contract/package.json`. Run `bun install` (or `npm install`) to update lockfile. Verify the package is resolvable by checking `node_modules/@hasagi/types/dist/index.d.ts` exists.

  **Must NOT do**: Do not change any source files yet.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: Dependency installation
  - Skills: []
  - Omitted: []

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: [8,9,10] | Blocked By: [1]

  **References**:
  - File: `packages/protocol-contract/package.json`
  - External: https://github.com/dysolix/hasagi-types - npm package name

  **Acceptance Criteria**:
  - [ ] `@hasagi/types` appears in `package.json` dependencies
  - [ ] `node_modules/@hasagi/types/dist/index.d.ts` exists after install
  - [ ] `tsc --noEmit` in protocol-contract still passes

  **QA Scenarios**:

  ```
  Scenario: Package installation
    Tool: Bash
    Steps: cd packages/protocol-contract && bun install && ls node_modules/@hasagi/types/dist/index.d.ts
    Expected: File exists and install exits 0
    Evidence: .sisyphus/evidence/task-5-hasagi-install.txt
  ```

  **Commit**: YES | Message: `deps(protocol-contract): add @hasagi/types` | Files: [packages/protocol-contract/package.json, bun.lockb or package-lock.json]

- [x] 6. Create Irelia-based HTTP adapter implementing MobileHttpClient

  **What to do**: Create a new module (e.g., `src/lcu/irelia_http.rs`) that wraps `irelia::rest::LcuClient` and implements the `MobileHttpClient` trait. The adapter must:
  1. Accept a path, method string, and optional JSON body
  2. Map method string to Irelia's HTTP method
  3. Execute the request via Irelia
  4. Convert the response to `MobileHttpResponse { status_code, body: Value }`
  5. **Critical**: Ensure the response body is JSON (`Value`), not MsgPack. Irelia defaults to MsgPack; configure or convert accordingly.

  **Must NOT do**: Do not change the `MobileHttpClient` trait signature. Do not introduce async trait if not needed.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: Rust integration with external crate, must preserve trait contract
  - Skills: []
  - Omitted: []

  **Parallelization**: Can Parallel: NO (depends on 2) | Wave 2 | Blocks: [8] | Blocked By: [1,2]

  **References**:
  - Trait: `apps/conduit-next/src-tauri/src/mobile/session.rs:38-45` - `MobileHttpClient`
  - Current impl: `apps/conduit-next/src-tauri/src/mobile/session.rs:352-371` - `impl MobileHttpClient for LcuHttpClient`
  - External: https://github.com/AlsoSylv/Irelia/blob/master/irelia/src/rest.rs - Irelia REST API
  - External: https://github.com/AlsoSylv/Irelia/blob/master/irelia/src/utils/requests.rs - request formatting

  **Acceptance Criteria**:
  - [ ] New adapter type exists (e.g., `IreliaHttpAdapter`) implementing `MobileHttpClient`
  - [ ] Adapter handles GET, POST, PATCH, DELETE methods
  - [ ] Adapter returns JSON `Value` body, never MsgPack
  - [ ] Existing `cargo test` passes (including regression tests from task 3)

  **QA Scenarios**:

  ```
  Scenario: HTTP adapter JSON contract
    Tool: Bash
    Steps: cd apps/conduit-next/src-tauri && cargo test irelia_http_adapter
    Expected: Adapter test passes with JSON body, status_code matches
    Evidence: .sisyphus/evidence/task-6-http-adapter.txt

  Scenario: MsgPack not leaked
    Tool: Bash
    Steps: Inspect adapter source for MsgPack handling; assert body is serde_json::Value
    Expected: No raw bytes passed as body; always deserialized to JSON Value
    Evidence: .sisyphus/evidence/task-6-no-msgpack.txt
  ```

  **Commit**: YES | Message: `feat(conduit-next): add Irelia HTTP adapter for MobileHttpClient` | Files: [apps/conduit-next/src-tauri/src/lcu/irelia_http.rs, mod.rs if changed]

- [x] 7. Create Irelia-based WebSocket event adapter

  **What to do**: Create a new module (e.g., `src/lcu/irelia_websocket.rs`) that wraps `irelia::ws::LcuWebSocket` and exposes an interface compatible with current `LcuWebSocketClient`. The adapter must:
  1. Connect to LCU websocket using Irelia
  2. Subscribe to `EventKind::json_api_event()`
  3. Convert Irelia events to the current `LcuEvent { path, event_type, data }` shape
  4. Provide `subscribe() -> broadcast::Receiver<LcuEvent>` matching current API
  5. Provide `observe(path, callback)` matching current API
  6. Handle disconnect/reconnect lifecycle (either via Irelia's built-in reconnect or by mapping to current manager behavior)

  **Must NOT do**: Do not change `LcuEvent` struct shape unless absolutely necessary. Do not break `manager.rs` peer_factory event forwarding.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: WebSocket lifecycle is complex; must preserve event broadcast behavior
  - Skills: []
  - Omitted: []

  **Parallelization**: Can Parallel: NO (depends on 2) | Wave 2 | Blocks: [8] | Blocked By: [1,2]

  **References**:
  - Current API: `apps/conduit-next/src-tauri/src/lcu/websocket.rs:57-136` - `LcuWebSocketClient`
  - Consumer: `apps/conduit-next/src-tauri/src/manager.rs:259-317` - `peer_factory` spawns event listener
  - External: https://github.com/AlsoSylv/Irelia/blob/master/irelia/src/ws.rs - Irelia WS API
  - External: https://github.com/AlsoSylv/Irelia/blob/master/irelia/src/ws/types.rs - Event types

  **Acceptance Criteria**:
  - [ ] New adapter provides `subscribe() -> broadcast::Receiver<LcuEvent>`
  - [ ] Irelia `EventKind::json_api_event()` events are mapped to `LcuEvent` with correct `path`, `event_type` (Create/Update/Delete/Other), `data`
  - [ ] `observe(path, callback)` works identically to current implementation
  - [ ] Existing `cargo test` passes (including regression test from task 4)

  **QA Scenarios**:

  ```
  Scenario: WebSocket event adapter shape preservation
    Tool: Bash
    Steps: cd apps/conduit-next/src-tauri && cargo test irelia_ws_adapter
    Expected: Test passes; mocked Irelia event produces identical LcuEvent to current parser
    Evidence: .sisyphus/evidence/task-7-ws-adapter.txt

  Scenario: Event broadcast distribution
    Tool: Bash
    Steps: cargo test event_broadcast_multiple_subscribers
    Expected: Multiple subscribers receive same events; no duplicates or drops
    Evidence: .sisyphus/evidence/task-7-broadcast.txt
  ```

  **Commit**: YES | Message: `feat(conduit-next): add Irelia WebSocket adapter` | Files: [apps/conduit-next/src-tauri/src/lcu/irelia_websocket.rs, mod.rs if changed]

- [x] 8. Wire Irelia adapters into ConnectionManager and MobileSession

  **What to do**: Update `manager.rs` to use the new Irelia HTTP and WebSocket adapters instead of `LcuHttpClient::new()` and `LcuWebSocketClient::connect()`. Update imports. Ensure `connect_for_lockfile` still creates the adapters, stores them in `ConnectionState`, and passes the HTTP client to `peer_factory`. The lockfile discovery may be simplified if Irelia handles it; if so, update `handle_lockfile_event` to use Irelia's auto-discovery or keep current watcher but pass lockfile info to Irelia client.

  **Must NOT do**: Do not change `ConnectionManager` public API. Do not change `ConnectionSnapshot` shape. Do not remove old modules yet (deprecate first).

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: Central orchestration change; high regression risk
  - Skills: []
  - Omitted: []

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: [11,12] | Blocked By: [3,4,6,7]

  **References**:
  - File: `apps/conduit-next/src-tauri/src/manager.rs:192-209` - `connect_for_lockfile`
  - File: `apps/conduit-next/src-tauri/src/manager.rs:259-317` - `peer_factory`
  - File: `apps/conduit-next/src-tauri/src/manager.rs:46-57` - `ConnectionState`

  **Acceptance Criteria**:
  - [ ] `manager.rs` compiles with Irelia adapters
  - [ ] `cargo test` in conduit-next passes
  - [ ] Regression tests from tasks 3 and 4 still pass
  - [ ] Connection state transitions (Waiting → Starting → Connected) remain identical

  **QA Scenarios**:

  ```
  Scenario: Manager integration compiles and tests pass
    Tool: Bash
    Steps: cd apps/conduit-next/src-tauri && cargo test
    Expected: All tests pass (including regression tests)
    Evidence: .sisyphus/evidence/task-8-manager-integration.txt

  Scenario: Connection state lifecycle
    Tool: Bash
    Steps: cargo test connection_state_transitions
    Expected: State machine produces same states as before
    Evidence: .sisyphus/evidence/task-8-state-lifecycle.txt
  ```

  **Commit**: YES | Message: `feat(conduit-next): wire Irelia adapters into ConnectionManager` | Files: [apps/conduit-next/src-tauri/src/manager.rs, lcu/mod.rs]

- [x] 9. Export typed LCU endpoint wrappers from protocol-contract

  **What to do**: In `packages/protocol-contract`, create a new module (e.g., `src/lcu/typed-endpoints.ts`) that re-exports and wraps `@hasagi/types` for Mimic's needs. Provide:
  1. Typed path constants for commonly used endpoints (gameflow, lobby, champ-select, summoner)
  2. Helper types: `LcuRequest<Path, Method>`, `LcuResponse<Path, Method>` using `LCUEndpoints`
  3. WebSocket event type helpers using `LCUWebSocketEvents`
  4. Re-export `HttpMethod` from hasagi-types (aliased to avoid conflicts with existing `LcuHttpMethod` if needed)

  **Must NOT do**: Do not remove existing `lcu-paths.ts` or `lcu-types.ts` yet. Add new exports alongside.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: TypeScript type re-exports and wrappers
  - Skills: []
  - Omitted: []

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: [11] | Blocked By: [5]

  **References**:
  - Current: `packages/protocol-contract/src/lcu/lcu-paths.ts` - existing path constants
  - Current: `packages/protocol-contract/src/lcu/lcu-types.ts` - existing method/result types
  - External: `node_modules/@hasagi/types/dist/lcu-endpoints.d.ts` - endpoint map
  - External: `node_modules/@hasagi/types/dist/lcu-events.d.ts` - event map

  **Acceptance Criteria**:
  - [ ] New file exports typed helpers
  - [ ] `tsc --noEmit` in protocol-contract passes
  - [ ] Existing imports from `@mimic/protocol-contract` are not broken

  **QA Scenarios**:

  ```
  Scenario: Type compilation
    Tool: Bash
    Steps: cd packages/protocol-contract && tsc --noEmit
    Expected: No type errors
    Evidence: .sisyphus/evidence/task-9-types-compile.txt
  ```

  **Commit**: YES | Message: `feat(protocol-contract): add typed LCU endpoint wrappers via @hasagi/types` | Files: [packages/protocol-contract/src/lcu/typed-endpoints.ts, src/index.ts if re-exporting]

- [x] 10. Export typed LCU WebSocket event wrappers from protocol-contract

  **What to do**: Create `src/lcu/typed-events.ts` in protocol-contract. Wrap `LCUWebSocketEvents` to provide:
  1. `LcuEventPayload<TEventName>` helper
  2. Constants for common event names (e.g., `OnJsonApiEvent_gameflow_v1_session`)
  3. Type guard helpers (compile-time only) for narrowing event data

  **Must NOT do**: Do not change existing `MobileOpcode.UPDATE` frame shapes.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: TypeScript wrapper types
  - Skills: []
  - Omitted: []

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: [12] | Blocked By: [5]

  **References**:
  - Current: `packages/protocol-contract/src/index.ts` - existing exports
  - External: `node_modules/@hasagi/types/dist/lcu-events.d.ts` - event definitions

  **Acceptance Criteria**:
  - [ ] New file exports event type helpers
  - [ ] `tsc --noEmit` passes

  **QA Scenarios**:

  ```
  Scenario: Event types compile
    Tool: Bash
    Steps: cd packages/protocol-contract && tsc --noEmit
    Expected: No type errors
    Evidence: .sisyphus/evidence/task-10-event-types.txt
  ```

  **Commit**: YES | Message: `feat(protocol-contract): add typed LCU WebSocket event wrappers` | Files: [packages/protocol-contract/src/lcu/typed-events.ts, src/index.ts]

- [x] 11. Update protocol-contract index exports

  **What to do**: Update `packages/protocol-contract/src/index.ts` to export the new typed modules. Ensure backward compatibility: existing exports (`LcuPaths`, `LcuHttpMethod`, etc.) must remain. Add new exports under clear names (e.g., `TypedLcuPaths`, `LcuEndpointResponse`, `LcuEventPayload`).

  **Must NOT do**: Do not remove or rename existing exports.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: Export management
  - Skills: []
  - Omitted: []

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: [] | Blocked By: [9,10]

  **References**:
  - File: `packages/protocol-contract/src/index.ts`

  **Acceptance Criteria**:
  - [ ] `src/index.ts` exports new typed modules
  - [ ] `tsc --noEmit` passes
  - [ ] A consumer can `import { LcuEndpointResponse } from '@mimic/protocol-contract'`

  **QA Scenarios**:

  ```
  Scenario: Export availability
    Tool: Bash
    Steps: cd packages/protocol-contract && grep -n 'LcuEndpointResponse\|LcuEventPayload' src/index.ts
    Expected: Matches found
    Evidence: .sisyphus/evidence/task-11-exports.txt
  ```

  **Commit**: YES | Message: `feat(protocol-contract): export typed LCU modules from index` | Files: [packages/protocol-contract/src/index.ts]

- [x] 12. Adopt typed LCU responses in web-next stores and hooks

  **What to do**: Update `apps/web-next` to import typed response types from `@mimic/protocol-contract` where LCU data is consumed. Start with high-impact files:
  1. `src/core/rift/lcu-transport.ts` - `LcuResult<TContent>` can be tightened using endpoint types
  2. `src/core/rift/hooks.ts` - `useLCURequest` return type
  3. Feature stores (lobby, champ-select, queue, etc.) - cast LCU response data to typed interfaces

  **Must NOT do**: Do not change runtime behavior. Types are compile-time only. Do not modify the tunnel protocol.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: TypeScript type annotations only
  - Skills: []
  - Omitted: []

  **Parallelization**: Can Parallel: YES | Wave 5 | Blocks: [13] | Blocked By: [8,11]

  **References**:
  - File: `apps/web-next/src/core/rift/lcu-transport.ts` - `LcuResult<TContent>`
  - File: `apps/web-next/src/core/rift/hooks.ts` - `useLCURequest`, `useLCUObserver`
  - File: `apps/web-next/src/core/http/http-client.ts` - API client types

  **Acceptance Criteria**:
  - [ ] `apps/web-next` compiles (`tsc --noEmit` or `bun test` if type-checked)
  - [ ] At least 3 key LCU-consuming files use new typed responses
  - [ ] No `any` added; existing `any` reduced where possible

  **QA Scenarios**:

  ```
  Scenario: Type compilation
    Tool: Bash
    Steps: cd apps/web-next && tsc --noEmit
    Expected: No type errors introduced
    Evidence: .sisyphus/evidence/task-12-web-types.txt

  Scenario: Type coverage improvement
    Tool: Bash
    Steps: grep -rn 'as any' apps/web-next/src/core/rift/ apps/web-next/src/features/ | wc -l
    Expected: Count is same or lower than before
    Evidence: .sisyphus/evidence/task-12-any-count.txt
  ```

  **Commit**: YES | Message: `feat(web-next): adopt typed LCU responses from protocol-contract` | Files: [apps/web-next/src/core/rift/*.ts, apps/web-next/src/features/**/*.ts]

- [x] 13. Final integration verification & cleanup

  **What to do**:
  1. Run full test suite across affected packages:
     - `cd apps/conduit-next/src-tauri && cargo test`
     - `cd apps/rift-next && bun test`
     - `cd apps/web-next && bun test`
     - `cd packages/protocol-contract && tsc --noEmit`
  2. If all pass, remove deprecated manual LCU modules from conduit-next (`lcu/http.rs`, `lcu/websocket.rs`, `lcu/lockfile.rs`) ONLY if Irelia fully replaces them. If any custom logic remains (e.g., lockfile path customization), keep and document.
  3. Update `conduit-next/AGENTS.md` or docs to reflect Irelia usage.

  **Must NOT do**: Do not remove old modules if they contain logic not present in Irelia.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: Integration verification and cleanup decisions
  - Skills: []
  - Omitted: []

  **Parallelization**: Can Parallel: NO | Wave 6 | Blocks: [F1-F4] | Blocked By: [11,12]

  **References**:
  - All test commands from previous tasks
  - Docs: `apps/conduit-next/AGENTS.md`

  **Acceptance Criteria**:
  - [ ] All test suites pass
  - [ ] Deprecated modules identified and either removed or documented as retained
  - [ ] Documentation updated

  **QA Scenarios**:

  ```
  Scenario: Full test suite
    Tool: Bash
    Steps: Run all test commands in sequence
    Expected: All exit 0
    Evidence: .sisyphus/evidence/task-13-full-suite.txt
  ```

  **Commit**: YES | Message: `chore(conduit-next): remove deprecated manual LCU modules` | Files: [apps/conduit-next/src-tauri/src/lcu/ (if cleaned), AGENTS.md]

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.

- [x] F1. Plan Compliance Audit — oracle
      Verify that:
  - rift-next runtime was not modified
  - Tunnel protocol opcodes and frame shapes are unchanged
  - No new product features added
  - hasagi-types is compile-time only

- [x] F2. Code Quality Review — unspecified-high
      Verify that:
  - Irelia adapters have clear boundaries (no Irelia types leak into MobileSession)
  - JSON normalization is explicit and tested
  - Error handling matches previous behavior
  - No `unwrap()` or `expect()` introduced without justification

- [x] F3. Real Manual QA — unspecified-high
      Verify that:
  - A simulated LCU HTTP request flows through the full stack: web-next → rift-next → conduit-next → adapter → response
  - A simulated LCU WebSocket event flows: adapter → conduit-next → rift-next → web-next
  - Disconnect/reconnect scenarios preserve subscription state

- [x] F4. Scope Fidelity Check — deep
      Verify that:
  - Only conduit-next and protocol-contract had significant changes
  - web-next changes are type-only (no runtime behavior change)
  - No dependencies added to rift-next
  - Lockfile customization (if any) is preserved or documented as removed

## Commit Strategy

- **Squash policy**: Each task is its own commit for traceability. Final cleanup can be a separate commit.
- **Commit prefix**: `feat(scope):` for new adapters/types, `test(scope):` for tests, `deps(scope):` for dependencies, `chore(scope):` for cleanup.
- **Order**: Dependencies first, then tests, then features, then types, then adoption, then cleanup.

## Success Criteria

1. `conduit-next` uses Irelia for LCU HTTP and WebSocket instead of hand-rolled reqwest/tungstenite.
2. `protocol-contract` exports typed LCU endpoints and events backed by `@hasagi/types`.
3. `web-next` consumes typed LCU responses where applicable.
4. All existing tests pass without modification (except where mocks were updated for Irelia adapters).
5. Mobile tunnel protocol remains byte-compatible.
6. `rift-next` has zero runtime changes.
