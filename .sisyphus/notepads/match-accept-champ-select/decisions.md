## 2026-05-08
- Kept the ready-check hook and store unchanged; the overlay now hides immediately when the local status flips to accepted, declined, or expired.

## 2026-05-08 - navigation guard decision
- Kept existing GameflowPhase to route mapping unchanged: Matchmaking -> /connected/queue, ChampSelect -> /connected/champ-select, Lobby/None/InProgress -> /connected/lobby, ReadyCheck -> no automatic navigation.
- Restricted automatic gameflow navigation to explicit gameflow source routes, including /connected/ready-check, instead of broad /connected/* matching.
