# LCU usage map

## Verification
- Grep scope: `/home/josuegalre/projects/mimic/apps/conduit-next/src-tauri/src/**/*.rs`
- Symbols searched: `LcuHttpClient`, `LcuWebSocketClient`, `LockfileInfo`, `LockfileEvent`, `LcuEvent`, `LcuEventType`, `MobileHttpClient`, `lcu::`, `crate::lcu`, `super::lcu`
- Result summary:
  - `LcuHttpClient` / `LcuWebSocketClient`: 19 matches in 4 files
  - `LockfileInfo` / `LockfileEvent`: 44 matches in 4 files
  - `LcuEvent` / `LcuEventType` / `MobileHttpClient`: 40 matches in 4 files
  - `lcu::` module paths: 5 matches in 3 files
  - `crate::lcu` / `super::lcu`: 3 matches in 2 files

## Request proxying

### `LcuHttpClient`
- `/home/josuegalre/projects/mimic/apps/conduit-next/src-tauri/src/lcu/http.rs:17-156` defines the authenticated LCU HTTP client and its request helpers.
- `/home/josuegalre/projects/mimic/apps/conduit-next/src-tauri/src/manager.rs:18,49,196,211,262` stores the client in connection state, creates it from the lockfile, and passes it into Rift/mobile setup.
- `/home/josuegalre/projects/mimic/apps/conduit-next/src-tauri/src/mobile/session.rs:19,84,352` injects the client into `MobileSession` and adapts it to the `MobileHttpClient` trait.

### `MobileHttpClient` trait
- `/home/josuegalre/projects/mimic/apps/conduit-next/src-tauri/src/mobile/session.rs:38-45` defines the abstraction for proxied mobile requests.
- `/home/josuegalre/projects/mimic/apps/conduit-next/src-tauri/src/mobile/session.rs:65,92,100,112,352,398,616,638` stores it as a trait object, passes it through constructors/tests, and implements it for `LcuHttpClient` and the mock client.

## Event subscription

### `LcuWebSocketClient`
- `/home/josuegalre/projects/mimic/apps/conduit-next/src-tauri/src/lcu/websocket.rs:57-141` defines the websocket client, event broadcaster, and subscription API.
- `/home/josuegalre/projects/mimic/apps/conduit-next/src-tauri/src/manager.rs:20,50,197,300,399` stores the websocket client, connects it from the lockfile, subscribes to events, and clears it during teardown.

### `LcuEvent`
- `/home/josuegalre/projects/mimic/apps/conduit-next/src-tauri/src/lcu/websocket.rs:34-39,58,114,120,152-176` defines the event payload and moves parsed websocket messages into broadcast/observer paths.
- `/home/josuegalre/projects/mimic/apps/conduit-next/src-tauri/src/mobile/session.rs:137-157,562-575` consumes LCU events and forwards matching updates to the mobile client.

### `LcuEventType`
- `/home/josuegalre/projects/mimic/apps/conduit-next/src-tauri/src/lcu/websocket.rs:27-31,166-184,199-230` defines and tests the event-type mapping from websocket payloads.
- `/home/josuegalre/projects/mimic/apps/conduit-next/src-tauri/src/mobile/session.rs:142-145,564,569` maps create/update/delete events to mobile status codes and ignores unknown types.

## Lockfile lifecycle

### `LockfileInfo`
- `/home/josuegalre/projects/mimic/apps/conduit-next/src-tauri/src/lcu/lockfile.rs:10-17,94-100` defines the lockfile record and constructs it from parsed file contents.
- `/home/josuegalre/projects/mimic/apps/conduit-next/src-tauri/src/lcu/http.rs:9,11,19,36,45,46,99,122,136,158,260-267` uses lockfile data to build requests, refresh state, and exercise request-building tests.
- `/home/josuegalre/projects/mimic/apps/conduit-next/src-tauri/src/lcu/websocket.rs:20,63` uses the lockfile to build the websocket URL and auth headers.
- `/home/josuegalre/projects/mimic/apps/conduit-next/src-tauri/src/manager.rs:19,48,192,434,668-675` keeps the current lockfile in connection state, reconnects on changes, and seeds test fixtures.

### `LockfileEvent`
- `/home/josuegalre/projects/mimic/apps/conduit-next/src-tauri/src/lcu/lockfile.rs:31-36,51-84` defines and emits appeared/changed/disappeared lifecycle events from the file watcher.
- `/home/josuegalre/projects/mimic/apps/conduit-next/src-tauri/src/manager.rs:19,43,169-189,456,550-616` receives watcher events, converts them into connection actions, and validates that mapping in tests.

## Connection state

- `/home/josuegalre/projects/mimic/apps/conduit-next/src-tauri/src/manager.rs:37-57` stores the LCU/http/websocket handles and reconnect state.
- `/home/josuegalre/projects/mimic/apps/conduit-next/src-tauri/src/manager.rs:153-206` starts lockfile watching, reacts to lifecycle events, and opens the LCU clients.
- `/home/josuegalre/projects/mimic/apps/conduit-next/src-tauri/src/manager.rs:244-257,363-460,491-501` owns teardown/reconnect behavior and derives the user-facing connection snapshot.

## `lcu::` module paths

- `/home/josuegalre/projects/mimic/apps/conduit-next/src-tauri/src/manager.rs:17-21,69,71` imports the LCU HTTP/websocket clients and maps their errors into `ConnectionManagerError`.
- `/home/josuegalre/projects/mimic/apps/conduit-next/src-tauri/src/mobile/session.rs:18-20` imports LCU HTTP/websocket symbols for request proxying and event translation.
- `/home/josuegalre/projects/mimic/apps/conduit-next/src-tauri/src/lcu/http.rs:9` references `crate::lcu::lockfile` helpers for lockfile discovery/parsing.

## Irelia migration impact

Files most likely to need changes during migration:
- `/home/josuegalre/projects/mimic/apps/conduit-next/src-tauri/src/manager.rs`
- `/home/josuegalre/projects/mimic/apps/conduit-next/src-tauri/src/mobile/session.rs`
- `/home/josuegalre/projects/mimic/apps/conduit-next/src-tauri/src/lcu/http.rs`
- `/home/josuegalre/projects/mimic/apps/conduit-next/src-tauri/src/lcu/websocket.rs`
- `/home/josuegalre/projects/mimic/apps/conduit-next/src-tauri/src/lcu/lockfile.rs`

Lowest-risk follow-up files (only if module boundaries change):
- `/home/josuegalre/projects/mimic/apps/conduit-next/src-tauri/src/lcu/mod.rs`
- `/home/josuegalre/projects/mimic/apps/conduit-next/src-tauri/src/lib.rs`
