import { describe, expect, it } from "vitest";

import {
  assertGlobalIdType,
  extractSessionGlobalIdFromPath,
  extractSessionLocalIdFromPath,
  fromGlobalId,
  toGlobalId,
  tryDecodeGlobalId,
  tryDecodeSessionId,
} from "./relay-id";

describe("relay id helpers", () => {
  it("encodes and decodes global id", () => {
    const globalId = toGlobalId("Session", "session-local-id");
    const decoded = fromGlobalId(globalId);

    expect(decoded).toEqual({
      typeName: "Session",
      localId: "session-local-id",
    });
  });

  it("checks expected type and throws when mismatched", () => {
    const friendGlobalId = toGlobalId("Friend", "friend-1");

    expect(assertGlobalIdType(friendGlobalId, "Friend")).toBe("friend-1");
    expect(() => assertGlobalIdType(friendGlobalId, "Session")).toThrow(
      "Expected Session, got Friend",
    );
  });

  it("returns null for invalid global id in safe decoder", () => {
    expect(tryDecodeGlobalId("invalid-base64")).toBeNull();
    expect(tryDecodeSessionId("invalid-base64")).toBeNull();
  });

  it("extracts encoded session global id from path", () => {
    const globalSessionId = toGlobalId("Session", "session-1");
    const encoded = encodeURIComponent(globalSessionId);

    expect(extractSessionGlobalIdFromPath(`/s/${encoded}/detail`)).toBe(globalSessionId);
    expect(extractSessionLocalIdFromPath(`/s/${encoded}/detail`)).toBe("session-1");
  });

  it("returns null when path is not session route", () => {
    expect(extractSessionGlobalIdFromPath("/sessions")).toBeNull();
    expect(extractSessionLocalIdFromPath("/sessions")).toBeNull();
  });
});
