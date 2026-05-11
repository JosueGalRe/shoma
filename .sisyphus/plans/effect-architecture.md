# Rift Next Effect Architecture

Status: architecture decision record for a behavior-preserving migration of `apps/rift-next` to Effect. This document is intentionally written before implementation code is changed.

## Goals and non-goals

The migration must preserve the current public behavior of `apps/rift-next`:

- Keep Elysia as the HTTP and WebSocket framework.
- Keep the same HTTP routes, status codes, response bodies, CORS headers, and lifecycle exports from `src/index.ts`.
- Keep the same WebSocket routes, JSON frame shapes, close behavior, peer mapping behavior, and `RiftOpcode` numeric values.
- Keep the protocol contract import path `@mimic/protocol-contract` stable for `apps/web-next`.
- Replace null/boolean/throw control flow inside the rift domain with typed Effect errors.
- Do not migrate `apps/web-next`, change the protocol, or replace Elysia.

Current source read for this plan:

- `apps/rift-next/src/index.ts`
- `apps/rift-next/src/core/config/env-config.ts`
- `apps/rift-next/src/core/logger/logger-utils.ts`
- `apps/rift-next/src/core/database/database.ts`
- `apps/rift-next/src/core/database/database-types.ts`
- `apps/rift-next/src/core/http/index-types.ts`
- `apps/rift-next/src/core/http/index-utils.ts`
- `apps/rift-next/src/core/realtime/realtime.ts`
- `apps/rift-next/src/core/realtime/realtime-types.ts`
- `apps/rift-next/src/core/realtime/realtime-utils.ts`

Protocol contract source read for the dual-export decision:

- `packages/protocol-contract/src/index.ts`
- `packages/protocol-contract/src/lcu/lcu-paths.ts`
- `packages/protocol-contract/src/lcu/lcu-types.ts`
- `packages/protocol-contract/src/lcu/typed-endpoints.ts`
- `packages/protocol-contract/src/lcu/typed-events.ts`

## Runtime boundary definition

### Decision

`Effect.runPromise` belongs only at Elysia and process lifecycle boundaries. It must not be hidden inside repository, auth, realtime, or parser services.

Concrete boundaries:

1. `startRuntime(options)` builds the app runtime layer once, initializes the database, starts realtime keepalive, starts Elysia, and returns the same runtime handle shape.
2. Each Elysia HTTP handler calls an adapter helper that runs one request Effect and converts typed errors to the existing HTTP status and response body.
3. Each Elysia WebSocket callback (`open`, `message`, `close`) calls a WebSocket adapter helper that runs one realtime Effect and converts typed realtime errors to the existing close/log/ignore behavior.
4. Signal handlers remain synchronous wrappers around `runtime.stop()`. Shutdown internals may run Effect, but the exported `stop()` shape stays synchronous from the caller perspective unless a later implementation proves the server stop API needs async cleanup.

The Elysia route table remains intact:

```ts
const app = new Elysia()

app.post('/register', async (ctx) =>
  runHttp(ctx, registerProgram(ctx.body)),
)

app.get('/check', async (ctx) =>
  runHttp(ctx, checkProgram(ctx.query)),
)

app.ws('/conduit', {
  open(ws) {
    void runSocket(conduitOpenProgram(ws, ws.data), { closeOnFailure: true })
  },
  message(ws, message) {
    void runSocket(conduitMessageProgram(ws, message), { closeOnFailure: true })
  },
  close(ws) {
    void runSocket(conduitCloseProgram(ws), { closeOnFailure: false })
  },
})
```

The adapter is the only place that calls `Effect.runPromise`:

```ts
interface HttpContextBoundary {
  readonly set: { status?: number }
}

type HttpResult =
  | boolean
  | string
  | { readonly ok: true; readonly token: string }
  | { readonly ok: false; readonly error: string }
  | { readonly riftOpcodesLoaded: boolean }

async function runHttp(
  ctx: HttpContextBoundary,
  program: Effect.Effect<HttpResult, RiftHttpError, RiftAppServices>,
): Promise<HttpResult> {
  const exit = await Effect.runPromiseExit(Effect.provide(program, RiftRuntimeLayer))

  return Exit.match(exit, {
    onSuccess: (value) => value,
    onFailure: (cause) => {
      const error = mapCauseToHttpError(cause)
      ctx.set.status = error.status
      return error.body
    },
  })
}
```

This keeps Elysia's routing, CORS hooks, pino plugin, websocket upgrade behavior, and test helpers stable. Domain services return `Effect.Effect<Success, TypedError, Dependencies>`; Elysia owns conversion to HTTP/WebSocket side effects.

