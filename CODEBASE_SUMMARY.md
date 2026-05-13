# Sho'ma Codebase Summary

## 1) What this project is

Sho'ma (formerly Mimic) is a remote-control experience for the League of Legends client (LCU):

- A **Windows desktop agent** (`conduit`) runs alongside League and talks to the local LCU API/WebSocket.
- A **relay backend** (`leyline`, formerly `rift`) brokers connectivity between phone browsers and desktop agents without exposing desktop machines directly.
- A **mobile-first web app** (`loom`, formerly `web`) is what users open on their phone to control lobby, queue, ready check, and champion select.

Top-level description and component split are documented in @README.md#6-22.

---

## 2) Monorepo layout and stack

### Repository layout

- `loom/` → React 19 + Vite + TanStack Router frontend (@loom/package.json)
- `leyline/` → Elysia + Bun + Effect-TS relay server (@leyline/package.json)
- `conduit/` → Tauri v2 + Rust desktop bridge (@conduit/src-tauri/src/main.rs)

### Key runtime endpoints

- Conduit is configured to connect to:
  - `wss://leyline.shoma.lol/conduit`
  - `https://leyline.shoma.lol`
- Loom client connects to `wss://leyline.shoma.lol/mobile?code=...`

---

## 3) System architecture and end-to-end flow

## High-level sequence

1. **Conduit starts** in Windows tray, monitors League process, and connects to local LCU when available.
2. Conduit obtains/validates a JWT + 6-digit code from Leyline (`/register`, `/check`) and opens its hub websocket.
3. **Phone web app** (Loom) asks Leyline to connect to a code (`CONNECT` op), gets Conduit public key if available, performs encrypted identity handshake.
4. Leyline bridges messages between that mobile socket and the target Conduit socket using per-peer UUIDs.
5. Conduit prompts desktop user to allow/deny unknown devices, then all payloads become AES-encrypted end-to-end between phone and Conduit.
6. Phone sends LCU requests/subscriptions through Conduit; Conduit executes against local LCU and streams updates back.

