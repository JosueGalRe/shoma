## 2026-05-04 - LCU recommended rune endpoint research

- Current public LCU spec/source checked: https://lcu.kebs.dev/ and https://www.mingweisamuel.com/lcu-schema/lcu/openapi.json (client version 26.05).
- Verified perks endpoints in current public spec: GET/PUT /lol-perks/v1/currentpage, GET/POST/DELETE /lol-perks/v1/pages, GET/PUT/DELETE /lol-perks/v1/pages/{id}.
- Documented `LolPerksPerkPageResource` fields: autoModifiedSelections, current, id, isActive, isDeletable, isEditable, isValid, lastModified, name, order, primaryStyleId, selectedPerkIds, subStyleId.
- Searched but not found in current public docs/spec: /lol-perks/v1/recommended-pages, /lol-perks/v1/pages/recommended, /lol-champ-select/v1/recommended-perks, /lol-perks/v1/champion/{championId}/recommended, /lol-perks/v1/recommended-pages/champion/{championId}/position/{position}/map/{mapId}, /lol-perks/v1/recommended-champion-positions.
- Public reverse-engineered references found: Hextechdocs documents setting runes via /lol-perks/v1/currentpage and /lol-perks/v1/pages; older public URL lists include standard /lol-perks routes only. A third-party code comment references /lol-perks/v1/recommended-pages/champion/{championId}/position/{position}/map/{mapId}, but this is not present in the current public OpenAPI/spec.
- Decision: do not add a protocol-contract endpoint/type/export for recommended rune pages because no evidence-backed current LCU endpoint was found and guessed endpoints are forbidden.

## 2026-05-04 - Safe LCU payload parsing in rune editor

- In `apps/web-next/src/features/champ-select/components/rune-editor.tsx`, use `readObject()` before reading nested `id` fields from LCU responses, then narrow with `readNumber()`.
- This avoids `as any` while preserving the same page creation/current-page selection flow.