## Service boundaries

### ConfigService

Owns parsed environment access currently in `core/config/env-config.ts`:

```ts
interface ConfigService {
  readonly jwtSecret: Effect.Effect<string, MissingJwtSecretError>
  readonly optionalJwtSecret: Effect.Effect<string | undefined>
  readonly port: Effect.Effect<number, InvalidPortError>
  readonly hostname: Effect.Effect<string>
  readonly logLevel: Effect.Effect<LogLevel>
  readonly logSilentInTests: Effect.Effect<boolean>
  readonly databasePath: Effect.Effect<string>
}
```

`PORT` parsing currently throws at getter access for invalid values. The Effect version raises `InvalidPortError` at startup/runtime layer construction so the boot failure is typed internally while still failing startup.

### LoggerService

Owns current logger behavior from `core/logger/logger-utils.ts` and keeps pino/Elysia logger integration at the boundary:

```ts
interface LoggerService {
  readonly info: (event: string, context?: Record<string, unknown>) => Effect.Effect<void>
  readonly warn: (event: string, context?: Record<string, unknown>) => Effect.Effect<void>
  readonly error: (event: string, context?: Record<string, unknown>) => Effect.Effect<void>
  readonly debug: (event: string, context?: Record<string, unknown>) => Effect.Effect<void>
}
```

The pino plugin export remains usable by Elysia:

```ts
app.use(pinoLogger.into())
```

The Effect logger service wraps the same `logger.info/warn/error/debug` event names, including `register_success`, `token_verification_failed`, `conduit_open_rejected_missing_auth`, `mobile_message_error`, and `runtime_stopped`.

### DatabaseService

Owns the SQLite registry currently implemented as a module-level `Database | null` singleton:

```ts
interface ConduitInstance {
  readonly code: string
  readonly publicKey: string
}

interface DatabaseService {
  readonly initialize: Effect.Effect<void, DatabaseOpenError | DatabaseQueryError>
  readonly close: Effect.Effect<void>
  readonly generateCode: (pubkey: string) => Effect.Effect<string, DatabaseNotInitializedError | DatabaseQueryError>
  readonly lookup: (code: string) => Effect.Effect<ConduitInstance | null, DatabaseNotInitializedError | DatabaseQueryError>
  readonly updatePublicKey: (code: string, pubkey: string) => Effect.Effect<boolean, DatabaseNotInitializedError | DatabaseQueryError>
}
```

Behavior to preserve:

- `initializeDatabase(databasePath)` closes an existing connection with `close(false)` before opening a new one.
- The table remains `conduit_instances(code TEXT PRIMARY KEY, public_key TEXT)`.
- `generateCode(pubkey)` returns an existing code when the same public key is already registered.
- New codes remain six digits generated by `Math.floor(Math.random() * 900000) + 100000` unless a later implementation deliberately injects randomness for tests without changing the output range.
- `lookup(code)` returns `null` for missing rows.
- `potentiallyUpdate(code, pubkey)` returns `false` for missing rows and updates `public_key` for existing rows.

### AuthService

Owns JWT signing and verification currently embedded in `src/index.ts`:

```ts
interface TokenPayload {
  readonly code?: string
}

interface AuthService {
  readonly signCode: (code: string) => Effect.Effect<string, MissingJwtSecretError | TokenSignError>
  readonly verifyCode: (token: string) => Effect.Effect<string, MissingJwtSecretError | InvalidTokenError | TokenMissingCodeError>
}
```

Behavior to preserve:

- `/register` returns HTTP 500 `{ ok: false, error: 'Missing RIFT_JWT_SECRET.' }` when the secret is missing.
- `/check` returns HTTP 500 `false` when the secret is missing.
- WebSocket conduit auth logs `missing_jwt_secret_for_token_verification` and rejects the socket when the secret is missing.
- Invalid JWTs log `token_verification_failed` in conduit verification and reject/return `false` as today.
- Decoded tokens without string `code` reject/return `false` as today.

### HttpInputService

Owns the current unknown-value readers from `core/http/index-utils.ts`:

```ts
interface HttpInputService {
  readonly readPubkeyFromBody: (value: unknown) => Effect.Effect<string, MissingPublicKeyError>
  readonly readConduitOpenData: (value: unknown) => Effect.Effect<ConduitOpenData>
  readonly extractConduitAuth: (data: ConduitOpenData) => Effect.Effect<ConduitAuth, MissingConduitAuthError>
  readonly readTokenCode: (value: unknown) => Effect.Effect<string, TokenMissingCodeError>
}

interface ConduitAuth {
  readonly token: string
  readonly publicKey: string
}
```

