import path from 'node:path';

export const LOCAL_STORAGE_PREFIX = 'local://';
const DEFAULT_LOCAL_STORAGE_DIRNAME = '.playnote-storage';

export function isLocalStorageKey(key: string): boolean {
  return key.startsWith(LOCAL_STORAGE_PREFIX);
}

export function toLocalStorageKey(key: string): string {
  return `${LOCAL_STORAGE_PREFIX}${normalizeStorageKey(key)}`;
}

export function normalizeStorageKey(key: string): string {
  const candidate = stripLocalStoragePrefix(key).trim();

  if (!candidate || candidate.includes('\0')) {
    throw new Error('Invalid storage key');
  }

  const normalized = path.posix.normalize(candidate).replace(/^\/+/, '');

  if (!normalized || normalized === '.' || normalized.startsWith('../')) {
    throw new Error('Invalid storage key');
  }

  return normalized;
}

export function resolveLocalStorageRoot(rootOverride?: string): string {
  return path.resolve(
    rootOverride?.trim() || path.join(process.cwd(), DEFAULT_LOCAL_STORAGE_DIRNAME),
  );
}

export function resolveLocalStoragePath(
  key: string,
  rootOverride?: string,
): string {
  const root = resolveLocalStorageRoot(rootOverride);
  const normalizedKey = normalizeStorageKey(key);
  const filePath = path.resolve(root, normalizedKey);

  if (!filePath.startsWith(`${root}${path.sep}`)) {
    throw new Error('Resolved storage path escaped the storage root');
  }

  return filePath;
}

export function resolveApiBaseUrl(
  apiBaseUrl: string | undefined,
  apiPort: string | number | undefined,
): string {
  if (apiBaseUrl?.trim()) {
    return apiBaseUrl.replace(/\/+$/, '');
  }

  const port =
    typeof apiPort === 'number'
      ? String(apiPort)
      : apiPort?.trim() || '4000';

  return `http://localhost:${port}`;
}

export function buildLocalUploadUrl(baseUrl: string, key: string): string {
  const params = new URLSearchParams({
    key: toLocalStorageKey(key),
  });

  return `${baseUrl}/storage/upload?${params.toString()}`;
}

export function buildLocalObjectUrl(
  baseUrl: string,
  key: string,
  contentType?: string,
): string {
  const params = new URLSearchParams({
    key: isLocalStorageKey(key) ? key : toLocalStorageKey(key),
  });

  if (contentType?.trim()) {
    params.set('contentType', contentType);
  }

  return `${baseUrl}/storage/object?${params.toString()}`;
}

export function isCredentialsProviderError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === 'CredentialsProviderError' ||
    error.message.includes('Could not load credentials from any providers')
  );
}

function stripLocalStoragePrefix(key: string): string {
  return isLocalStorageKey(key)
    ? key.slice(LOCAL_STORAGE_PREFIX.length)
    : key;
}
