## Task 2 — Direct WebSocket probe learnings

- `ws://localhost:51001/mobile` accepts a frame with opcode `4` and payload `"TEST12"` and replies immediately with ` [5,null] `.
- The `/mobile` socket stayed open until the client forced close; it then reported close code `1000`.
- `ws://localhost:51001/conduit` without auth opened briefly and closed immediately with code `1000`.
- `websocat` and `wscat` are not present in the environment, so Bun is the reliable fallback for direct WS evidence capture.
- 2026-05-09: `rift-next` is healthy on `51001`, `web-next` is listening on `5173`, and `/health/protocol` returns `{"riftOpcodesLoaded":true}`. The current rift log shows `mobile_connect_no_conduit`, and no live `conduit-next` process or runtime log file was found in the standard search paths.
2026-05-09: Verified `web-next` at `http://localhost:5173` with Playwright. The connect flow accepted `#code-input` value `123456` and the `Connect` click completed without page errors. Console output was limited to Vite connect messages and the React DevTools info banner; no conduit-specific UI error surfaced during the 5s wait.
2026-05-09: `reduceDisconnect` now preserves `error` when the store is already in `error` status, which prevents the follow-up `DISCONNECTED` event from clearing `connection.errors.riftUnreachable`. Added a regression test covering both error-preserving and non-error disconnect behavior.
