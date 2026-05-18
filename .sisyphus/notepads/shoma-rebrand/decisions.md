## 2026-05-13 alias wiring decision

- Kept the import rename scoped to active source and tests, then added explicit `@shoma/protocol-contract` path mappings in package tsconfigs so TypeScript resolves the renamed workspace package.
