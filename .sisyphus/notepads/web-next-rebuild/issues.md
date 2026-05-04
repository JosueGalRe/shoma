- Playwright browser verification was blocked because the MCP environment has no Chrome binary at `/opt/google/chrome/chrome`.
- Installing Playwright Chrome required sudo, which is unavailable in this environment.

## T17: E2E Playwright migration
- `bun --cwd apps/web-next run test:e2e` is rejected by this Bun CLI before the package script runs; `bun run --cwd apps/web-next test:e2e` is the verified equivalent and passes.

- Follow-up: the equals form `bun --cwd=apps/web-next run test:e2e` is accepted by this Bun CLI and passes; only the space-separated `bun --cwd apps/web-next ...` spelling is rejected.

## Final verification fixes
- A naive hook-deps fix in `useChampSelect` (`[championsQuery.data, store]`) passed TypeScript but caused Playwright browser errors on `/connected/champ-select` due to repeated `store.setChampions()` updates. The verified fix is selecting `setChampions` directly from Zustand and depending on that action.
