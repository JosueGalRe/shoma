# Mimic Codebase Summary

## 1) What this project is

Mimic is a remote-control experience for the League of Legends client (LCU):

- A **Windows desktop agent** (`conduit`) runs alongside League and talks to the local LCU API/WebSocket.
- A **relay backend** (`rift`) brokers connectivity between phone browsers and desktop agents without exposing desktop machines directly.
- A **mobile-first web app** (`web`) is what users open on their phone to control lobby, queue, ready check, and champion select.

Top-level description and component split are documented in @README.md#6-22.

---

## 2) Monorepo layout and stack

### Repository layout

- `web/` → Vue 2 + TypeScript + Stylus frontend (@web/package.json#1-29)
- `rift/` → Node.js + Express + TypeScript + ws + SQLite relay server (@rift/package.json#1-37, @rift/src/index.ts#1-23)
- `conduit/` → C#/.NET Framework 4.6.1 WPF tray app with websocket-sharp (@conduit/Conduit.csproj#1-167)

### Key runtime endpoints

- Conduit is configured to connect to:
  - `wss://rift.mimic.lol/conduit`
  - `https://rift.mimic.lol`
    via constants in @conduit/Program.cs#10-12.
- Web client connects to `wss://rift.mimic.lol/mobile?code=...` in @web/src/components/root/rift-socket.ts#22-27.

---

## 3) System architecture and end-to-end flow

## High-level sequence

1. **Conduit starts** in Windows tray, monitors League process, and connects to local LCU when available (@conduit/App.xaml.cs#53-61, @conduit/ConnectionManager.cs#27-44, @conduit/LeagueConnection.cs#75-108).
2. Conduit obtains/validates a JWT + 6-digit code from Rift (`/register`, `/check`) and opens its hub websocket (@conduit/ConnectionManager.cs#68-94, @rift/src/web.ts#18-57).
3. **Phone web app** asks Rift to connect to a code (`CONNECT` op), gets Conduit public key if available, performs encrypted identity handshake (@web/src/components/root/rift-socket.ts#51-76, #97-126).
4. Rift bridges messages between that mobile socket and the target Conduit socket using per-peer UUIDs (@rift/src/sockets.ts#204-242, #149-171).
5. Conduit prompts desktop user to allow/deny unknown devices, then all payloads become AES-encrypted end-to-end between phone and Conduit (@conduit/MobileConnectionHandler.cs#65-110, @conduit/CryptoHelpers.cs#43-98).
6. Phone sends LCU requests/subscriptions through Conduit; Conduit executes against local LCU and streams updates back (@web/src/components/root/root.ts#98-143, @conduit/MobileConnectionHandler.cs#116-158, @conduit/LeagueConnection.cs#148-166).

Important design point: Rift is intentionally a **tunnel + code registry**, not a plaintext inspector of game traffic (@README.md#21-22, @rift/README.md#3-5).

---

## 4) Component deep dive

## A) `rift` (relay + registration authority)

### Entrypoint and startup

- Entrypoint is @rift/src/index.ts#1-23.
- Requires `LEYLINE_JWT_SECRET` env var before start (@leyline/src/index.ts#8-11).
- Initializes SQLite and starts one HTTP server that also handles WebSocket upgrades (@rift/src/index.ts#14-21).

### HTTP API responsibilities

Defined in @rift/src/web.ts#13-57:

- `GET /` → health-ish text response.
- `POST /register`:
  - requires `pubkey`
  - returns `{ ok, token }` where token contains `code` signed with JWT secret.
- `GET /check?token=...`:
  - verifies JWT
  - confirms the embedded code still exists in DB.

### Database model

SQLite table `conduit_instances(code PRIMARY KEY, public_key)` in @rift/src/database.ts#15-22.

Core behaviors:

- `generateCode(pubkey)` returns existing code for same pubkey or creates unique 6-digit code (@rift/src/database.ts#30-50).
- `lookup(code)` resolves public key for mobile handshake (@rift/src/database.ts#56-61).
- `potentiallyUpdate(code, pubkey)` rotates pubkey for an existing code during conduit reconnect (@rift/src/database.ts#67-76).

### WebSocket broker model

Implemented in @rift/src/sockets.ts#25-252.

Two upgrade paths:

- `/conduit`: authenticated conduit host connections, JWT + pubkey verified in `verifyConduitClient` (@rift/src/sockets.ts#82-112).
- `/mobile`: phone/browser clients.

State maps:

- `code -> conduit socket`
- `conduit socket -> [mobile peers]`
- `mobile socket -> conduit+peer metadata`

These maps are maintained in @rift/src/sockets.ts#29-32 and lifecycle logic around @rift/src/sockets.ts#119-199.

Opcode protocol shape is centralized in @rift/src/types.ts#15-39.

---

## B) `conduit` (desktop bridge to local LCU)

### Entrypoint and app shell

- App entrypoint: @conduit/Program.cs#15-22.
- WPF app builds tray icon UI, settings, notifications, and manager startup in @conduit/App.xaml.cs#14-63.
- Displays current 6-digit access code in tray menu via persisted token decode (@conduit/App.xaml.cs#67-78, @conduit/Persistence.cs#52-62).

### Persistence and identity

`Persistence` stores under `%APPDATA%/Mimic`:

- hub JWT token
- RSA keypair
- approved device IDs
- startup registry toggle

See @conduit/Persistence.cs#17-23 and associated methods:

- token read/write (@conduit/Persistence.cs#34-73)
- approved devices list (@conduit/Persistence.cs#78-111)
- autostart registry integration (@conduit/Persistence.cs#116-141)
- RSA keypair load/generate (@conduit/Persistence.cs#147-185)

### League client connectivity

`LeagueConnection` does all LCU-facing I/O:

- detects League process and auth token/port using process + WMI command line parsing (@conduit/LeagueUtils.cs#21-54)
- configures local HTTPS auth (`riot:<token>`) and websocket subscribe to `OnJsonApiEvent` (@conduit/LeagueConnection.cs#87-101)
- exposes events `OnConnected`, `OnDisconnected`, `OnWebsocketEvent` and request helpers for HTTP + websocket updates (@conduit/LeagueConnection.cs#26-33, #148-166, #230-238)

Reconnect strategy:

- polls and retries connection with delay on startup/disconnect (@conduit/LeagueConnection.cs#120-127, #132-143).

### Hub/rift connection management

`ConnectionManager` orchestrates:

- waiting for League connection first
- validating/reissuing JWT token via Rift APIs
- opening/closing hub websocket
- immediate then backoff reconnect attempts

Core flow in @conduit/ConnectionManager.cs#51-112 and reconnect logic in @conduit/ConnectionManager.cs#135-155.

### Mobile peer handling and encryption

- Hub socket handler receives `Open/Message/Close` opcodes and creates one `MobileConnectionHandler` per peer UUID (@conduit/HubConnectionHandler.cs#74-103).
- `MobileConnectionHandler` performs handshake (`SECRET`/`SECRET_RESPONSE`), approval prompt for unknown devices, and AES wrapping for post-handshake traffic (@conduit/MobileConnectionHandler.cs#47-111).
- User approval dialog is a dedicated WPF prompt (@conduit/DeviceConnectionPrompt.xaml.cs#10-46).
- Cryptography helpers:
  - RSA decrypt/public key export (@conduit/CryptoHelpers.cs#19-38)
  - AES encrypt/decrypt with random IV (@conduit/CryptoHelpers.cs#43-98)

### Desktop UX

- About/settings window shows QR code (`https://remote.mimic.lol/<code>`) and allows startup toggle/uninstall (@conduit/AboutWindow.xaml.cs#34-49, #72-94).
- Notifications surface initial guidance and connection status (@conduit/App.xaml.cs#57-61, #83-88).

---

## C) `web` (phone UI + local app protocol client)

### Entrypoint and app shell

- Bootstraps Vue app and global UI components in @web/src/main.ts#1-13.
- Registers PWA service worker in production (@web/src/registerServiceWorker.ts#1-5).
- Root component toggles between connection screen and control surface (@web/src/components/root/root.vue#1-25).

### Connection and transport

`RiftSocket` (custom WebSocket-like wrapper) manages:

- connecting to Rift `/mobile` endpoint
- requesting conduit pubkey by code
- RSA-encrypted identity + generated AES session key
- encrypted message send/receive after approval

See @web/src/components/root/rift-socket.ts#22-27, #51-76, #97-126, #132-170.

`SocketState` component handles UX for states:

- enter code
- offline/invalid code
- denied approval
- connecting/handshaking

(@web/src/components/root/socket-state.vue#1-60, #103-117)

### Root protocol client responsibilities

`Root` component is effectively the app’s internal transport/service layer:

- `observe(path, handler)` subscribes to LCU path regex through conduit
- `request(path, method, body)` sends one-off LCU requests with request IDs
- incoming websocket packets dispatch to observer handlers or request promises

Key implementation in @web/src/components/root/root.ts#98-143 and #149-167.

### Functional game features in UI

Implemented as reactive observers on LCU endpoints:

- **Lobby management**: party members, invites, roles, queue start, kick/promote, etc. (@web/src/components/lobby/lobby.ts#77-129, #198-250)
- **Queue state**: in-queue overlay, leave queue (@web/src/components/queue/queue.ts#24-56)
- **Ready check**: accept/decline, audio + vibration alerts (@web/src/components/ready-check/ready-check.ts#20-62, #87-98)
- **Received invites**: accept/decline external invites (@web/src/components/invites/invites.ts#22-73)
- **Champion select**: pick/ban state, summoners, runes, skins, reroll points, overlays (@web/src/components/champ-select/champ-select.ts#154-249 and #251-343)

### Static and metadata dependencies

- Pulls latest Data Dragon version and static datasets from Riot CDN (@web/src/constants.ts#1-17, @web/src/components/champ-select/champ-select.ts#330-341).
- Device fingerprint-ish local ID and human-readable device/browser description used for approval UX (@web/src/util/device.ts#29-64).

---

## 5) Protocols and message semantics

There are two layered protocols:

1. **Rift broker opcodes** (`OPEN`, `MSG`, `CLOSE`, `CONNECT`, etc.) across mobile↔rift↔conduit tunnel (@rift/src/types.ts#15-39, @rift/src/sockets.ts#208-242).
2. **Mobile/Conduit app opcodes** (`SECRET`, `REQUEST`, `UPDATE`, `RESPONSE`, etc.) carried inside encrypted payload after handshake (@web/src/components/root/rift-socket.ts#221-248, @conduit/MobileConnectionHandler.cs#161-189).

Net effect:

- Rift routes packets by code and peer UUID.
- Conduit interprets payloads as LCU operations/events.
- Web UI maps those operations into reactive gameplay controls.

---

## 6) Security model (as implemented)

### Intended security properties

- Desktop identity bound to a 6-digit code + JWT-managed registration (@rift/src/web.ts#18-57).
- Mobile-to-conduit payload confidentiality via negotiated AES key; Rift only transports ciphertext after handshake (@web/src/components/root/rift-socket.ts#32-46, @conduit/CryptoHelpers.cs#70-98).
- New devices require explicit desktop approval once (persisted allow-list) (@conduit/MobileConnectionHandler.cs#78-109, @conduit/Persistence.cs#78-111).

### Practical caveats visible in code

- The 6-digit code is short by design (usability tradeoff).
- Conduit-LCU TLS cert checks are bypassed (`ServerCertificateCustomValidationCallback = true`) because LCU uses local certs (@conduit/LeagueConnection.cs#45-56, #95).
- AES mode used is CBC without explicit integrity/MAC in protocol framing (@web/src/components/root/rift-socket.ts#38-45, @conduit/CryptoHelpers.cs#49-56).

---

## 7) Runtime behavior and resilience

- Conduit continuously attempts League reconnection and separately manages hub reconnection with immediate + delayed retry strategy (@conduit/LeagueConnection.cs#120-127, @conduit/ConnectionManager.cs#143-152).
- Rift pings both mobile and conduit clients every 10s to keep sockets alive (@rift/src/sockets.ts#43-52).
- On conduit disconnect, Rift closes linked mobile peers and clears maps to avoid stale references (@rift/src/sockets.ts#132-141).

---

## 8) Build/development notes

- `web`: `yarn serve`, `yarn build` (@web/README.md#7-15).
- `rift`: `yarn start`, `yarn watch`, TypeScript compile to `dist/` (@rift/package.json#10-14, @rift/README.md#11-15).
- `conduit`: Visual Studio / NuGet workflow for .NET Framework WPF app (@conduit/README.md#5-8).

---

## 9) Bottom-line summary

Mimic is a three-tier remote-control platform for League Client UX:

- **Conduit** is the trusted local bridge to LCU on the PC.
- **Rift** is the internet-facing rendezvous and websocket tunnel service.
- **Web** is the phone client that presents a complete game-flow UI and sends LCU actions through encrypted conduit sessions.

Architecturally, the most important idea is that **Rift handles identity/routing, while Conduit and Web own the sensitive session payloads**.
