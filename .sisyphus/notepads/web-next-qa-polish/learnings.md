2026-05-01: TypeScript 6 requires `ignoreDeprecations` on the package tsconfig that declares `baseUrl`; keeping it only in the shared base config is not enough for `bun run build`.
2026-05-01: `ky` v2 uses `prefix` instead of `prefixUrl`, and `react-i18next` `Trans` values need explicit stringification for stricter React 19.2.5 typings.
