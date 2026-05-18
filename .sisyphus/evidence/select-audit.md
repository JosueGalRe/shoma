# Native `<select>` Audit

Date: 2026-05-12

Scope:

- `web/src/features/champ-select/`
- `web/src/features/lobby/`

Required commands run:

```bash
grep -R "<select" web/src/features/champ-select web/src/features/lobby
grep -Rn "select" web/src/features/champ-select web/src/features/lobby | grep -i "native\|<select"
```

Summary:

- Native `<select>` elements found: 7
- Affected feature: `champ-select`
- `lobby` native `<select>` elements found: 0

## Findings

| #   | File                                                              | Line | Context                                                                                                                                                                                                                           | Replacement strategy                                                                                                                                                                                                                                                                             |
| --- | ----------------------------------------------------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `web/src/features/champ-select/components/champion-picker.tsx`    | 104  | ARAM champion/card list sort control. Uses `sortOrder` with `name-asc` / `name-desc` options beside the champion search input.                                                                                                    | Replace with a compact custom selector trigger that opens a BottomSheet containing the two sort choices. A simple text/list selector is enough; no icon grid required unless the shared selector API requires item icons. Preserve `aria-label`, `sortOrder`, and `setSortOrder`.                |
| 2   | `web/src/features/champ-select/components/champion-picker.tsx`    | 193  | Standard champion list sort control. Same `sortOrder` state and options as the ARAM branch, displayed beside the search input.                                                                                                    | Replace with the same reusable sort BottomSheet selector used for the ARAM branch to avoid duplicating native select behavior. Preserve the existing A-Z / Z-A translations and `setSortOrder` update.                                                                                           |
| 3   | `web/src/features/champ-select/components/player-settings.tsx`    | 59   | Rune tree picker inside `PlayerSettings`, rendered when `modeRules.usesRunes` is true. Options come from `runeTrees`; empty option displays `champSelect.chooseRune`; change handler calls `onChangeRune(RuneId(Number(value)))`. | Replace with a BottomSheet selector for rune trees. Prefer an icon/list presentation using rune tree metadata and existing rune preview imagery where practical. Preserve the empty/unselected state and branded `RuneId` conversion.                                                            |
| 4   | `web/src/features/champ-select/components/summoner-picker.tsx`    | 40   | Summoner spell slot 1 picker. Adjacent preview image reflects `selectedSpell1`; options come from `summonerSpells`; change handler calls `onChangeSpell(1, SpellId(Number(value)))`.                                              | Replace with an IconGridSelector in a BottomSheet so summoner spells are chosen by icon and name. Keep the slot-specific callback, selected preview state, empty `chooseSpell` fallback, and `SpellId` conversion.                                                                               |
| 5   | `web/src/features/champ-select/components/summoner-picker.tsx`    | 61   | Summoner spell slot 2 picker. Mirrors slot 1 with `selectedSpell2` and `onChangeSpell(2, ...)`.                                                                                                                                   | Replace with the same reusable summoner spell IconGridSelector as slot 1, parameterized by slot. Preserve separate selected state and `SpellId` conversion.                                                                                                                                      |
| 6   | `web/src/features/champ-select/components/rune-page-controls.tsx` | 15   | Rune page selector in `RunePageControls`. Options come from `pages`; value is `currentPageId ?? ''`; change handler calls `onSetCurrentPage(Number(value))`.                                                                      | Replace with a BottomSheet list selector for rune pages. Keep create/delete buttons unchanged. Preserve numeric page id handling and current page selection.                                                                                                                                     |
| 7   | `web/src/features/champ-select/components/skin-picker.tsx`        | 24   | Skin picker above an existing custom skin card grid. Options come from `skins`; option value is `skin.num`; change handler calls `onSelectSkin(Number(value))`; includes empty `chooseSkin` option.                               | Prefer removing the redundant native select once the existing skin card grid is confirmed as the primary selector. If a sheet is still required for parity, reuse the skin images in an IconGridSelector. Preserve `selectedSkinId`, `skin.num` numeric conversion, and empty fallback behavior. |

## Raw command evidence

`grep -R "<select" web/src/features/champ-select web/src/features/lobby` output:

```text
web/src/features/champ-select/components/champion-picker.tsx:            <select
web/src/features/champ-select/components/champion-picker.tsx:          <select
web/src/features/champ-select/components/player-settings.tsx:              <select
web/src/features/champ-select/components/summoner-picker.tsx:          <select
web/src/features/champ-select/components/summoner-picker.tsx:          <select
web/src/features/champ-select/components/rune-page-controls.tsx:      <select
web/src/features/champ-select/components/skin-picker.tsx:      <select
```

`grep -Rn "select" web/src/features/champ-select web/src/features/lobby | grep -i "native\|<select"` output:

```text
web/src/features/champ-select/components/champion-picker.tsx:104:            <select
web/src/features/champ-select/components/champion-picker.tsx:193:          <select
web/src/features/champ-select/components/player-settings.tsx:59:              <select
web/src/features/champ-select/components/summoner-picker.tsx:40:          <select
web/src/features/champ-select/components/summoner-picker.tsx:61:          <select
web/src/features/champ-select/components/rune-page-controls.tsx:15:      <select
web/src/features/champ-select/components/skin-picker.tsx:24:      <select
```

## Lobby result

No native `<select>` elements were returned from `web/src/features/lobby/` by either required command.