The query/header/request URL precedence in `extractConduitAuth` stays identical:

1. `query.token`
2. `query.publicKey`, `query.publickey`, `query['public-key']`
3. `headers.token`
4. `headers['public-key']`, `headers.publickey`
5. URL `token`, `publicKey`, `publickey`, `public-key`

### RealtimeStateService

Owns all mutable state currently private to `RiftRealtimeManager`:

```ts
interface RealtimeStateService {
  readonly conduitConnections: Map<string, RealtimeSocket>
  readonly conduitSocketToCode: Map<object, string>
  readonly conduitToMobileMap: Map<object, ConduitRecord[]>
  readonly mobileToConduitMap: Map<object, ConduitRecord>
  readonly mobileSockets: Set<RealtimeSocket>
  readonly conduitSockets: Set<RealtimeSocket>
  readonly keepAliveInterval: { current: ReturnType<typeof setInterval> | null }
}
```

See [Mutable state decision for RiftRealtimeManager](#mutable-state-decision-for-riftrealtimemanager) for why these remain mutable behind a service boundary.

### RealtimeService

Owns the current websocket domain methods from `core/realtime/realtime.ts`:

```ts
interface RealtimeService {
  readonly handleMobileOpen: (socket: RealtimeSocket) => Effect.Effect<void>
  readonly handleConduitOpen: (socket: RealtimeSocket, token: string | undefined, publicKey: string | undefined) => Effect.Effect<void, ConduitOpenError>
  readonly handleConduitMessage: (socket: RealtimeSocket, rawMessage: unknown) => Effect.Effect<void, ConduitMessageError>
  readonly handleConduitClose: (socket: RealtimeSocket) => Effect.Effect<void>
  readonly handleMobileMessage: (socket: RealtimeSocket, rawMessage: unknown) => Effect.Effect<void, MobileMessageError>
  readonly handleMobileClose: (socket: RealtimeSocket) => Effect.Effect<void>
  readonly startKeepAlive: (intervalMs?: number) => Effect.Effect<void>
  readonly stopKeepAlive: Effect.Effect<void>
  readonly shutdown: Effect.Effect<void>
}
```

Behavior to preserve:

- `/conduit` closes immediately when `handleConduitOpen` fails.
- A new conduit connection for an existing code evicts and closes the previous conduit socket.
- Conduit `REPLY` forwards `[RiftOpcode.RECEIVE, payload]` to the matching mobile peer.
- Unknown conduit peer replies are ignored after a debug log.
- Invalid conduit messages log `conduit_message_error` and close the conduit socket.
- Mobile `CONNECT` with no registered/connected conduit sends `[RiftOpcode.CONNECT_PUBKEY, null]` and keeps the socket open.
- Mobile `CONNECT` with an attached conduit sends `[RiftOpcode.OPEN, uuid]` to conduit and `[RiftOpcode.CONNECT_PUBKEY, entry.public_key]` to mobile.
- Duplicate mobile connect logs `mobile_connect_duplicate_session` and closes the socket.
- Mobile `SEND` without a peer logs `mobile_send_without_peer` and closes the socket.
- Mobile `SEND` forwards `[RiftOpcode.MSG, peer.uuid, payload]`.
- Mobile close sends `[RiftOpcode.CLOSE, peer.uuid]` to conduit only when a peer exists.
- Keepalive pings every mobile and conduit socket every `intervalMs`, default `10000`.
- Shutdown stops keepalive, closes all sockets, clears every map/set, and logs `realtime_shutdown_complete`.

### IdService

Owns UUID generation currently passed as `createConnectionId: () => crypto.randomUUID()`:

```ts
interface IdService {
  readonly createConnectionId: Effect.Effect<string>
}
```

### ProtocolService

Owns frame validation and JSON serialization without changing the protocol contract:

```ts
type RiftWireFrame = readonly [RiftOpcode, ...ReadonlyArray<unknown>]

interface ProtocolService {
  readonly parseFrame: (rawMessage: unknown) => Effect.Effect<RiftWireFrame, FrameFormatError | FramePayloadError>
  readonly encodeFrame: (frame: RiftWireFrame) => Effect.Effect<string, FrameEncodeError>
}
```

Behavior to preserve from `parseFrame`:

- Already parsed arrays with numeric first element are accepted.
- Strings are parsed with `JSON.parse` and must become arrays with numeric first element.
- `Uint8Array` is decoded using `TextDecoder`, parsed, and validated the same way.
- Invalid parsed payloads map to the existing message `Invalid websocket frame payload.`
- Unsupported raw message formats map to the existing message `Invalid websocket frame format.`

## Layer graph

The application layer is built once in `startRuntime`. Request handlers provide the same layer to each program rather than constructing services per request.

```txt
RiftRuntimeLayer
├─ ConfigLive
│  └─ Bun.env
├─ LoggerLive
│  └─ ConfigService
├─ DatabaseLive
│  ├─ ConfigService
│  └─ bun:sqlite Database resource
├─ AuthLive
│  ├─ ConfigService
│  ├─ LoggerService
│  └─ jsonwebtoken
├─ HttpInputLive
├─ IdLive
│  └─ crypto.randomUUID
├─ ProtocolLive
│  ├─ TextDecoder
│  └─ @mimic/protocol-contract RiftOpcode types/constants
├─ RealtimeStateLive
│  └─ scoped mutable Maps/Sets/interval cell
└─ RealtimeLive
   ├─ LoggerService
   ├─ DatabaseService
   ├─ AuthService
   ├─ IdService
   ├─ ProtocolService
   └─ RealtimeStateService
```

Concrete Effect tags:

```ts
class Config extends Context.Tag('rift/Config')<Config, ConfigService>() {}
class Log extends Context.Tag('rift/Log')<Log, LoggerService>() {}
class Registry extends Context.Tag('rift/Registry')<Registry, DatabaseService>() {}
class Auth extends Context.Tag('rift/Auth')<Auth, AuthService>() {}
class HttpInput extends Context.Tag('rift/HttpInput')<HttpInput, HttpInputService>() {}
class Ids extends Context.Tag('rift/Ids')<Ids, IdService>() {}
class Protocol extends Context.Tag('rift/Protocol')<Protocol, ProtocolService>() {}
class RealtimeState extends Context.Tag('rift/RealtimeState')<RealtimeState, RealtimeStateService>() {}
class Realtime extends Context.Tag('rift/Realtime')<Realtime, RealtimeService>() {}

type RiftAppServices =
  | Config
  | Log
  | Registry
  | Auth
  | HttpInput
  | Ids
  | Protocol
  | RealtimeState
  | Realtime
```

Layer composition shape:

```ts
const InfrastructureLayer = Layer.mergeAll(
  ConfigLive,
  HttpInputLive,
  IdLive,
  ProtocolLive,
)

const LoggerLayer = LoggerLive.pipe(Layer.provide(ConfigLive))

const DatabaseLayer = DatabaseLive.pipe(Layer.provide(ConfigLive))

const AuthLayer = AuthLive.pipe(Layer.provide(Layer.mergeAll(ConfigLive, LoggerLayer)))


const RealtimeLayer = RealtimeLive.pipe(
  Layer.provide(
    Layer.mergeAll(
      LoggerLayer,
      DatabaseLayer,
      AuthLayer,
      IdLive,
      ProtocolLive,
      RealtimeStateLive,
    ),
  ),
)

const RiftRuntimeLayer = Layer.mergeAll(
  InfrastructureLayer,
  LoggerLayer,
  DatabaseLayer,
  AuthLayer,
  RealtimeStateLive,
  RealtimeLayer,
)
```

Implementation can deduplicate repeated `ConfigLive` provisioning by using `Layer.provideMerge`; the dependency graph above is the required shape.

## Error taxonomy and HTTP mapping

All typed errors use discriminated classes or tagged objects. They carry enough detail for logs, but the boundary returns today's exact status/body.

### Shared typed errors

```ts
type RiftError =
  | MissingPublicKeyError
  | MissingJwtSecretError
  | InvalidPortError
  | DatabaseNotInitializedError
  | DatabaseOpenError
  | DatabaseQueryError
  | TokenSignError
  | InvalidTokenError
  | TokenMissingCodeError
  | MissingTokenToCheckError
  | MissingConduitAuthError
  | StaleConduitCodeError
  | FrameFormatError
  | FramePayloadError
  | InvalidOpcodeError
  | InvalidConnectCodeError
  | InvalidPeerIdError
  | UnknownPeerError
  | DuplicateMobileSessionError
  | MissingMobilePeerError
  | FrameEncodeError
  | SocketCloseError
```

Example definitions without protocol changes:

```ts
interface MissingPublicKeyError {
  readonly _tag: 'MissingPublicKeyError'
}

interface MissingJwtSecretError {
  readonly _tag: 'MissingJwtSecretError'
  readonly operation: 'register' | 'check' | 'conduitVerify'
}

interface DatabaseQueryError {
  readonly _tag: 'DatabaseQueryError'
  readonly operation: 'initialize' | 'generateCode' | 'lookup' | 'updatePublicKey'
  readonly cause: unknown
}

interface InvalidOpcodeError {
  readonly _tag: 'InvalidOpcodeError'
  readonly source: 'mobile' | 'conduit'
  readonly opcode: number
}
```

### Current HTTP paths

| Current path | Current trigger | Current status | Current body | New typed error | Boundary mapping |
| --- | --- | ---: | --- | --- | --- |
| `GET /` | none | 200 | `'Hai, rifto desu.'` | none | direct success |
| `POST /register` | body is not record or `pubkey` is not string | 400 | `{ ok: false, error: 'Missing public key.' }` | `MissingPublicKeyError` | set `ctx.set.status = 400`, return same body |
| `POST /register` | `RIFT_JWT_SECRET` missing | 500 | `{ ok: false, error: 'Missing RIFT_JWT_SECRET.' }` | `MissingJwtSecretError` with `operation: 'register'` | set status 500, return same body |
| `POST /register` | database not initialized | implicit thrown 500 | Elysia default error response today | `DatabaseNotInitializedError` | preserve as 500; migration should initialize before listen so this should only occur in tests/misuse |
| `POST /register` | SQLite query/open failure | implicit thrown 500 | Elysia default error response today | `DatabaseQueryError` or `DatabaseOpenError` | preserve as 500; log structured error |
| `POST /register` | JWT signing throws | implicit thrown 500 | Elysia default error response today | `TokenSignError` | preserve as 500; log structured error |
| `GET /check` | `query.token` missing or not string | 400 | `{ ok: false, error: 'Missing a token to check.' }` | `MissingTokenToCheckError` | set status 400, return same body |
| `GET /check` | `RIFT_JWT_SECRET` missing | 500 | `false` | `MissingJwtSecretError` with `operation: 'check'` | set status 500, return `false` |
| `GET /check` | JWT verify throws | 200 | `false` | `InvalidTokenError` | recover to `false`, do not set status |
| `GET /check` | decoded token has no string `code` | 200 | `false` | `TokenMissingCodeError` | recover to `false`, do not set status |
| `GET /check` | database lookup misses | 200 | `false` | none; `lookup` success with `null` | return `false` |
| `GET /check` | database not initialized/query failure | implicit thrown 500 | Elysia default error response today | `DatabaseNotInitializedError` or `DatabaseQueryError` | preserve as 500; log structured error |
| `GET /health/protocol` | none | 200 | `{ riftOpcodesLoaded: RiftOpcode.RECEIVE === 8 }` | none | direct success |
| `OPTIONS *` | preflight request | 204 | `''` | none | stays synchronous Elysia handler |

### Current WebSocket error paths

WebSocket errors do not map to HTTP status after upgrade. The boundary maps typed errors to today's close/log/send behavior.

| Current callback | Current trigger | Current behavior | New typed error | Boundary mapping |
| --- | --- | --- | --- | --- |
| `/conduit` open | missing token or public key | log `conduit_open_rejected_missing_auth`; return `false`; Elysia callback closes socket | `MissingConduitAuthError` | log same event, fail open program, adapter closes socket |
| `/conduit` open | JWT secret missing | log `missing_jwt_secret_for_token_verification`; return `false`; close socket | `MissingJwtSecretError` with `operation: 'conduitVerify'` | log same event, fail open program, adapter closes socket |
| `/conduit` open | JWT verify throws | log `token_verification_failed`, then `conduit_open_rejected_invalid_token`; close socket | `InvalidTokenError` | log same events, adapter closes socket |
| `/conduit` open | decoded token missing string `code` | log `conduit_open_rejected_invalid_token`; close socket | `TokenMissingCodeError` | log same event, adapter closes socket |
| `/conduit` open | `potentiallyUpdate` returns `false` | log `conduit_open_rejected_stale_code`; close socket | `StaleConduitCodeError` | log same event, adapter closes socket |
| `/conduit` open | database throws during update | currently propagates through callback | `DatabaseNotInitializedError` or `DatabaseQueryError` | log structured error, close socket to match failure semantics |
| `/conduit` open | existing connection for same code | close old socket, log `conduit_connection_evicted`; accept new socket | none | same side effects inside success path |
| `/conduit` message | raw frame unsupported | log `conduit_message_error` reason `Invalid websocket frame format.`; close socket | `FrameFormatError` | same log reason, close socket |
| `/conduit` message | JSON parse fails | log `conduit_message_error` with parser message today; close socket | `FramePayloadError` with parser cause | same reason text where possible, close socket |
| `/conduit` message | parsed payload not frame | log reason `Invalid websocket frame payload.`; close socket | `FramePayloadError` | same log reason, close socket |
| `/conduit` message | opcode not `RiftOpcode.REPLY` | log reason `Conduit sent invalid opcode.`; close socket | `InvalidOpcodeError` with source `conduit` | same log reason, close socket |
| `/conduit` message | peer id not string | log reason `Conduit sent invalid peer id.`; close socket | `InvalidPeerIdError` | same log reason, close socket |
| `/conduit` message | peer id unknown | log `conduit_reply_ignored_unknown_peer`; keep socket open | `UnknownPeerError` as recoverable | recover by logging same event and returning success |
| `/mobile` message | raw frame unsupported | log `mobile_message_error` reason `Invalid websocket frame format.`; close socket | `FrameFormatError` | same log reason, close socket |
| `/mobile` message | JSON parse fails | log `mobile_message_error` with parser message today; close socket | `FramePayloadError` with parser cause | same reason text where possible, close socket |
| `/mobile` message | parsed payload not frame | log reason `Invalid websocket frame payload.`; close socket | `FramePayloadError` | same log reason, close socket |
| `/mobile` message | duplicate `CONNECT` on same mobile socket | log `mobile_connect_duplicate_session`; close socket; no throw log | `DuplicateMobileSessionError` | log same event, close socket, recover success |
| `/mobile` message | `CONNECT` code arg not string | log reason `Mobile sent invalid code.`; close socket | `InvalidConnectCodeError` | same log reason, close socket |
| `/mobile` message | code not in DB or conduit not connected | send `[RiftOpcode.CONNECT_PUBKEY, null]`; log `mobile_connect_no_conduit`; keep open | none | same success path |
| `/mobile` message | database lookup throws | currently caught by outer catch, logs `mobile_message_error`, closes socket | `DatabaseNotInitializedError` or `DatabaseQueryError` | same log/close behavior |
| `/mobile` message | `SEND` without peer | log `mobile_send_without_peer`; close socket; no throw log | `MissingMobilePeerError` | log same event, close socket, recover success |
| `/mobile` message | opcode neither `CONNECT` nor `SEND` | log reason `Mobile sent invalid opcode.`; close socket | `InvalidOpcodeError` with source `mobile` | same log reason, close socket |
| `/mobile` close | socket has no peer | remove from mobile set, log `mobile_close_no_peer`; keep conduit untouched | none | same success path |
| `/mobile` close | socket has peer | detach peer, send `[RiftOpcode.CLOSE, peer.uuid]`, log `mobile_close` | none | same success path |
| keepalive | interval already running | current code stops old interval and starts new one | none | same success path |
| shutdown | sockets close methods throw | currently would abort loop if throw occurs | `SocketCloseError` if modeled | implementation should preserve practical shutdown intent; log and continue only if tests allow |

### HTTP adapter mapping code shape

```ts
type HttpErrorBody =
  | { readonly ok: false; readonly error: string }
  | false

interface HttpMappedError {
  readonly status: number
  readonly body: HttpErrorBody
}

function mapHttpError(error: RiftHttpError): HttpMappedError {
  switch (error._tag) {
    case 'MissingPublicKeyError':
      return { status: 400, body: { ok: false, error: 'Missing public key.' } }
    case 'MissingTokenToCheckError':
      return { status: 400, body: { ok: false, error: 'Missing a token to check.' } }
    case 'MissingJwtSecretError':
      if (error.operation === 'check') {
        return { status: 500, body: false }
      }
      return { status: 500, body: { ok: false, error: 'Missing RIFT_JWT_SECRET.' } }
    case 'DatabaseNotInitializedError':
    case 'DatabaseOpenError':
    case 'DatabaseQueryError':
    case 'TokenSignError':
      return { status: 500, body: { ok: false, error: 'Internal server error.' } }
  }
}
```

The implementation must confirm whether current Elysia default thrown-error JSON is covered by tests. If tests assert exact default error bodies for implicit failures, the adapter must reproduce that shape instead of the generic internal body above. The explicit behavior-preserving requirements are strongest for current deliberate branches: `/register` 400/500, `/check` 400/500/false, and protocol health.

## Mutable state decision for RiftRealtimeManager

### Decision

Keep the realtime socket registry mutable, but move it behind `RealtimeStateService` and construct it in a scoped layer.

The current manager tracks live object identity and bidirectional relationships:

- `Map<string, RealtimeSocket>`: code to active conduit socket.
- `Map<object, string>`: conduit socket identity to code.
- `Map<object, ConduitRecord[]>`: conduit socket identity to attached mobile peers.
- `Map<object, ConduitRecord>`: mobile socket identity to attached conduit peer.
- `Set<RealtimeSocket>`: all mobile sockets for keepalive and shutdown.
- `Set<RealtimeSocket>`: all conduit sockets for keepalive and shutdown.
- `ReturnType<typeof setInterval> | null`: keepalive lifecycle handle.

Replacing these with immutable values would add churn and increase the risk of protocol regressions because socket identity and in-place peer list removal are central to the current behavior. The migration should instead make mutation explicit and scoped:

```ts
const RealtimeStateLive = Layer.scoped(
  RealtimeState,
  Effect.acquireRelease(
    Effect.sync<RealtimeStateService>(() => ({
      conduitConnections: new Map(),
      conduitSocketToCode: new Map(),
      conduitToMobileMap: new Map(),
      mobileToConduitMap: new Map(),
      mobileSockets: new Set(),
      conduitSockets: new Set(),
      keepAliveInterval: { current: null },
    })),
    (state) =>
      Effect.sync(() => {
        if (state.keepAliveInterval.current) {
          clearInterval(state.keepAliveInterval.current)
          state.keepAliveInterval.current = null
        }

        for (const socket of state.mobileSockets) socket.close()
        for (const socket of state.conduitSockets) socket.close()

        state.mobileSockets.clear()
        state.conduitSockets.clear()
        state.mobileToConduitMap.clear()
        state.conduitToMobileMap.clear()
        state.conduitSocketToCode.clear()
        state.conduitConnections.clear()
      }),
  ),
)
```

Rules for mutation:

1. Only `RealtimeLive` may mutate `RealtimeStateService`.
2. Elysia callbacks never read or write maps directly.
3. Tests may provide a test `RealtimeStateService`, but production code receives the scoped live layer.
4. `socketKey(socket)` behavior stays unchanged: `socket.raw ?? socket`.
5. Keepalive remains `setInterval` because Elysia/Bun sockets expose imperative `ping`; Effect `Schedule` can be considered later only if it preserves lifecycle and test timing exactly.

## Elysia boundary strategy

The migration keeps Elysia as the adapter and moves domain decisions inward.

### Keep current Elysia shape

The following stay in `src/index.ts` or an equivalent Elysia adapter module:

- `const app = new Elysia()`
- `app.onAfterHandle` CORS headers
- `app.options('*')` 204 preflight handler
- `app.use(pinoLogger.into())`
- `export { extractConduitAuth }` compatibility export if tests import it
- `export function initializeApp(databasePath?: string)` compatibility export
- `export function startRuntime(options: StartRuntimeOptions = {})`
- `if (import.meta.main)` runtime boot and signal handlers
- `export { app }`

### Route programs

Each route becomes a small adapter plus a domain program.

`POST /register` domain shape:

```ts
const registerProgram = (body: unknown) =>
  Effect.gen(function* () {
    const input = yield* HttpInput
    const registry = yield* Registry
    const auth = yield* Auth
    const log = yield* Log

    const pubkey = yield* input.readPubkeyFromBody(body)
    const code = yield* registry.generateCode(pubkey)
    const token = yield* auth.signCode(code)

    yield* log.info('register_success', { code })
    return { ok: true, token } as const
  })
```

`GET /check` domain shape:

```ts
const checkProgram = (query: Record<string, string | undefined>) =>
  Effect.gen(function* () {
    const registry = yield* Registry
    const auth = yield* Auth

    const token = query.token
    if (typeof token !== 'string') {
      return yield* Effect.fail({ _tag: 'MissingTokenToCheckError' } as const)
    }

    const code = yield* auth.verifyCode(token).pipe(
      Effect.catchTags({
        InvalidTokenError: () => Effect.succeed(null),
        TokenMissingCodeError: () => Effect.succeed(null),
      }),
    )

    if (!code) return false

    const entry = yield* registry.lookup(code)
    return Boolean(entry)
  })
```

The `/check` program intentionally recovers invalid tokens and missing token codes to `false` with status 200, matching current behavior.

### WebSocket programs

WebSocket callbacks keep their Elysia signatures and delegate immediately:

```ts
const conduitOpenProgram = (socket: RealtimeSocket, data: unknown) =>
  Effect.gen(function* () {
    const input = yield* HttpInput
    const realtime = yield* Realtime

    const openData = yield* input.readConduitOpenData(data)
    const auth = yield* input.extractConduitAuth(openData)
    yield* realtime.handleConduitOpen(socket, auth.token, auth.publicKey)
  })
```

The adapter preserves close semantics:

```ts
interface SocketRunOptions {
  readonly closeOnFailure: boolean
}

async function runSocket(
  socket: RealtimeSocket,
  program: Effect.Effect<void, RiftRealtimeError, RiftAppServices>,
  options: SocketRunOptions,
): Promise<void> {
  const exit = await Effect.runPromiseExit(Effect.provide(program, RiftRuntimeLayer))

  if (Exit.isFailure(exit) && options.closeOnFailure) {
    socket.close()
  }
}
```

Errors that currently close inside manager methods, such as duplicate mobile connect and send without peer, may remain handled inside `RealtimeLive` to avoid double-close. The boundary should close only unrecovered failures.

## Protocol-contract dual-export strategy

Current contract shape:

```ts
export const RiftOpcode = {
  OPEN: 1,
  MSG: 2,
  CLOSE: 3,
  CONNECT: 4,
  CONNECT_PUBKEY: 5,
  SEND: 6,
  REPLY: 7,
  RECEIVE: 8,
} as const

export type RiftOpcode = (typeof RiftOpcode)[keyof typeof RiftOpcode]
export type RiftFrame = [RiftOpcode, ...unknown[]]
```

### Decision

Keep the existing plain TypeScript exports exactly as they are, and add optional Effect-friendly exports alongside them. Do not change `main`, `types`, the package name, opcode values, or existing type names.

The dual export should be additive:

```ts
export const RiftOpcode = {
  OPEN: 1,
  MSG: 2,
  CLOSE: 3,
  CONNECT: 4,
  CONNECT_PUBKEY: 5,
  SEND: 6,
  REPLY: 7,
  RECEIVE: 8,
} as const

export type RiftOpcode = (typeof RiftOpcode)[keyof typeof RiftOpcode]
export type RiftFrame = [RiftOpcode, ...unknown[]]

export const RiftFrameSchema = Schema.Tuple(
  Schema.Literal(...Object.values(RiftOpcode)),
  Schema.Array(Schema.Unknown),
)

export type RiftFrameFromSchema = Schema.Schema.Type<typeof RiftFrameSchema>
```

If adding `effect` as a dependency to `packages/protocol-contract` would violate the current package convention of pure constants/types, use a subpath-free factory instead:

```ts
interface SchemaFactory<TSchema> {
  readonly opcode: (values: readonly RiftOpcode[]) => TSchema
  readonly frame: (opcodeSchema: TSchema) => TSchema
}

export function createRiftSchemas<TSchema>(factory: SchemaFactory<TSchema>) {
  const opcodeValues = Object.values(RiftOpcode)
  const opcode = factory.opcode(opcodeValues)
  return {
    opcode,
    frame: factory.frame(opcode),
  } as const
}
```

Preferred migration path:

1. Leave `RiftOpcode`, `MobileOpcode`, `RiftFrame`, `MobileFrame`, LCU constants, and all current re-exports untouched.
2. Add Effect-specific helpers only if `apps/rift-next` needs shared schema definitions.
3. Keep `apps/web-next` importing the existing plain exports with no code changes.
4. Add protocol contract tests asserting `RiftOpcode.RECEIVE === 8` and all existing numeric opcodes remain stable before rift implementation changes.

This avoids a forced Effect dependency on web consumers and keeps the package behavior-compatible with the current direct TS source export strategy.

## Migration order after this document

Implementation should proceed in behavior-preserving slices:

1. Add Effect dependency and app-level error/tag types in `apps/rift-next` only.
2. Introduce services and layers behind existing function exports.
3. Convert database operations to Effect while keeping `initializeDatabase`, `generateCode`, `lookup`, and `potentiallyUpdate` wrappers for compatibility during transition.
4. Convert auth and HTTP input parsing.
5. Convert realtime internals while keeping public method names until Elysia adapters are migrated.
6. Move `Effect.runPromise` to Elysia route and WebSocket adapters.
7. Only after rift tests pass, consider additive protocol-contract schemas or factories if they reduce duplication.

No implementation code should be written until this plan is reviewed or accepted by the migration owner.
