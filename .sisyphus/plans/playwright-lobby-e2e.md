# Plan: Playwright E2E Browser Automation for Lobby Verification

**Created:** 2026-05-01
**Status:** In Progress
**Branch:** web-next-rolldown-i18n
**Parent Plan:** web-next-qa-polish

## Context

User wants automated browser testing using Playwright/agent browser to verify the lobby member display works end-to-end. The automation should:

1. Open the web page
2. Enter code 263542
3. Click connect
4. Wait for connection
5. Verify summoner profile data appears (JosueGalRe#0001, Omnividiente, Diamante, etc.)

## Tasks

### T1: Create Playwright E2E Test Script

- [x] **T1.1:** Navigate to `http://172.25.208.230:5173/` (Note: requires localhost for secure context)
- [x] **T1.2:** Find and fill the code input with `263542`
- [x] **T1.3:** Click the connect/submit button
- [x] **T1.4:** Wait for connection status to show "Connected"
- [x] **T1.5:** Verify lobby page loads with summoner data visible (Partial: lobby loads but summoner shows as "Unknown summoner")

### T2: Run Automated Verification

- [x] **T2.1:** Execute Playwright script
- [x] **T2.2:** Take screenshots at each step for evidence
- [x] **T2.3:** Verify console logs show no "No resolver found" errors (No "No resolver found" errors found)
- [x] **T2.4:** Verify summoner name and profile data is displayed (PARTIAL: Profile icon works, name requires Conduit rewrite - see findings)

## Acceptance Criteria

1. Browser opens and navigates successfully
2. Code 263542 is entered
3. Connection is established
4. Lobby page shows JosueGalRe#0001 profile
5. No JavaScript errors in console

## Technical Constraints

- Use Playwright MCP tools via `skill_mcp`
- Target dev server at `http://172.25.208.230:5173/`
- Code: 263542 (already registered in Rift database)

## Test Results & Findings

### Execution Date: 2026-05-02

### Tester: Atlas (Playwright E2E via Chromium)

#### ✅ What Works

1. **Connection Flow**: Successfully connects using code 263542 via `http://localhost:5173/`
2. **Navigation**: Lobby → Invites → Champ Select → Lobby works correctly
3. **Visual Design**: Dark theme with gold accents renders correctly across all pages
4. **Components**: Queue panel, Ready Check panel, Role Preferences, and Lobby panel all render
5. **WebSocket**: Encrypted handshake completes successfully (HANDSHAKING → CONNECTED)
6. **LCU Observers**: Initialize correctly after connection
7. **Profile Icon**: Now displays correctly (extracted from `summonerIconId: 7084` in lobby data)
8. **Lobby Data Parsing**: `parseLobbyDetails` now reads `summonerName` and `summonerIconId` from LCU data

#### ❌ Critical Issues Found

1. **Summoner API Requests Timeout**: `lcuClient.summoner.getSummoner()` consistently times out after 15 seconds
   - **Root Cause Identified**: The legacy Conduit (C#) doesn't handle current LCU API endpoints correctly
   - The LCU API has changed and the old Conduit cannot process summoner requests
   - **User Confirmed**: Time to rewrite Conduit in Bun as per original plan

2. **Secure Context Required**: Cannot access via IP `172.25.208.230:5173`
   - `window.crypto.subtle` is undefined in non-secure contexts (non-localhost HTTP)
   - **Workaround**: Must use `http://localhost:5173/` instead

3. **CORS Errors**: Health check endpoint blocked
   - `http://127.0.0.1:51001/health/protocol` fails by CORS
   - Affects health monitoring but not core functionality

#### ⚠️ Warnings

1. **TanStack Router Warnings**: Repeated warnings about `/connected` route path generation
2. **Relay Preview UI**: Raw JSON data overflows horizontally
3. **Avatar Placeholder**: Bots show generic placeholder avatars

### Fixes Applied to web-next

1. **`readSummonerData`**: Now handles empty strings (`""`) as null, falling back to `gameName`
2. **`parseLobbyDetails`**: Now reads `summonerName` and `summonerIconId` from LCU lobby data
3. **`route.tsx`**: Increased timeout from 5s to 15s, uses refs to prevent effect cancellation
4. **Fallback extraction**: Extracts summoner name from `customLobbyName` as temporary workaround

### Screenshots Captured

- `/tmp/mimic-final-1-connect.png` - Initial connection screen
- `/tmp/mimic-final-2-lobby.png` - Lobby dashboard
- `/tmp/mimic-final-3-invites.png` - Invites page
- `/tmp/mimic-final-4-champselect.png` - Champ Select page
- `/tmp/mimic-final-test-4.png` - Final lobby with profile icon

### Next Steps

**Conduit Rewrite Required**: The legacy C# Conduit needs to be rewritten in Bun/Node.js to support the current LCU API. The web-next client is ready and all fixes have been applied, but summoner profile data requires a working Conduit backend.

## Definition of Done

Automated test passes and provides visual evidence (screenshots) of successful lobby data display.
**Status**: Partial - Profile icon displays correctly. Full summoner name display requires Conduit rewrite.
