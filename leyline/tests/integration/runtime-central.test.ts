import { afterEach, describe, expect, it } from "bun:test";

import { startRuntime } from "../../src/index";
import { readCodeFromToken, readTokenFromRegisterBody } from "../helpers/auth-test-helpers";
import { cleanupDbFiles, createTempDbPath } from "../helpers/db-test-helpers";
import { waitForClose, waitForOpen } from "../helpers/ws-test-helpers";

const dbFiles: string[] = [];

afterEach(() => {
  cleanupDbFiles(dbFiles);
});

function createRuntime(options: { databasePath?: string; port?: number } = {}) {
  const databasePath = options.databasePath ?? createTempDbPath("runtime-central");
  if (!dbFiles.includes(databasePath)) {
    dbFiles.push(databasePath);
  }

  return startRuntime({
    databasePath,
    keepAliveIntervalMs: 5,
    port: options.port ?? 55_000 + Math.floor(Math.random() * 1000),
  });
}

describe("central runtime lifecycle", () => {
  it("starts with the central layer and initializes the database", async () => {
    Bun.env.LEYLINE_JWT_SECRET = "test-secret";

    const runtime = await createRuntime();
    const stopped = false;

    try {
      const rootResponse = await fetch(`http://127.0.0.1:${runtime.port}/`);
      expect(rootResponse.status).toBe(200);
      expect(await rootResponse.text()).toBe("Hai, relayo desu.");

      const registerResponse = await fetch(`http://127.0.0.1:${runtime.port}/register`, {
        body: JSON.stringify({ pubkey: "central-pubkey" }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });

      expect(registerResponse.status).toBe(200);

      const registerBody: unknown = await registerResponse.json();
      const token = readTokenFromRegisterBody(registerBody);
      const code = readCodeFromToken(token);

      const checkResponse = await fetch(
        `http://127.0.0.1:${runtime.port}/check?token=${encodeURIComponent(token)}`,
      );
      expect(checkResponse.status).toBe(200);
      expect(await checkResponse.json()).toBe(true);
      expect(code).toHaveLength(6);
    } finally {
      if (!stopped) {
        await runtime.stop();
      }
    }
  });

  it("makes stop idempotent", async () => {
    const runtime = await createRuntime();
    let stopped = false;

    try {
      await fetch(`http://127.0.0.1:${runtime.port}/`);

      await runtime.stop();
      await runtime.stop();
      stopped = true;
    } finally {
      if (!stopped) {
        await runtime.stop();
      }
    }
  });

  it("closes active websocket connections on shutdown", async () => {
    Bun.env.LEYLINE_JWT_SECRET = "test-secret";

    const runtime = await createRuntime();
    let stopped = false;

    try {
      const registerResponse = await fetch(`http://127.0.0.1:${runtime.port}/register`, {
        body: JSON.stringify({ pubkey: "socket-pubkey" }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });

      const registerBody: unknown = await registerResponse.json();
      const token = readTokenFromRegisterBody(registerBody);

      const conduit = new WebSocket(
        `ws://127.0.0.1:${runtime.port}/conduit?token=${encodeURIComponent(token)}&publicKey=${encodeURIComponent("socket-pubkey")}`,
      );
      await waitForOpen(conduit);

      const mobile = new WebSocket(`ws://127.0.0.1:${runtime.port}/mobile`);
      await waitForOpen(mobile);

      const conduitClosed = waitForClose(conduit);
      const mobileClosed = waitForClose(mobile);

      await runtime.stop();
      stopped = true;

      expect(await conduitClosed).toBe(1000);
      expect(await mobileClosed).toBe(1000);
    } finally {
      if (!stopped) {
        await runtime.stop();
      }
    }
  });

  it("can restart after stop", async () => {
    Bun.env.LEYLINE_JWT_SECRET = "test-secret";

    const port = 56_000 + Math.floor(Math.random() * 1000);
    const databasePath = createTempDbPath("runtime-central-restart");
    dbFiles.push(databasePath);

    const runtime = await createRuntime({ databasePath, port });
    let runtimeStopped = false;

    try {
      const firstResponse = await fetch(`http://127.0.0.1:${runtime.port}/`);
      expect(firstResponse.status).toBe(200);

      await runtime.stop();
      runtimeStopped = true;

      const restarted = await createRuntime({ databasePath, port });
      const secondResponse = await fetch(`http://127.0.0.1:${restarted.port}/`);
      expect(secondResponse.status).toBe(200);
      expect(await secondResponse.text()).toBe("Hai, relayo desu.");
      await restarted.stop();
    } finally {
      if (!runtimeStopped) {
        await runtime.stop();
      }
    }
  });
});
