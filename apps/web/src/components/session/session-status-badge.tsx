import { Badge } from "@/components/ui/badge";

export function SessionStatusBadge({
  status,
}: {
  readonly status: "SCHEDULED" | "CONFIRMED" | "DONE";
}) {
  const tone = status === "CONFIRMED" ? "blueSoft" : "neutral";
  const label = status[0] + status.slice(1).toLowerCase();
  return <Badge tone={tone}>{label}</Badge>;
}
