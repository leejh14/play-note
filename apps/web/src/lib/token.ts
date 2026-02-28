const TOKEN_PREFIX = "playnote:session";
const ACTIVE_SESSION_KEY = "playnote:active-session-id";

export type StoredSessionToken = {
  readonly sessionId: string;
  readonly token: string;
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

export function saveToken(sessionId: string, token: string) {
  if (!isBrowser()) return;
  const normalizedSessionId = sessionId.trim();
  const normalizedToken = token.trim();
  if (!normalizedSessionId || !normalizedToken) return;
  localStorage.setItem(tokenKey(normalizedSessionId), normalizedToken);
}

export function getToken(sessionId: string): string | null {
  if (!isBrowser()) return null;
  const value = localStorage.getItem(tokenKey(sessionId));
  return value?.trim() || null;
}

export function removeToken(sessionId: string) {
  if (!isBrowser()) return;
  localStorage.removeItem(tokenKey(sessionId));
  localStorage.removeItem(shareTokenKey(sessionId));
}

export function saveShareToken(sessionId: string, token: string) {
  if (!isBrowser()) return;
  const normalizedSessionId = sessionId.trim();
  const normalizedToken = token.trim();
  if (!normalizedSessionId || !normalizedToken) return;
  localStorage.setItem(shareTokenKey(normalizedSessionId), normalizedToken);
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
}

export function getActiveSessionId(): string | null {
  if (!isBrowser()) return null;
  const value = localStorage.getItem(ACTIVE_SESSION_KEY);
  return value?.trim() || null;
}

export function clearActiveSessionId() {
  if (!isBrowser()) return;
  localStorage.removeItem(ACTIVE_SESSION_KEY);
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
    result.push({ sessionId, token });
  }

  return result;
}

export function getDefaultSessionId(): string | null {
  const activeSessionId = getActiveSessionId();
  if (activeSessionId && getToken(activeSessionId)) {
    return activeSessionId;
  }

  const stored = listStoredSessionTokens();
  return stored[0]?.sessionId ?? null;
}
