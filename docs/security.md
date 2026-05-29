# Security Policy

## Dependabot Alert Handling

### Legacy Code (`legacy/web`, `legacy/rift`, `legacy/conduit`)

Legacy applications are **preserved as historical reference only**. They are not:

- Built, served, or deployed in CI/CD (`conduit` workflow only touches modern stack)
- Included in the pnpm workspace (`pnpm-workspace.yaml` excludes `legacy/*`)
- Referenced in Docker, Railway, Vercel, or release scripts
- Executed in production or development environments

All Dependabot alerts for legacy dependencies have been reviewed and dismissed with reason **`tolerable_risk`** (previously `not_used`). The rationale: legacy code is reference-only and not deployed, so runtime exploitation is not possible. Individual dependencies may still be technically "used" within legacy source (e.g., `ws`, `jsonwebtoken`, `node-rsa`, `System.Net.Http`), but the containing applications have no active execution path.

#### Exceptions requiring attention

- **`node-rsa`** in `legacy/web` is a runtime dependency for RSA handshake encryption. Webpack 4 may bundle crypto polyfills (`sha.js`, `cipher-base`, `pbkdf2`, `elliptic`). While the static app is not served, this is the one edge case where "not used" was imprecise. Dismissed as `tolerable_risk` with explicit note.
- **`ws`**, **`jsonwebtoken`**, **`jws`**, **`body-parser`** in `legacy/rift` are runtime dependencies for an Express/WebSocket server. `legacy/rift` is not deployed, so risk is tolerated.
- **`System.Drawing.Common`** and **`System.Net.Http`** in `legacy/conduit` are referenced in the WPF project. The application is not built or distributed.

### Modern Stack (`loom`, `leyline`, `conduit`)

#### Resolved

- **vite false positives** (alerts #217–#229): Dependabot flags `vite` in `loom/package.json` at `^0.1.20`. The workspace overrides this to `@voidzero-dev/vite-plus-core@0.1.22` via `pnpm-workspace.yaml`. These alerts were dismissed as **`inaccurate`**.

#### Active

| Package | Version | Severity | Advisory | Status |
|---|---|---|---|---|
| `rustls-webpki` | `0.102.8` | **HIGH** | GHSA-82j2-j2ch-gfr8 | **OPEN** — blocked by `irelia` upstream |
| `rustls-webpki` | `0.102.8` | MEDIUM | GHSA-pwjx-qhcg-rvj4 | **OPEN** — blocked by `irelia` upstream |
| `rustls-webpki` | `0.102.8` | LOW | GHSA-965h-392x-2mh5 | **OPEN** — blocked by `irelia` upstream |
| `rustls-webpki` | `0.102.8` | LOW | GHSA-xgp8-3hg3-c2mh | **OPEN** — blocked by `irelia` upstream |
| `glib` | `0.18.5` | MEDIUM | GHSA-wrw7-89jp-8q8g | **OPEN** — transitive Tauri/GTK dep |

#### rustls-webpki

`rustls-webpki@0.102.8` is pulled in by `irelia@0.11.2` (via `^0.102.4`). `irelia` is a build dependency that uses `rustls-webpki` during code generation (`build.rs`). The latest `irelia` release (`0.11.2`, 2026-05-14) still pins `rustls-webpki ^0.102.4`. We have aligned `Cargo.toml` to `irelia = "0.11.2"`, but this does not resolve the advisory.

**Options to resolve:**

1. Wait for `irelia` upstream to bump `rustls-webpki` to `^0.103.13` (issue/PR recommended).
2. Fork `irelia` and patch its `Cargo.toml`, then use `[patch.crates-io]`.
3. Accept risk: `irelia` is only used for LCU local connections (`127.0.0.1`) during build-time code generation. The runtime attack surface for TLS certificate validation in this context is negligible.

We recommend option 1 (upstream fix) with option 3 (documented acceptance) as interim.

#### glib

`glib@0.18.5` is a transitive dependency of Tauri on Linux/GTK. The vulnerability (GHSA-wrw7-89jp-8q8g) is an unsoundness issue in `Iterator`/`DoubleEndedIterator` impls. Updating requires verifying Tauri GTK compatibility; tracked as open until `cargo update` resolves it safely.

## pnpm audit

```bash
pnpm audit --prod
```

Runs clean on the modern workspace. Legacy directories are excluded from the pnpm workspace and therefore not audited by this command.

## Cargo audit

```bash
cd conduit/src-tauri && cargo audit
```

Reports the open `rustls-webpki` and `glib` advisories above. All others are resolved or dismissed.

## Last Review

- **Date:** 2026-05-29
- **Alerts reviewed:** 195 legacy + 12 vite false positives + 5 modern open
- **Dismissals renamed:** 172 from `not_used` → `tolerable_risk`
