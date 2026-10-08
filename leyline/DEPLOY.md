# Deploy Leyline

Leyline runs as a Docker Compose service on a self-hosted VPS, behind nginx with a Let's Encrypt certificate at `https://api.shoma.lol`.

## What's in the repo

- `Dockerfile.leyline` (root) — image with only leyline and its workspace dependency (`@shoma/protocol-contract`); the rest of the monorepo is excluded via `.dockerignore`.
- `compose.yml` (root) — service `leyline`: binds `127.0.0.1:3080 → 8080` (only the reverse proxy reaches it), named volume `data` on `/data`, `NODE_ENV=production`, log rotation.
- `.github/workflows/leyline.yml` — deploys on pushes to `main` that touch leyline, `packages/protocol-contract`, the Dockerfile, `compose.yml` or root package files. It also runs manually.

## Environment Variables

Set in `.env` next to `compose.yml` (gitignored, dockerignored):

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LEYLINE_JWT_SECRET` | ✅ | — | JWT signing secret. Keep it stable: rotating it invalidates issued tokens |
| `PORT` | ❌ | `8080` | HTTP server port inside the container |
| `HOSTNAME` | ❌ | `0.0.0.0` | Bind address |
| `LEYLINE_DB_PATH` | ❌ | `/data/database.db` | SQLite database path |
| `LOG_LEVEL` | ❌ | `info` | Pino log level |

## SQLite Persistence

`conduit_instances` maps each Conduit public key to its stable 6-digit code. It lives on the `data` volume, so it survives rebuilds. Losing it means every Conduit gets a new code and mobile clients have to pair again. To move it to another host, copy `/data/database.db` into the new container before starting it (`docker compose up --no-start`, `docker cp`, `docker compose start`).

## Reverse Proxy

The proxy must forward WebSocket upgrades for `/conduit` and `/mobile` (`Upgrade` / `Connection` headers, HTTP/1.1). Its read timeout must also outlast idle sockets; nginx's 60 s default drops them. With Cloudflare DNS, keep the record **DNS only** so HTTP-01 renewals reach the origin.

## Deploys

The workflow SSHes into the server with a key restricted to a forced command, which runs `git pull --ff-only` and `docker compose up -d --build` in the checkout. Required repository secrets: `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`, `DEPLOY_HOST`, `DEPLOY_PORT`.

Server setup, firewall and TLS details live in the private infra runbook.

## Logging

Leyline emits one JSON object per line to stdout when `NODE_ENV=production` (pino-pretty is dev-only). Read them with `docker compose logs -f leyline`. Shape:

```json
{"level":"info","time":1785428340616,"scope":"relay","service":"leyline","code":"ABC123","peerId":"peer-1","event":"mobile_connect_attached","message":"mobile_connect_attached"}
```

- `level` / `message` — string level and the event name.
- `event` — machine-readable event name (`conduit_open`, `mobile_connect_attached`, ...). Same value as `message`.
- `service` on every line. `env` / `commit` / `replica` only appear when the `RAILWAY_*` variables are set, which they aren't on the VPS.
- `code` / `peerId` — connection context, inherited via pino child loggers on every log emitted during a WS connection lifecycle.
- `err` — serialized error (`type`/`message`/`stack`) on failure events.
- Anything else (`conduitCount`, `detachedPeers`, `reason`, `durationMs`, ...) is event-specific context.

Filter with jq, e.g. `docker compose logs --no-log-prefix leyline | jq -R 'fromjson? | select(.code == "ABC123")'`. The `authorization` header is redacted from HTTP request logs.

## Health Check

`GET /health/protocol` returns:

```json
{ "relayOpcodesLoaded": true }
```

Compose restarts the container if the process exits. Nothing polls the endpoint automatically.

## Downstream Environment Variables

### Loom (Vercel)

Set these in your Vercel project settings:

| Variable | Value |
|----------|-------|
| `VITE_LEYLINE_HTTP_BASE_URL` | `https://api.shoma.lol` |
| `VITE_LEYLINE_WS_BASE_URL` | `wss://api.shoma.lol` |

Or commit `loom/.env.production` with these values (already done).

### Conduit (Desktop App)

Conduit reads the API URL at runtime from:
1. Command-line args (`--leyline-http-url`, `--leyline-ws-url`)
2. Environment variables (`LEYLINE_HUB_HTTP_URL`, `LEYLINE_HUB_WS_URL`)
3. An `.env` file next to the executable

GitHub Actions workflows already set defaults:
- `LEYLINE_HUB_HTTP_URL=https://api.shoma.lol`
- `LEYLINE_HUB_WS_URL=wss://api.shoma.lol`

End-users can override by setting env vars before launching the app.
