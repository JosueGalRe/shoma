## 2026-05-12 - T3 Data Dragon champion abilities

- Data Dragon champion detail endpoint `cdn/{version}/data/en_US/champion/{key}.json` returns ability spell data; Aatrox on `15.1.1` returned 4 spells via the required `curl | jq` check.
- `web/src/core/http/ddragon-client.ts` already had `getChampion` and parsers for champion details, passive, skins, and spells; only a React Query hook wrapper was missing.
- The hook should use Riot's champion key (`Aatrox`) rather than the numeric champion id because the detail endpoint path is keyed by champion slug.
