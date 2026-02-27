const TOKEN_PREFIX = "playnote:session";

export function saveToken(sessionId: string, token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${TOKEN_PREFIX}:${sessionId}:token`, token);
}

export function getToken(sessionId: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`${TOKEN_PREFIX}:${sessionId}:token`);
}

export function removeToken(sessionId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${TOKEN_PREFIX}:${sessionId}:token`);
}
