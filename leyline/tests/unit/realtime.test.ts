import { RelayErrorCode, RelayOpcode } from "@shoma/protocol-contract";
import { describe, expect, it } from "bun:test";
import { Cause, Effect, Option } from "effect";
import { TestClock } from "effect/testing";

import {
  DatabaseNotInitializedError,
  makeDatabaseService,
} from "../../src/core/database/database-service";
import {
  makeRealtimeService,
  makeRealtimeStateService,
} from "../../src/core/realtime/realtime-service";
import { app } from "../../src/index";

import type { LoggerServiceShape } from "../../src/core/logger/logger-utils";
import type { RealtimeDependencies, RealtimeSocket } from "../../src/core/realtime/realtime-types";

const silentLogger: LoggerServiceShape = {
  child: () => silentLogger,
  debug: () => Effect.void,
  error: () => Effect.void,
  info: () => Effect.void,
  warn: () => Effect.void,
};

class FakeSocket implements RealtimeSocket {
  sent: string[] = [];
  closed = false;
  pingCount = 0;

  send(data: string) {
    this.sent.push(data);
  }

  ping() {
    this.pingCount += 1;
  }

  close() {
    this.closed = true;
  }
}

interface RealtimeDepsOptions {
  lookupResult?: { code: string; public_key: string } | null;
  potentiallyUpdateResult?: boolean;
  tokenCode?: string | null;
  connectionId?: string;
}

function createRealtimeDeps(options: RealtimeDepsOptions = {}): RealtimeDependencies {
  const lookupResult = options.lookupResult ?? null;
  const potentiallyUpdateResult = options.potentiallyUpdateResult ?? true;
  const tokenCode = options.tokenCode ?? "111111";
  const connectionId = options.connectionId ?? "peer-1";

  return {
    createConnectionId() {
      return connectionId;
    },
    lookup(code: string) {
      if (!lookupResult) {
        return Effect.succeed(null);
      }

      if (lookupResult.code !== code) {
        return Effect.succeed(null);
      }

      return Effect.succeed(lookupResult);
    },
    potentiallyUpdate(code: string, pubkey: string) {
      if (!potentiallyUpdateResult) {
        return Effect.succeed(false);
      }

      if (!lookupResult) {
        return Effect.succeed(true);
      }

      return Effect.succeed(lookupResult.code === code && lookupResult.public_key === pubkey);
    },
    verifyToken() {
      if (!tokenCode) {
        return Effect.succeed(null);
      }

      return Effect.succeed({ code: tokenCode });
    },
  };
}

