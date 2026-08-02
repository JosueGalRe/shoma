import type { DatabaseNotInitializedError, DatabaseQueryError } from "../database/database-service";
import type { TokenPayload } from "../http/http-types";
import type { LoggerServiceShape } from "../logger/logger-utils";
import type { ConduitOpenError } from "./realtime-errors";
import type { RealtimeStateService, RealtimeStateServiceShape } from "./realtime-state-service";
import type { Effect } from "effect";

export interface RealtimeSocket {
  send(data: string): void;
  close(code?: number, reason?: string): void;
  ping?(): void;
  raw?: object;
}

export interface ConduitRecord {
  uuid: string;
  socket: RealtimeSocket;
  conduitSocket: RealtimeSocket;
}

export type RealtimeDatabaseError = DatabaseNotInitializedError | DatabaseQueryError;

export interface RealtimeDependencies {
  lookup(
    code: string,
  ): Effect.Effect<{ code: string; public_key: string } | null, RealtimeDatabaseError>;
  potentiallyUpdate(code: string, pubkey: string): Effect.Effect<boolean, RealtimeDatabaseError>;
  verifyToken(token: string): Effect.Effect<TokenPayload | null, never>;
  createConnectionId(): string;
}

export type RelayFrame = [number, ...unknown[]];

export interface RealtimeServiceShape {
  readonly handleMobileOpen: (socket: RealtimeSocket) => Effect.Effect<void>;
  readonly handleConduitOpen: (
    socket: RealtimeSocket,
    token: string | undefined,
    publicKey: string | undefined,
  ) => Effect.Effect<void, ConduitOpenError | RealtimeDatabaseError>;
  readonly handleConduitMessage: (
    socket: RealtimeSocket,
    rawMessage: unknown,
  ) => Effect.Effect<void>;
  readonly handleConduitClose: (socket: RealtimeSocket) => Effect.Effect<void>;
  readonly handleMobileMessage: (
    socket: RealtimeSocket,
    rawMessage: unknown,
  ) => Effect.Effect<void, RealtimeDatabaseError>;
  readonly handleMobileClose: (socket: RealtimeSocket) => Effect.Effect<void>;
  readonly startKeepAlive: (intervalMs?: number) => Effect.Effect<void>;
  readonly stopKeepAlive: Effect.Effect<void>;
  readonly shutdown: Effect.Effect<void>;
}

export interface RealtimeHandlerContext {
  deps: RealtimeDependencies;
  log: LoggerServiceShape;
  serviceEffect: <A, E>(effect: Effect.Effect<A, E, RealtimeStateService>) => Effect.Effect<A, E>;
  state: RealtimeStateServiceShape;
}
