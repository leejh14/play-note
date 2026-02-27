import { Badge } from "@/components/ui/badge";
import type { SessionStatus } from "@/lib/mock-data";

export function SessionStatusBadge({
  status,
}: {
  readonly status: SessionStatus;
}) {
  const tone = status === "Confirmed" ? "blueSoft" : "neutral";
  return <Badge tone={tone}>{status}</Badge>;
}