describe("RelayRealtimeService", () => {
  it("rejects conduit open when token/pubkey are missing", () => {
    const service = makeRealtimeService(
      createRealtimeDeps({
        connectionId: "id-1",
        lookupResult: null,
        potentiallyUpdateResult: false,
        tokenCode: null,
      }),
      silentLogger,
      makeRealtimeStateService(),
    );

    const conduit = new FakeSocket();
    expect(Effect.runSyncExit(service.handleConduitOpen(conduit, undefined, "pubkey"))._tag).toBe(
      "Failure",
    );
    expect(Effect.runSyncExit(service.handleConduitOpen(conduit, "token", undefined))._tag).toBe(
      "Failure",
    );
  });

  it("routes mobile <-> conduit messages after successful connect", () => {
    const service = makeRealtimeService(
      createRealtimeDeps({
        connectionId: "peer-1",
        lookupResult: { code: "111111", public_key: "pubkey-1" },
        potentiallyUpdateResult: true,
        tokenCode: "111111",
      }),
      silentLogger,
      makeRealtimeStateService(),
    );

    const conduit = new FakeSocket();
    const mobile = new FakeSocket();

    expect(Effect.runSyncExit(service.handleConduitOpen(conduit, "token", "pubkey-1"))._tag).toBe(
      "Success",
    );

    Effect.runSync(
      service.handleMobileMessage(mobile, JSON.stringify([RelayOpcode.CONNECT, "111111"])),
    );
    expect(conduit.sent[0]).toBe(JSON.stringify([RelayOpcode.OPEN, "peer-1"]));
    expect(mobile.sent[0]).toBe(JSON.stringify([RelayOpcode.CONNECT_PUBKEY, "pubkey-1"]));

    Effect.runSync(
      service.handleMobileMessage(mobile, JSON.stringify([RelayOpcode.SEND, "payload"])),
    );
    expect(conduit.sent[1]).toBe(JSON.stringify([RelayOpcode.MSG, "peer-1", "payload"]));

    Effect.runSync(
      service.handleConduitMessage(conduit, JSON.stringify([RelayOpcode.REPLY, "peer-1", "reply"])),
    );
    expect(mobile.sent[1]).toBe(JSON.stringify([RelayOpcode.RECEIVE, "reply"]));

    Effect.runSync(service.handleMobileClose(mobile));
    expect(conduit.sent[2]).toBe(JSON.stringify([RelayOpcode.CLOSE, "peer-1"]));
  });

  it("accepts array payloads from websocket runtime", () => {
    const service = makeRealtimeService(
      createRealtimeDeps({
        connectionId: "peer-1",
        lookupResult: { code: "111111", public_key: "pubkey-1" },
        potentiallyUpdateResult: true,
        tokenCode: "111111",
      }),
      silentLogger,
      makeRealtimeStateService(),
    );

    const conduit = new FakeSocket();
    const mobile = new FakeSocket();

    expect(Effect.runSyncExit(service.handleConduitOpen(conduit, "token", "pubkey-1"))._tag).toBe(
      "Success",
    );
    Effect.runSync(service.handleMobileMessage(mobile, [RelayOpcode.CONNECT, "111111"]));
    Effect.runSync(service.handleMobileMessage(mobile, [RelayOpcode.SEND, "payload"]));

    expect(conduit.sent[1]).toBe(JSON.stringify([RelayOpcode.MSG, "peer-1", "payload"]));
  });

  it("closes mobile socket on invalid opcode", () => {
    const service = makeRealtimeService(
      createRealtimeDeps({
        connectionId: "peer-1",
        lookupResult: null,
        potentiallyUpdateResult: true,
        tokenCode: "111111",
      }),
      silentLogger,
      makeRealtimeStateService(),
    );

    const mobile = new FakeSocket();
    Effect.runSync(service.handleMobileMessage(mobile, JSON.stringify([999, "bad-op"])));

    expect(mobile.closed).toBe(true);
  });

  it("closes mobile socket on malformed frame payload", () => {
    const service = makeRealtimeService(
      createRealtimeDeps({
        connectionId: "peer-1",
        lookupResult: null,
        potentiallyUpdateResult: true,
        tokenCode: "111111",
      }),
      silentLogger,
      makeRealtimeStateService(),
    );

    const mobile = new FakeSocket();
    Effect.runSync(service.handleMobileMessage(mobile, "{malformed-json"));

    expect(mobile.closed).toBe(true);
  });

  it("ignores conduit reply for unknown peer", () => {
    const service = makeRealtimeService(
      createRealtimeDeps({
        connectionId: "peer-1",
        lookupResult: { code: "111111", public_key: "pubkey-1" },
        potentiallyUpdateResult: true,
        tokenCode: "111111",
      }),
      silentLogger,
      makeRealtimeStateService(),
    );

    const conduit = new FakeSocket();
    const mobile = new FakeSocket();

    expect(Effect.runSyncExit(service.handleConduitOpen(conduit, "token", "pubkey-1"))._tag).toBe(
      "Success",
    );
    Effect.runSync(service.handleMobileMessage(mobile, [RelayOpcode.CONNECT, "111111"]));

    Effect.runSync(
      service.handleConduitMessage(conduit, [RelayOpcode.REPLY, "unknown-peer", "late-message"]),
    );

    expect(conduit.closed).toBe(false);
    expect(mobile.sent).toEqual([JSON.stringify([RelayOpcode.CONNECT_PUBKEY, "pubkey-1"])]);
  });

  it("closes conduit socket on invalid conduit opcode", () => {
    const service = makeRealtimeService(
      createRealtimeDeps({
        connectionId: "peer-1",
        lookupResult: null,
        potentiallyUpdateResult: true,
        tokenCode: "111111",
      }),
      silentLogger,
      makeRealtimeStateService(),
    );

    const conduit = new FakeSocket();
    Effect.runSync(service.handleConduitMessage(conduit, JSON.stringify([999, "bad-op"])));

    expect(conduit.closed).toBe(true);
  });

  it("pings mobile and conduit sockets while keepalive is running", async () => {
    const service = makeRealtimeService(
      createRealtimeDeps({
        connectionId: "peer-1",
        lookupResult: { code: "111111", public_key: "pubkey-1" },
        potentiallyUpdateResult: true,
        tokenCode: "111111",
      }),
      silentLogger,
      makeRealtimeStateService(),
    );

    const conduit = new FakeSocket();
    const mobile = new FakeSocket();

    Effect.runSync(service.handleMobileOpen(mobile));
    expect(Effect.runSyncExit(service.handleConduitOpen(conduit, "token", "pubkey-1"))._tag).toBe(
      "Success",
    );

    Effect.runSync(service.startKeepAlive(5));
    await Bun.sleep(20);
    Effect.runSync(service.stopKeepAlive);

    expect(mobile.pingCount).toBeGreaterThan(0);
    expect(conduit.pingCount).toBeGreaterThan(0);
  });

  it("pings sockets deterministically with TestClock", async () => {
    const state = makeRealtimeStateService();
    const service = makeRealtimeService(
      createRealtimeDeps({
        connectionId: "peer-1",
        lookupResult: { code: "111111", public_key: "pubkey-1" },
        potentiallyUpdateResult: true,
        tokenCode: "111111",
      }),
      silentLogger,
      state,
    );
    const conduit = new FakeSocket();
    const mobile = new FakeSocket();

    try {
      await Effect.runPromise(
        Effect.gen(function* realtimeTest() {
          yield* service.handleMobileOpen(mobile);
          yield* service.handleConduitOpen(conduit, "token", "pubkey-1");
          yield* service.startKeepAlive(5);
          yield* Effect.yieldNow;

          expect(mobile.pingCount).toBe(1);
          expect(conduit.pingCount).toBe(1);

          yield* TestClock.adjust("15 millis");

          expect(mobile.pingCount).toBe(4);
          expect(conduit.pingCount).toBe(4);

          yield* service.stopKeepAlive;
          const mobileCountAfterStop = mobile.pingCount;
          const conduitCountAfterStop = conduit.pingCount;

          yield* TestClock.adjust("15 millis");

          expect(mobile.pingCount).toBe(mobileCountAfterStop);
          expect(conduit.pingCount).toBe(conduitCountAfterStop);
        }).pipe(Effect.provide(TestClock.layer()), Effect.scoped),
      );
    } finally {
      await Effect.runPromise(service.shutdown);
    }
  });

  it("stops sending pings after keepalive is stopped", async () => {
    const service = makeRealtimeService(
      createRealtimeDeps({
        connectionId: "peer-1",
        lookupResult: { code: "111111", public_key: "pubkey-1" },
        potentiallyUpdateResult: true,
        tokenCode: "111111",
      }),
      silentLogger,
      makeRealtimeStateService(),
    );

    const conduit = new FakeSocket();
    expect(Effect.runSyncExit(service.handleConduitOpen(conduit, "token", "pubkey-1"))._tag).toBe(
      "Success",
    );

    Effect.runSync(service.startKeepAlive(5));
    await Bun.sleep(15);
    Effect.runSync(service.stopKeepAlive);

    const countAfterStop = conduit.pingCount;
    await Bun.sleep(15);

    expect(conduit.pingCount).toBe(countAfterStop);
  });

  it("shutdown closes tracked sockets and stops keepalive", async () => {
    const service = makeRealtimeService(
      createRealtimeDeps({
        connectionId: "peer-1",
        lookupResult: { code: "111111", public_key: "pubkey-1" },
        potentiallyUpdateResult: true,
        tokenCode: "111111",
      }),
      silentLogger,
      makeRealtimeStateService(),
    );

    const conduit = new FakeSocket();
    const mobile = new FakeSocket();

    Effect.runSync(service.handleMobileOpen(mobile));
    expect(Effect.runSyncExit(service.handleConduitOpen(conduit, "token", "pubkey-1"))._tag).toBe(
      "Success",
    );
    Effect.runSync(service.startKeepAlive(5));
    await Bun.sleep(15);

    Effect.runSync(service.shutdown);

    const conduitPingAtShutdown = conduit.pingCount;
    await Bun.sleep(15);

    expect(conduit.closed).toBe(true);
    expect(mobile.closed).toBe(true);
    expect(conduit.pingCount).toBe(conduitPingAtShutdown);
  });

  it("sends invalid_code error when code is missing", () => {
    const service = makeRealtimeService(
      createRealtimeDeps({
        connectionId: "peer-1",
        lookupResult: null,
        potentiallyUpdateResult: true,
        tokenCode: "111111",
      }),
      silentLogger,
      makeRealtimeStateService(),
    );

    const mobile = new FakeSocket();
    Effect.runSync(
      service.handleMobileMessage(mobile, JSON.stringify([RelayOpcode.CONNECT, "111111"])),
    );

    expect(mobile.sent[0]).toBe(
      JSON.stringify([RelayOpcode.ERROR, { code: RelayErrorCode.INVALID_CODE }]),
    );
    expect(mobile.closed).toBe(true);
  });

  it("fails generateCode with DatabaseNotInitializedError before initialize", async () => {
    const database = makeDatabaseService(":memory:");
    const exit = await Effect.runPromiseExit(database.generateCode("pubkey-uninitialized"));

    expect(exit._tag).toBe("Failure");
    if (exit._tag !== "Failure") {
      throw new Error("Expected generateCode to fail before database initialize.");
    }

    const failure = Cause.findErrorOption(exit.cause);
    expect(Option.isSome(failure)).toBe(true);
    if (Option.isSome(failure)) {
      expect(failure.value).toBeInstanceOf(DatabaseNotInitializedError);
      expect(failure.value._tag).toBe("DatabaseNotInitializedError");
    }
  });

  it("returns MissingPublicKeyError response when POST /register omits pubkey", async () => {
    const response = await app.handle(
      new Request("http://localhost/register", {
        body: JSON.stringify({}),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Missing public key.", ok: false });
  });
});
