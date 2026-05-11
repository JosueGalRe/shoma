
## 2026-05-04 - LCU parser unit tests
- Tests were added only under apps/web-next/tests/unit/lcu-parsers/ and parser source files were left unchanged, per task constraints.
- Covered parser edge cases as current behavior contracts rather than changing parsers: empty strings remain valid for base readString, non-finite numbers are rejected, and missing ready-check timer returns null.
