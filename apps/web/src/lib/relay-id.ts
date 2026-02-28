const SESSION_PATH_PREFIX = "/s/";

function encodeBase64(value: string): string {
  if (typeof window !== "undefined") {
    return window.btoa(value);
  }
  return Buffer.from(value, "utf-8").toString("base64");
}

function decodeBase64(value: string): string {
  if (typeof window !== "undefined") {
    return window.atob(value);
  }
  return Buffer.from(value, "base64").toString("utf-8");
}

export function toGlobalId(typeName: string, localId: string): string {
  return encodeBase64(`${typeName}:${localId}`);
}

export function fromGlobalId(globalId: string): {
  readonly typeName: string;
  readonly localId: string;
} {
  const decoded = decodeBase64(globalId);
  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex < 1) {
    throw new Error(`Invalid global ID format: ${globalId}`);
  }
  return {
    typeName: decoded.slice(0, separatorIndex),
    localId: decoded.slice(separatorIndex + 1),
  };
}

export function assertGlobalIdType(globalId: string, expectedType: string): string {
  const { typeName, localId } = fromGlobalId(globalId);
  if (typeName !== expectedType) {
    throw new Error(`Expected ${expectedType}, got ${typeName}`);
  }
  return localId;
}

export function tryDecodeGlobalId(globalId?: string | null): {
  readonly typeName: string;
  readonly localId: string;
} | null {
  if (!globalId) return null;
  try {
    return fromGlobalId(globalId);
  } catch {
    return null;
  }
}

export function tryDecodeSessionId(globalSessionId?: string | null): string | null {
  if (!globalSessionId) return null;
  try {
    return assertGlobalIdType(globalSessionId, "Session");
  } catch {
    return null;
  }
}

export function extractSessionGlobalIdFromPath(pathname: string): string | null {
  if (!pathname.startsWith(SESSION_PATH_PREFIX)) {
    return null;
  }

  const segment = pathname
    .slice(SESSION_PATH_PREFIX.length)
    .split("/")
    .filter(Boolean)[0];
  if (!segment) return null;

  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export function extractSessionLocalIdFromPath(pathname: string): string | null {
  const globalId = extractSessionGlobalIdFromPath(pathname);
  return tryDecodeSessionId(globalId);
}
