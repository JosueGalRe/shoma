# Issues

## 2026-05-09 - Verification environment blockers

- `lsp_diagnostics` is unavailable for `.md` artifacts because this workspace has no Markdown LSP server configured.
- `bun run fmt:check` fails before checking files: `oxfmt wrapper is for IDE extension use only (lsp or stdin mode). To format your code, run: vp fmt`.
- `vp fmt --check` also fails in this environment with `Failed to load configuration file. expected value at line 1 column 1`.
- `bun run build` fails on existing workspace issues unrelated to this documentation-only task: `@mimic/rift-next` TS5090 baseUrl/config issue, `@mimic/web-next` `bun:test` missing `mock` export in test files, and `@mimic/conduit-next` Linux build failure from `irelia` process-name imports gated to Windows/macOS.

## 2026-05-09 - F3 Real Manual QA
- Required targeted tests pass: 5 sticky hook, 4 route grace, 2 LCU mutation tests.
- Modified source diagnostics are clean for `use-lobby.ts` and `route.tsx`.
- Full `bun run build` fails on existing/package-level blockers unrelated to source diagnostics: rift-next TS5090, web-next `bun:test` mock type export in test files, conduit-next Linux irelia cfg imports.
