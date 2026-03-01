import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  SESSION_STORAGE_CHANGED_EVENT,
  clearActiveSessionId,
  getActiveSessionId,
  getDefaultSessionId,
  getShareToken,
  getToken,
  listStoredSessionTokens,
  removeToken,
  saveShareToken,
  saveToken,
  setActiveSessionId,
} from "./token";

describe("token storage helpers", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it("saves trimmed token and emits storage event", () => {
    let callCount = 0;
    const listener = () => {
      callCount += 1;
    };

    window.addEventListener(SESSION_STORAGE_CHANGED_EVENT, listener);
    saveToken("  session-a ", " token-a  ");
    window.removeEventListener(SESSION_STORAGE_CHANGED_EVENT, listener);

    expect(getToken("session-a")).toBe("token-a");
    expect(localStorage.getItem("playnote:session:session-a:last-used-at")).toBeTruthy();
    expect(callCount).toBe(1);
  });

  it("prefers share token and falls back to session token", () => {
    saveToken("session-a", "token-a");
    expect(getShareToken("session-a")).toBe("token-a");

    saveShareToken("session-a", "share-a");
    expect(getShareToken("session-a")).toBe("share-a");
  });

  it("removes token, share token, timestamp and active session", () => {
    saveToken("session-a", "token-a");
    saveShareToken("session-a", "share-a");
    setActiveSessionId("session-a");

    removeToken("session-a");

    expect(getToken("session-a")).toBeNull();
    expect(getShareToken("session-a")).toBeNull();
    expect(localStorage.getItem("playnote:session:session-a:last-used-at")).toBeNull();
    expect(getActiveSessionId()).toBeNull();
  });

  it("sorts stored sessions by last used timestamp desc", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-01T00:00:00.000Z"));
    saveToken("session-a", "token-a");

    vi.setSystemTime(new Date("2026-03-01T00:00:10.000Z"));
    saveToken("session-b", "token-b");

    const stored = listStoredSessionTokens();

    expect(stored.map((item) => item.sessionId)).toEqual(["session-b", "session-a"]);
    expect(stored[0]?.token).toBe("token-b");
    expect(stored[0]?.lastUsedAt).toBeGreaterThan(stored[1]?.lastUsedAt ?? 0);
  });

  it("returns active session first and falls back to recent token session", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-01T00:00:00.000Z"));
    saveToken("session-a", "token-a");

    vi.setSystemTime(new Date("2026-03-01T00:00:10.000Z"));
    saveToken("session-b", "token-b");

    setActiveSessionId("session-a");
    expect(getDefaultSessionId()).toBe("session-a");

    removeToken("session-a");
    expect(getDefaultSessionId()).toBe("session-b");

    clearActiveSessionId();
    removeToken("session-b");
    expect(getDefaultSessionId()).toBeNull();
  });
});
