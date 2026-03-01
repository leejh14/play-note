const TOKEN_PREFIX = "playnote:session";
const ACTIVE_SESSION_KEY = "playnote:active-session-id";
const LAST_USED_AT_SUFFIX = "last-used-at";

export const SESSION_STORAGE_CHANGED_EVENT = "playnote:session-storage-changed";

export type StoredSessionToken = {
  readonly sessionId: string;
  readonly token: string;
  readonly lastUsedAt: number | null;
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function tokenKey(sessionId: string): string {
  return `${TOKEN_PREFIX}:${sessionId}:token`;
}

function shareTokenKey(sessionId: string): string {
  return `${TOKEN_PREFIX}:${sessionId}:share-token`;
}

function lastUsedAtKey(sessionId: string): string {
  return `${TOKEN_PREFIX}:${sessionId}:${LAST_USED_AT_SUFFIX}`;
}

function emitStorageChanged() {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(SESSION_STORAGE_CHANGED_EVENT));
}

function parseTimestamp(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function setLastUsedAt(sessionId: string, timestamp: number = Date.now()) {
  if (!isBrowser()) return;
  localStorage.setItem(lastUsedAtKey(sessionId), String(timestamp));
}

function getLastUsedAt(sessionId: string): number | null {
  if (!isBrowser()) return null;
  return parseTimestamp(localStorage.getItem(lastUsedAtKey(sessionId)));
}

export function saveToken(sessionId: string, token: string) {
  if (!isBrowser()) return;
  const normalizedSessionId = sessionId.trim();
  const normalizedToken = token.trim();
  if (!normalizedSessionId || !normalizedToken) return;
  localStorage.setItem(tokenKey(normalizedSessionId), normalizedToken);
  setLastUsedAt(normalizedSessionId);
  emitStorageChanged();
}

export function getToken(sessionId: string): string | null {
  if (!isBrowser()) return null;
  const value = localStorage.getItem(tokenKey(sessionId));
  return value?.trim() || null;
}

export function removeToken(sessionId: string) {
  if (!isBrowser()) return;
  const normalizedSessionId = sessionId.trim();
  if (!normalizedSessionId) return;
  localStorage.removeItem(tokenKey(normalizedSessionId));
  localStorage.removeItem(shareTokenKey(normalizedSessionId));
  localStorage.removeItem(lastUsedAtKey(normalizedSessionId));
  if (getActiveSessionId() === normalizedSessionId) {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  }
  emitStorageChanged();
}

export function saveShareToken(sessionId: string, token: string) {
  if (!isBrowser()) return;
  const normalizedSessionId = sessionId.trim();
  const normalizedToken = token.trim();
  if (!normalizedSessionId || !normalizedToken) return;
  localStorage.setItem(shareTokenKey(normalizedSessionId), normalizedToken);
  emitStorageChanged();
}

export function getShareToken(sessionId: string): string | null {
  if (!isBrowser()) return null;
  const value = localStorage.getItem(shareTokenKey(sessionId));
  if (value?.trim()) return value.trim();
  return getToken(sessionId);
}

export function setActiveSessionId(sessionId: string) {
  if (!isBrowser()) return;
  const normalizedSessionId = sessionId.trim();
  if (!normalizedSessionId) return;
  localStorage.setItem(ACTIVE_SESSION_KEY, normalizedSessionId);
  setLastUsedAt(normalizedSessionId);
  emitStorageChanged();
}

export function getActiveSessionId(): string | null {
  if (!isBrowser()) return null;
  const value = localStorage.getItem(ACTIVE_SESSION_KEY);
  return value?.trim() || null;
}

export function clearActiveSessionId() {
  if (!isBrowser()) return;
  localStorage.removeItem(ACTIVE_SESSION_KEY);
  emitStorageChanged();
}

export function listStoredSessionTokens(): StoredSessionToken[] {
  if (!isBrowser()) return [];

  const result: StoredSessionToken[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key) continue;
    if (!key.startsWith(`${TOKEN_PREFIX}:`) || !key.endsWith(":token")) {
      continue;
    }

    const parts = key.split(":");
    const sessionId = parts[2]?.trim();
    const token = localStorage.getItem(key)?.trim();
    if (!sessionId || !token) continue;
    result.push({
      sessionId,
      token,
      lastUsedAt: getLastUsedAt(sessionId),
    });
  }

  return result.sort((left, right) => {
    const leftValue = left.lastUsedAt ?? 0;
    const rightValue = right.lastUsedAt ?? 0;
    if (leftValue !== rightValue) {
      return rightValue - leftValue;
    }
    return left.sessionId.localeCompare(right.sessionId);
  });
}

export function getDefaultSessionId(): string | null {
  const activeSessionId = getActiveSessionId();
  if (activeSessionId && getToken(activeSessionId)) {
    return activeSessionId;
  }

  const stored = listStoredSessionTokens();
  return stored[0]?.sessionId ?? null;
}
