# Deploy Leyline to Railway

## Quick Start

```bash
# Login to Railway
railway login

# Create/link project
railway link

# Set required env vars
railway variables set LEYLINE_JWT_SECRET="your-secret-here"
railway variables set PORT=8080

# Deploy
railway up
```

## What Railway auto-detects

- `Dockerfile.leyline` — Docker builder (via `railway.toml`)
- `railway.toml` — deploy config with healthcheck on `/health/protocol`
- Exposed port `8080` (Railway maps to a public URL automatically)

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LEYLINE_JWT_SECRET` | ✅ | — | JWT signing secret |
| `PORT` | ❌ | `8080` | HTTP server port |
| `HOSTNAME` | ❌ | `0.0.0.0` | Bind address |
| `LEYLINE_DB_PATH` | ❌ | `/data/database.db` | SQLite database path |
| `LOG_LEVEL` | ❌ | `info` | Pino log level |

## SQLite Persistence (Important)

Railway's filesystem is ephemeral. To persist the SQLite database across deploys:

1. Go to your service dashboard → **Volumes**
2. Add a volume with mount path `/data`
3. The default `LEYLINE_DB_PATH=/data/database.db` will use it automatically

Without a volume, the database resets on every deploy/restart.

## Health Check

Railway pings `/health/protocol` every few seconds. The endpoint returns:

```json
{ "relayOpcodesLoaded": true }
```

If healthchecks fail, Railway auto-restarts the container.

## Monorepo Note

This Dockerfile only copies the files needed for leyline + its workspace dependency (`@shoma/protocol-contract`). The rest of the monorepo is excluded via `.dockerignore` to keep the build fast.

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
