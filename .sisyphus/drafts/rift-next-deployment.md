# Draft: Deployment Architecture for rift-next

## Requirements (confirmed)
- User wants to deploy rift-next (Elysia + Bun + SQLite) to production
- Considering Cloudflare or Vercel
- Wants help investigating deployment options
- Load: < 100 concurrent users
- Persistencia crítica: los códigos de registro deben sobrevivir a reinicios

## Technical Context
- Runtime: Bun (bun src/index.ts)
- Framework: Elysia (HTTP + WebSocket)
- DB: SQLite via `bun:sqlite` (single table: `conduit_instances`)
- Current deployment: none (local dev only)

## Open Questions
- Can Elysia run on Cloudflare Workers? (Elysia depends on Bun APIs)
- Does Vercel support Bun runtime?
- What Bun-specific APIs are used in the codebase?
- Is WebSocket support needed? (Yes, `/conduit` and `/mobile` endpoints)
- What's the simplest production deployment for this use case?

## Potential Options to Evaluate
1. **VPS/Dedicated Server** (Easiest, keeps SQLite)
2. **Docker Container** (Portable, still SQLite)
3. **Fly.io / Railway** (Container platform, easy SQLite volume)
4. **Cloudflare Workers** (Edge, requires DB external like Turso/D1)
5. **Vercel** (Serverless, limited Bun support)

## Next Steps
- Wait for librarian research on platform compatibility
- Wait for explore agent findings on Bun-specific API usage
- Evaluate if migration to Turso is required for edge deployment
- Recommend deployment strategy based on findings
