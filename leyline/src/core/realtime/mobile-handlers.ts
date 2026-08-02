import { RelayErrorCode, RelayOpcode } from "@shoma/protocol-contract";
import { Effect, Result } from "effect";

import {
  closeWithError,
  encodeCloseFrame,
  encodeConnectPubkeyFrame,
  encodeMsgFrame,
  encodeOpenFrame,
  frameErrorReason,
} from "./realtime-frame-utils";
import { parseFrame, socketKey } from "./realtime-utils";

import type { ConduitRecord, RealtimeHandlerContext, RealtimeSocket } from "./realtime-types";

export function makeMobileHandlers({ deps, log, serviceEffect, state }: RealtimeHandlerContext) {
  const handleMobileClose = (socket: RealtimeSocket) =>
    serviceEffect(
      Effect.gen(function* handleMobileClose() {
        state.mobileSockets.delete(socket);

        const mobileIdentity = socketKey(socket);
        const peer = state.mobileToConduitMap.get(mobileIdentity);
        if (!peer) {
          yield* log.debug("mobile_close_no_peer", { mobileCount: state.mobileSockets.size });
          return;
        }

        state.mobileToConduitMap.delete(mobileIdentity);

        const conduitPeers = state.conduitToMobileMap.get(socketKey(peer.conduitSocket));
        if (conduitPeers) {
          const index = conduitPeers.findIndex((entry) => entry.uuid === peer.uuid);
          if (index !== -1) {
            conduitPeers.splice(index, 1);
          }
        }

        yield* Effect.sync(() => {
          peer.conduitSocket.send(encodeCloseFrame([RelayOpcode.CLOSE, peer.uuid]));
        });
        const peerLog = log.child({ peerId: peer.uuid });
        yield* peerLog.info("mobile_close", {
          mobileCount: state.mobileSockets.size,
        });
      }),
    );

  const handleMobileMessage = (socket: RealtimeSocket, rawMessage: unknown) =>
    serviceEffect(
      Effect.gen(function* handleMobileMessage() {
        const frameResult = yield* Effect.result(parseFrame(rawMessage));

        if (Result.isFailure(frameResult)) {
          yield* log.warn("mobile_message_error", {
            reason: frameErrorReason(frameResult.failure),
          });
          yield* closeWithError(socket, RelayErrorCode.MALFORMED_MESSAGE);
          return;
        }

        const frame = frameResult.success;

        const [op, ...args] = frame;
        if (op === RelayOpcode.CONNECT) {
          const mobileIdentity = socketKey(socket);
          if (state.mobileToConduitMap.has(mobileIdentity)) {
            yield* log.warn("mobile_connect_duplicate_session");
            yield* closeWithError(socket, RelayErrorCode.MALFORMED_MESSAGE);
            return;
          }

          const [code] = args;
          if (typeof code !== "string") {
            yield* log.warn("mobile_message_error", { reason: "Mobile sent invalid code." });
            yield* closeWithError(socket, RelayErrorCode.MALFORMED_MESSAGE);
            return;
          }

          const entry = yield* deps.lookup(code);
          const conduit = state.conduitConnections.get(code);
          const connLog = log.child({ code });

          if (!entry) {
            yield* closeWithError(socket, RelayErrorCode.INVALID_CODE);
            yield* connLog.info("mobile_connect_invalid_code");
            return;
          }

          if (!conduit) {
            yield* closeWithError(socket, RelayErrorCode.RELAY_UNREACHABLE);
            yield* connLog.info("mobile_connect_no_conduit");
            return;
          }

          const uuid = deps.createConnectionId();
          const peer: ConduitRecord = { conduitSocket: conduit, socket, uuid };
          const conduitIdentity = socketKey(conduit);
          const conduitPeers = state.conduitToMobileMap.get(conduitIdentity);

          if (conduitPeers) {
            conduitPeers.push(peer);
          } else {
            state.conduitToMobileMap.set(conduitIdentity, [peer]);
          }

          state.mobileToConduitMap.set(mobileIdentity, peer);
          yield* Effect.sync(() => {
            conduit.send(encodeOpenFrame([RelayOpcode.OPEN, uuid]));
            socket.send(encodeConnectPubkeyFrame([RelayOpcode.CONNECT_PUBKEY, entry.public_key]));
          });
          yield* connLog.child({ peerId: uuid }).info("mobile_connect_attached");
          return;
        }

        if (op === RelayOpcode.SEND) {
          const peer = state.mobileToConduitMap.get(socketKey(socket));
          if (!peer) {
            yield* log.warn("mobile_send_without_peer");
            yield* closeWithError(socket, RelayErrorCode.RELAY_UNREACHABLE);
            return;
          }

          yield* Effect.sync(() => {
            peer.conduitSocket.send(encodeMsgFrame([RelayOpcode.MSG, peer.uuid, args[0]]));
          });
          return;
        }

        yield* log.warn("mobile_message_error", { reason: "Mobile sent invalid opcode." });
        yield* closeWithError(socket, RelayErrorCode.MALFORMED_MESSAGE);
      }),
    );

  const handleMobileOpen = (socket: RealtimeSocket) =>
    serviceEffect(
      Effect.gen(function* handleMobileOpen() {
        state.mobileSockets.add(socket);
        yield* log.debug("mobile_open", { mobileCount: state.mobileSockets.size });
      }),
    );

  return { handleMobileClose, handleMobileMessage, handleMobileOpen };
}
