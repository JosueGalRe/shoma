export function bufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...Array.from(new Uint8Array(buffer))));
}

export function base64ToBuffer(value: string): ArrayBuffer {
  const decoded = atob(value);
  const bytes = new Uint8Array(decoded.length);

  for (let index = 0; index < decoded.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index);
  }

  return bytes.buffer;
}

export function utf8ToBuffer(value: string): ArrayBuffer {
  return new TextEncoder().encode(value).buffer;
}

export function bufferToUtf8(buffer: ArrayBuffer): string {
  return new TextDecoder("utf-8").decode(new Uint8Array(buffer));
}

export function parseFrame(raw: unknown): [number, ...unknown[]] | null {
  if (typeof raw !== "string") {
    return null;
  }

  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || typeof parsed[0] !== "number") {
    return null;
  }

  return parsed as [number, ...unknown[]];
}