Important design point: Leyline is intentionally a **tunnel + code registry**, not a plaintext inspector of game traffic (@README.md#21-22).

---

## 4) Component deep dive

## A) `leyline` (relay + registration authority)

### Entrypoint and startup

- Entrypoint is @leyline/src/index.ts.
- Requires `LEYLINE_JWT_SECRET` env var before start.
- Initializes SQLite and starts one HTTP server that also handles WebSocket upgrades.

### HTTP API responsibilities

- `GET /` → health-ish text response.
- `POST /register`:
  - requires `pubkey`
  - returns `{ ok, token }` where token contains `code` signed with JWT secret.
- `GET /check?token=...`:
  - verifies JWT
  - confirms the embedded code still exists in DB.

### Database model

SQLite table `conduit_instances(code PRIMARY KEY, public_key)`.

Core behaviors:

- `generateCode(pubkey)` returns existing code for same pubkey or creates unique 6-digit code.
- `lookup(code)` resolves public key for mobile handshake.
- `potentiallyUpdate(code, pubkey)` rotates pubkey for an existing code during conduit reconnect.

### WebSocket broker model

Two upgrade paths:

- `/conduit`: authenticated conduit host connections, JWT + pubkey verified.
- `/mobile`: phone/browser clients.

State maps:

- `code -> conduit socket`
- `conduit socket -> [mobile peers]`
- `mobile socket -> conduit+peer metadata`

Opcode protocol shape is centralized in the shared protocol package.

---

## B) `conduit` (desktop bridge to local LCU)

### Entrypoint and app shell

- App entrypoint: @conduit/src-tauri/src/main.rs.
- Tauri app builds tray icon UI, settings, notifications, and manager startup.
- Displays current 6-digit access code in tray menu.

### Persistence and identity

`Persistence` stores under `%APPDATA%/Shoma`:

- hub JWT token
- RSA keypair
- approved device IDs
- startup registry toggle

### League client connectivity

`LeagueConnection` does all LCU-facing I/O:

- detects League process and auth token/port using process + WMI command line parsing.
- configures local HTTPS auth (`riot:<token>`) and websocket subscribe to `OnJsonApiEvent`.
- exposes events `OnConnected`, `OnDisconnected`, `OnWebsocketEvent` and request helpers for HTTP + websocket updates.

Reconnect strategy:

- polls and retries connection with delay on startup/disconnect.

### Hub/leyline connection management

`ConnectionManager` orchestrates:

- waiting for League connection first
- validating/reissuing JWT token via Leyline APIs
- opening/closing hub websocket
- immediate then backoff reconnect attempts

### Mobile peer handling and encryption

- Hub socket handler receives `Open/Message/Close` opcodes and creates one `MobileConnectionHandler` per peer UUID.
- `MobileConnectionHandler` performs handshake (`SECRET`/`SECRET_RESPONSE`), approval prompt for unknown devices, and AES wrapping for post-handshake traffic.
- User approval dialog is a dedicated prompt.
- Cryptography helpers:
  - RSA decrypt/public key export
  - AES encrypt/decrypt with random IV

### Desktop UX

- About/settings window shows QR code (`https://remote.shoma.lol/<code>`) and allows startup toggle/uninstall.
- Notifications surface initial guidance and connection status.

---

## C) `loom` (phone UI + local app protocol client)

### Entrypoint and app shell

- Bootstraps React app and global UI components in @loom/src/main.tsx.
- Registers PWA service worker in production.
- Root component toggles between connection screen and control surface.

### Connection and transport

`LeylineSocket` (custom WebSocket-like wrapper) manages:

- connecting to Leyline `/mobile` endpoint
- requesting conduit pubkey by code
- RSA-encrypted identity + generated AES session key
- encrypted message send/receive after approval

### Root protocol client responsibilities

`Root` component is effectively the app’s internal transport/service layer:

- `observe(path, handler)` subscribes to LCU path regex through conduit
- `request(path, method, body)` sends one-off LCU requests with request IDs
- incoming websocket packets dispatch to observer handlers or request promises

### Functional game features in UI

Implemented as reactive observers on LCU endpoints:

- **Lobby management**: party members, invites, roles, queue start, kick/promote, etc.
- **Queue state**: in-queue overlay, leave queue.
- **Ready check**: accept/decline, audio + vibration alerts.
- **Received invites**: accept/decline external invites.
- **Champion select**: pick/ban state, summoners, runes, skins, reroll points, overlays.

### Static and metadata dependencies

- Pulls latest Data Dragon version and static datasets from Riot CDN.
- Device fingerprint-ish local ID and human-readable device/browser description used for approval UX.

---

## 5) Protocols and message semantics

There are two layered protocols:

1. **Leyline broker opcodes** (`OPEN`, `MSG`, `CLOSE`, `CONNECT`, etc.) across mobile↔leyline↔conduit tunnel.
2. **Mobile/Conduit app opcodes** (`SECRET`, `REQUEST`, `UPDATE`, `RESPONSE`, etc.) carried inside encrypted payload after handshake.

Net effect:

- Leyline routes packets by code and peer UUID.
- Conduit interprets payloads as LCU operations/events.
- Loom UI maps those operations into reactive gameplay controls.

---

## 6) Security model (as implemented)

### Intended security properties

- Desktop identity bound to a 6-digit code + JWT-managed registration.
- Mobile-to-conduit payload confidentiality via negotiated AES key; Leyline only transports ciphertext after handshake.
- New devices require explicit desktop approval once (persisted allow-list).

### Practical caveats visible in code

- The 6-digit code is short by design (usability tradeoff).
- Conduit-LCU TLS cert checks are bypassed because LCU uses local certs.
- AES mode used is CBC without explicit integrity/MAC in protocol framing.

---

## 7) Runtime behavior and resilience

- Conduit continuously attempts League reconnection and separately manages hub reconnection with immediate + delayed retry strategy.
- Leyline pings both mobile and conduit clients every 10s to keep sockets alive.
- On conduit disconnect, Leyline closes linked mobile peers and clears maps to avoid stale references.

---

## 8) Build/development notes

- `loom`: `bun run dev`, `bun run build`.
- `leyline`: `bun run dev`, `bun run build`.
- `conduit`: Tauri v2 + Rust workflow.

---

## 9) Bottom-line summary

Sho'ma is a three-tier remote-control platform for League Client UX:

- **Conduit** is the trusted local bridge to LCU on the PC.
- **Leyline** is the internet-facing rendezvous and websocket tunnel service.
- **Loom** is the phone client that presents a complete game-flow UI and sends LCU actions through encrypted conduit sessions.

Architecturally, the most important idea is that **Leyline handles identity/routing, while Conduit and Loom own the sensitive session payloads**.
