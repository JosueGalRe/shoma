# Task 1 Rift Smoke Deltas

Date: 2026-05-03

## Configuration resolved

- `apps/rift-next/package.json`: `dev` script is `bun --watch src/index.ts`.
- `apps/rift-next/.env`: `RIFT_JWT_SECRET=mimic-secret-key-2024`.
- `apps/rift-next/src/core/config/env-config.ts`: default `PORT` is `51001`.
- `apps/conduit-next/package.json`: desktop dev script is `cargo tauri dev`.
- `apps/conduit-next/src-tauri/src/manager.rs`: `/register` posts `{ "pubkey": publicKey }` and returns a JWT.
- `apps/conduit-next/src-tauri/src/rift/hub.rs`: conduit websocket default is `ws://localhost:51001/conduit` with `token` and `publicKey` query params.
- `apps/web-next/src/core/rift/rift-client.ts`: web opens `/mobile` and sends `[4, code]`; the `code` query param is not used by the active protocol.

## Service state

- A rift-next dev server was already running on port `51001` as PID `241432` from `bun run dev:rift-next --host`.
- The smoke task also started `bun run --filter @mimic/rift-next dev`, creating a duplicate listener on `51001` (PID `265027`). To avoid nondeterministic results, only the smoke-started parent/child PIDs were stopped. The pre-existing rift listener remained running.
- After cleanup, `ss -ltnp 'sport = :51001'` showed a single listener: `bun`, PID `241432`.

## Acceptance criteria

| Criterion | Result | Evidence |
| --- | --- | --- |
| `curl http://localhost:PORT/` returns health response | PASS | `curl http://localhost:51001/` returned `Hai, rifto desu.` |
| Conduit-next obtains JWT token from `/register` | PASS for endpoint behavior; inferred for live conduit code | Direct `/register` returned `{"ok":true,"token":"..."}` and `/check` returned `true`. Live code `426729` resolved to a conduit public key, which requires a registered code entry and attached conduit. |
| Conduit-next connects to `/conduit` websocket successfully | PASS for live attach; PASS in relay control | Live mobile attach for code `426729` returned `[5, "<392-char public key>"]`. Relay control connected a temporary conduit websocket and received `OPEN`. |
| Web-next connects to `/mobile?code=426729` and completes handshake | PARTIAL | `ws://localhost:51001/mobile?code=426729` opened, but the active protocol still required sending `[4, "426729"]`. It returned a public key. Encrypted desktop approval did not complete within 30s. |
| Encrypted test message round-trips successfully | PASS for relay/control conduit; FAIL for live desktop approval path | Temporary protocol-compatible conduit completed RSA/AES handshake and decrypted `[3]`, then mobile decrypted `[4,"0.1.0","smoke-host"]`. Live conduit did not return `SECRET_RESPONSE` within 30s after sending `SECRET`. |
| All findings documented | PASS | This file plus `task-1-rift-smoke-happy.log` and `task-1-rift-smoke-error.log`. |

## Happy-path evidence summary

```text
curl http://localhost:51001/
=> Hai, rifto desu.

curl http://localhost:51001/health/protocol
=> {"riftOpcodesLoaded":true}

/register smoke check
=> {"ok":true,"token":"<jwt>"}
/check?token=<jwt>
=> true

Live mobile attach:
=> mobile open
=> mobile message [5,"MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A..."]

Relay-level encrypted control:
=> registered smoke conduit code 960103 token ok true
=> conduit websocket open
=> mobile pubkey frame [5,true]
=> conduit open frame opcode 1 peer id type string
=> mobile secret ack [8,[2,true]]
=> conduit decrypted mobile payload [3]
=> mobile decrypted reply [4,"0.1.0","smoke-host"]
```

## Failure / delta evidence

```text
Initial duplicate listener state after starting smoke rift:
LISTEN *:51001 users:(("bun",pid=241432,...))
LISTEN *:51001 users:(("bun",pid=265027,...))

Action taken:
- Stopped only smoke-started PIDs 265026/265027.
- Left pre-existing rift PID 241432 running.

Live encrypted handshake attempt:
=> opened /mobile?code=426729
=> pubkey frame [5,"string",392]
=> error: timeout waiting for websocket message

Interpretation:
- Rift route and live conduit public-key attachment work.
- After sending `[SEND, [SECRET, encryptedIdentity]]`, no `[RECEIVE, [SECRET_RESPONSE, true|false]]` arrived within 30 seconds.
- Conduit code requests desktop approval for unapproved identities before sending `SECRET_RESPONSE`; this smoke run could not confirm the live desktop approval interaction.
```

## Overall conclusion

Rift-next is reachable and healthy on `51001`. Registration/JWT validation works. A live conduit for code `426729` was reachable at least through the public-key attachment stage. The rift websocket tunnel and encrypted message round-trip were verified with a protocol-compatible temporary conduit using the same `/register`, `/conduit`, and `/mobile` routes.

The only unmet live-pipeline criterion is the actual conduit-next desktop approval/encrypted round-trip: the desktop bridge did not return `SECRET_RESPONSE` within 30 seconds for the smoke identity. This should be treated as an integration delta, not a proven rift relay failure, because the relay-level encrypted control passed.
