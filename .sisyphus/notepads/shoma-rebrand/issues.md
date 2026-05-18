## 2026-05-13 build verification blockers

- `bun run build` still fails outside this rename work because `leyline/tests/unit/env-config.test.ts` has a pre-existing `loadConfig` redeclaration error.
- The root build also reports unrelated `conduit` Rust/Tauri failures that are not part of the protocol-contract rename.
