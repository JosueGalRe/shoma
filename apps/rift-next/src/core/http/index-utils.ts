import type { ConduitOpenData } from "./index-types";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

export function readPubkeyFromBody(value: unknown): string | null {
  if (!isRecord(value)) {
    return null;
  }

  const pubkey = value.pubkey;
  if (typeof pubkey !== "string") {
    return null;
  }

  return pubkey;
}

export function readConduitOpenData(value: unknown): ConduitOpenData {
  if (!isRecord(value)) {
    return {};
  }

  const data: ConduitOpenData = {};

  if (isRecord(value.query)) {
    const query: Record<string, string | undefined> = {};
    for (const [key, raw] of Object.entries(value.query)) {
      if (typeof raw === "string") {
        query[key] = raw;
      }
    }

    data.query = query;
  }

  if (isRecord(value.headers)) {
    const headers: Record<string, string | undefined> = {};
    for (const [key, raw] of Object.entries(value.headers)) {
      if (typeof raw === "string") {
        headers[key] = raw;
      }
    }

    data.headers = headers;
  }

  if (value.request instanceof Request) {
    data.request = value.request;
  }

  return data;
}

export function readTokenCode(value: unknown): string | null {
  if (!isRecord(value)) {
    return null;
  }

  if (typeof value.code !== "string") {
    return null;
  }

  return value.code;
}

export function extractConduitAuth(data: ConduitOpenData): { token?: string; publicKey?: string } {
  const query = data.query ?? {};
  const headers = data.headers ?? {};

  let token = query.token;
  let publicKey = query.publicKey ?? query.publickey ?? query["public-key"];

  token = token ?? headers.token;
  publicKey = publicKey ?? headers["public-key"] ?? headers.publickey;

  if ((!token || !publicKey) && data.request?.url) {
    const url = new URL(data.request.url);

    token = token ?? url.searchParams.get("token") ?? undefined;
    publicKey = publicKey
      ?? url.searchParams.get("publicKey")
      ?? url.searchParams.get("publickey")
      ?? url.searchParams.get("public-key")
      ?? undefined;
  }

  return { token, publicKey };
}
