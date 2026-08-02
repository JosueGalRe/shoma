import { RelayErrorCode, RelayOpcode } from "@shoma/protocol-contract";
import { Effect, Result } from "effect";

import { ConduitOpenError } from "./realtime-errors";
import {
  closeWithError,
  encodeReceiveFrame,
  frameErrorReason,
  safeClose,
} from "./realtime-frame-utils";
import { parseFrame, socketKey } from "./realtime-utils";

import type { RealtimeHandlerContext, RealtimeSocket } from "./realtime-types";

export function makeConduitHandlers({ deps, log, serviceEffect, state }: RealtimeHandlerContext) {
  const handleConduitClose = (socket: RealtimeSocket) =>
    serviceEffect(
      Effect.gen(function* handleConduitClose() {
        const conduitIdentity = socketKey(socket);
        const code = state.conduitSocketToCode.get(conduitIdentity);
        const peers = state.conduitToMobileMap.get(conduitIdentity) ?? [];

        state.conduitSockets.delete(socket);

        for (const peer of peers) {
          state.mobileToConduitMap.delete(socketKey(peer.socket));
          yield* safeClose(peer.socket);
        }

        state.conduitToMobileMap.delete(conduitIdentity);
        if (code) {
          state.conduitConnections.delete(code);
          state.conduitSocketToCode.delete(conduitIdentity);
        }

        const connLog = code === undefined ? log : log.child({ code });
        yield* connLog.info("conduit_close", {
          conduitCount: state.conduitSockets.size,
          detachedPeers: peers.length,
        });
      }),
    );

  const handleConduitMessage = (socket: RealtimeSocket, rawMessage: unknown) =>
    serviceEffect(
      Effect.gen(function* handleConduitMessage() {
        const frameResult = yield* Effect.result(parseFrame(rawMessage));

        const code = state.conduitSocketToCode.get(socketKey(socket));
        const connLog = code === undefined ? log : log.child({ code });

        if (Result.isFailure(frameResult)) {
          yield* connLog.warn("conduit_message_error", {
            reason: frameErrorReason(frameResult.failure),
          });
          yield* closeWithError(socket, RelayErrorCode.MALFORMED_MESSAGE);
          return;
        }

        const frame = frameResult.success;

        const [op, ...args] = frame;

        if (op === RelayOpcode.REPLY) {
          const [peerId] = args;
          if (typeof peerId !== "string") {
            yield* connLog.warn("conduit_message_error", {
              reason: "Conduit sent invalid peer id.",
            });
            yield* closeWithError(socket, RelayErrorCode.MALFORMED_MESSAGE);
            return;
          }

          const peers = state.conduitToMobileMap.get(socketKey(socket)) ?? [];
          const peer = peers.find((entry) => entry.uuid === peerId);
          const peerLog = connLog.child({ peerId });
          if (!peer) {
            yield* peerLog.debug("conduit_reply_ignored_unknown_peer");
            return;
          }

          yield* Effect.sync(() => {
            peer.socket.send(encodeReceiveFrame([RelayOpcode.RECEIVE, args[1]]));
          });
          return;
        }

        if (op === RelayOpcode.DISCONNECT_PEER) {
          const [peerId] = args;
          if (typeof peerId !== "string") {
            yield* connLog.warn("conduit_disconnect_peer_invalid", {
              reason: "Missing peer id.",
            });
            return;
          }

          const conduitIdentity = socketKey(socket);
          const peers = state.conduitToMobileMap.get(conduitIdentity) ?? [];
          const index = peers.findIndex((entry) => entry.uuid === peerId);
          const peerLog = connLog.child({ peerId });
          if (index === -1) {
            yield* peerLog.debug("conduit_disconnect_peer_unknown");
            return;
          }

          const peer = peers[index];
          peers.splice(index, 1);
          state.mobileToConduitMap.delete(socketKey(peer.socket));
          yield* safeClose(peer.socket);
          yield* peerLog.info("conduit_disconnect_peer");
          return;
        }

        yield* connLog.warn("conduit_message_error", { reason: "Conduit sent invalid opcode." });
        yield* closeWithError(socket, RelayErrorCode.MALFORMED_MESSAGE);
      }),
    );

  const handleConduitOpen = (
    socket: RealtimeSocket,
    token: string | undefined,
    pubkey: string | undefined,
  ) =>
    serviceEffect(
      Effect.gen(function* handleConduitOpen() {
        if (!token) {
          yield* log.warn("conduit_open_rejected_missing_auth", {
            hasPublicKey: Boolean(pubkey),
            hasToken: false,
          });
          return yield* new ConduitOpenError({ reason: RelayErrorCode.INVALID_TOKEN });
        }

        if (!pubkey) {
          yield* log.warn("conduit_open_rejected_missing_auth", {
            hasPublicKey: false,
            hasToken: true,
          });
          return yield* new ConduitOpenError({ reason: RelayErrorCode.MISSING_PUBKEY });
        }

        const decoded = yield* deps.verifyToken(token);
        if (!decoded || typeof decoded.code !== "string") {
          yield* log.warn("conduit_open_rejected_invalid_token");
          return yield* new ConduitOpenError({ reason: RelayErrorCode.INVALID_TOKEN });
        }

        const { code } = decoded;
        const connLog = log.child({ code });
        if (!(yield* deps.potentiallyUpdate(code, pubkey))) {
          yield* connLog.warn("conduit_open_rejected_stale_code");
          return yield* new ConduitOpenError({ reason: RelayErrorCode.INVALID_CODE });
        }

        const existing = state.conduitConnections.get(code);
        if (existing && existing !== socket) {
          yield* handleConduitClose(existing);
          yield* safeClose(existing);
          yield* connLog.info("conduit_connection_evicted");
        }

        const conduitIdentity = socketKey(socket);
        state.conduitSockets.add(socket);
        state.conduitConnections.set(code, socket);
        state.conduitSocketToCode.set(conduitIdentity, code);
        state.conduitToMobileMap.set(conduitIdentity, []);
        yield* connLog.info("conduit_open", { conduitCount: state.conduitSockets.size });
      }),
    );

  return { handleConduitClose, handleConduitMessage, handleConduitOpen };
}
