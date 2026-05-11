# packages/protocol-contract KNOWLEDGE BASE

**Generated:** 2026-05-01

## OVERVIEW
Shared protocol types and constants consumed by both `apps/web-next` and `apps/rift-next` (and eventually `conduit`).

## STRUCTURE
```
packages/protocol-contract/
└── src/
    └── index.ts              # Barrel export of all protocol shapes
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Opcode definitions | `src/index.ts` | `SECRET`, `REQUEST`, `UPDATE`, `RESPONSE`, etc. |
| Protocol tests | `tests/opcodes.test.ts` | Contract/stability tests |

## CONVENTIONS
- **Export style:** TS source exported directly (`main`/`types` → `./src/index.ts`)
- **Import path:** `@mimic/protocol-contract` (resolved via root `tsconfig.base.json` paths)
- **No build artifact:** TypeScript is emitted on demand by consumers

## ANTI-PATTERNS
- Do not add runtime dependencies here; keep it types + pure constants only
- Do not break opcode shapes without updating contract tests
