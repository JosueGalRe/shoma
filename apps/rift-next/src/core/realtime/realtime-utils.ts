import type { RealtimeSocket, RiftFrame } from "./realtime-types";

function isRiftFrame(value: unknown): value is RiftFrame {
  return Array.isArray(value) && typeof value[0] === "number";
}

export function parseFrame(rawMessage: unknown): RiftFrame {
  if (isRiftFrame(rawMessage)) {
    return rawMessage;
  }

  if (typeof rawMessage === "string") {
    const parsed: unknown = JSON.parse(rawMessage);
    if (isRiftFrame(parsed)) {
      return parsed;
    }

    throw new Error("Invalid websocket frame payload.");
  }

  if (rawMessage instanceof Uint8Array) {
    const decoded = new TextDecoder().decode(rawMessage);
    const parsed: unknown = JSON.parse(decoded);
    if (isRiftFrame(parsed)) {
      return parsed;
    }

    throw new Error("Invalid websocket frame payload.");
  }

  throw new Error("Invalid websocket frame format.");
}

export function socketKey(socket: RealtimeSocket): object {
  return socket.raw ?? socket;
}
