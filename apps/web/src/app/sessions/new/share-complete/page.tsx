import { ShareCompleteClientPage } from "./share-complete-client";

function normalizeSessionId(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  try {
    return decodeURIComponent(raw).trim() || null;
  } catch {
    return null;
  }
}

export default async function ShareCompletePage({
  searchParams,
}: {
  readonly searchParams?: Promise<{
    readonly sessionId?: string | string[];
  }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  return (
    <ShareCompleteClientPage
      sessionGlobalId={normalizeSessionId(resolvedSearchParams?.sessionId)}
    />
  );
}
