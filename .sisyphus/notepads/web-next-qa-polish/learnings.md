2026-05-02: `parseLobbyDetails` can safely fall back to `state.gameConfig.customLobbyName` for the local member only; bots and other members should keep their existing display-name handling.
2026-05-02: `LobbyState.gameConfig` does not currently declare `customLobbyName`, so the helper needs a narrow local cast/read to satisfy TypeScript without changing shared types.
