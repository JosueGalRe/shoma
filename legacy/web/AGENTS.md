# web KNOWLEDGE BASE

**Generated:** 2026-05-01

## OVERVIEW
Legacy mobile web UI for Mimic. Vue 2 + TypeScript + Stylus. Still functional but superseded by `web`.

## STRUCTURE
```
web/
├── src/
│   ├── main.ts               # Entry: registers components, mounts Vue app
│   ├── components/
│   │   ├── root/             # Connection shell + RiftSocket + SocketState
│   │   ├── lobby/            # Party/queue management
│   │   ├── champ-select/     # Pick/ban/runes/skins
│   │   ├── queue/            # In-queue overlay
│   │   ├── ready-check/      # Accept/decline alerts
│   │   └── invites/          # External invite handling
│   ├── static/               # Data Dragon assets, role icons, map images
│   └── constants.ts          # Data Dragon version + CDN URLs
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| App bootstrap | `src/main.ts` | Vue 2 global registration |
| Rift connection | `src/components/root/rift-socket.ts` | WebSocket + RSA/AES handshake |
| Root controller | `src/components/root/root.ts` | `observe()` / `request()` LCU proxy |
| Lobby logic | `src/components/lobby/lobby.ts` | Party members, invites, queue start |
| Champ select | `src/components/champ-select/champ-select.ts` | Pick/ban, runes, skins, reroll |
| Static assets | `src/static/` | Pulled from Riot Data Dragon CDN |

## CONVENTIONS
- **Framework:** Vue 2 with class-style components (`vue-class-component`)
- **Styling:** Stylus (not Tailwind)
- **Build:** Vue CLI (`yarn serve`, `yarn build`)
- **Excluded from modern lint/format:** `web/` is ignored by ESLint and Oxlint configs

## ANTI-PATTERNS
- Do not add new features here; target `web` instead
- `tsconfig.json` is legacy (`target: es5`, `moduleResolution: node`, `experimentalDecorators`)
