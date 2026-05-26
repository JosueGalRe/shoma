import { describe, expect, it } from "bun:test";

import {
  decodeCheckQuery,
  decodeConduitAuth,
  decodeRecord,
  decodeRegisterBody,
  decodeRequest,
  decodeTokenCode,
  filterStringRecord,
  MissingConduitAuthError,
  MissingPublicKeyError,
  MissingTokenToCheckError,
  readConduitOpenShape,
  TokenMissingCodeError,
} from "../../src/core/http/http-schemas";

describe("http-schemas", () => {
  it("decodes register bodies and reports missing public keys", () => {
    expect(decodeRegisterBody({ pubkey: "some-key" })).toBe("some-key");

    const invalid = decodeRegisterBody({});
    expect(invalid).toBeInstanceOf(MissingPublicKeyError);
    if (!(invalid instanceof MissingPublicKeyError)) {
      throw new Error("Expected MissingPublicKeyError.");
    }
    expect(invalid._tag).toBe("MissingPublicKeyError");

    expect(decodeRegisterBody(null)).toBeInstanceOf(MissingPublicKeyError);
    expect(decodeRegisterBody({ pubkey: 123 })).toBeInstanceOf(MissingPublicKeyError);
  });

  it("decodes check queries and reports missing tokens", () => {
    expect(decodeCheckQuery({ token: "abc" })).toBe("abc");

    const invalid = decodeCheckQuery({});
    expect(invalid).toBeInstanceOf(MissingTokenToCheckError);
    if (!(invalid instanceof MissingTokenToCheckError)) {
      throw new Error("Expected MissingTokenToCheckError.");
    }
    expect(invalid._tag).toBe("MissingTokenToCheckError");

    expect(decodeCheckQuery(null)).toBeInstanceOf(MissingTokenToCheckError);
  });

  it("decodes conduit auth objects and reports missing auth data", () => {
    expect(decodeConduitAuth({ publicKey: "key", token: "abc" })).toEqual({
      publicKey: "key",
      token: "abc",
    });

    const invalid = decodeConduitAuth({ token: "abc" });
    expect(invalid).toBeInstanceOf(MissingConduitAuthError);
    if (!(invalid instanceof MissingConduitAuthError)) {
      throw new Error("Expected MissingConduitAuthError.");
    }
    expect(invalid._tag).toBe("MissingConduitAuthError");

    expect(decodeConduitAuth({ publicKey: "key" })).toBeInstanceOf(MissingConduitAuthError);
  });

  it("decodes token codes and reports missing codes", () => {
    expect(decodeTokenCode({ code: "123456" })).toBe("123456");

    const invalid = decodeTokenCode({});
    expect(invalid).toBeInstanceOf(TokenMissingCodeError);
    if (!(invalid instanceof TokenMissingCodeError)) {
      throw new Error("Expected TokenMissingCodeError.");
    }
    expect(invalid._tag).toBe("TokenMissingCodeError");

    expect(decodeTokenCode({ code: 123_456 })).toBeInstanceOf(TokenMissingCodeError);
  });

  it("returns records only for object inputs", () => {
    expect(decodeRecord({ any: "thing" })).toEqual({ any: "thing" });
    expect(decodeRecord({ nested: { ok: true } })).toEqual({ nested: { ok: true } });
    expect(decodeRecord(null)).toBeNull();
    expect(decodeRecord("nope")).toBeNull();
  });

  it("returns the request only for Request instances", () => {
    const request = new Request("http://test");

    expect(decodeRequest(request)).toBe(request);
    expect(decodeRequest({})).toBeNull();
    expect(decodeRequest("nope")).toBeNull();
  });

  it("filters string records", () => {
    expect(
      filterStringRecord({
        a: "one",
        b: 2,
        c: undefined,
        d: "two",
        e: false,
      }),
    ).toEqual({ a: "one", d: "two" });

    expect(filterStringRecord(null)).toBeNull();
  });

  it("reads conduit open shapes from nested objects", () => {
    const request = new Request("http://test");

    expect(
      readConduitOpenShape({
        headers: { authorization: "Bearer token", other: undefined },
        query: { code: "111111", ignored: 123 },
        request,
      }),
    ).toEqual({
      headers: { authorization: "Bearer token" },
      query: { code: "111111" },
      request,
    });

    expect(readConduitOpenShape("nope")).toEqual({});
  });
});
