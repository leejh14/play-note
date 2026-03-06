"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { StoredSessionToken } from "@/lib/token";

function formatSessionOptionLabel(session: StoredSessionToken): string {
  const shortSessionId =
    session.sessionId.length > 16
      ? `${session.sessionId.slice(0, 8)}…${session.sessionId.slice(-6)}`
      : session.sessionId;

  if (!session.lastUsedAt) {
    return shortSessionId;
  }

  const recentLabel = new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(session.lastUsedAt));
  return `${shortSessionId} · ${recentLabel}`;
}

export function SessionContextSwitcher({
  activeSessionId,
  sessions,
  onSelect,
  onRemove,
}: {
  readonly activeSessionId: string | null;
  readonly sessions: StoredSessionToken[];
  readonly onSelect: (sessionId: string) => void;
  readonly onRemove: (sessionId: string) => void;
}) {
  const selectedSessionId = useMemo(
    () => activeSessionId ?? sessions[0]?.sessionId ?? "",
    [activeSessionId, sessions],
  );

  if (sessions.length === 0) {
    return null;
  }

  return (
    <div className="mt-[10px] flex items-center gap-[8px] rounded-[12px] border border-[rgba(15,23,42,0.06)] bg-[rgba(15,23,42,0.03)] px-[10px] py-[8px]">
      <span className="text-[11px] font-[700] text-[var(--pn-text-secondary)]">Session</span>
      <Select
        value={selectedSessionId}
        onChange={(event) => onSelect(event.target.value)}
        className="flex-1"
      >
        {sessions.map((item) => (
          <option key={item.sessionId} value={item.sessionId} title={item.sessionId}>
            {formatSessionOptionLabel(item)}
          </option>
        ))}
      </Select>
      <Button
        variant="ghost"
        className="h-[32px] rounded-[10px] px-[10px] text-[11px]"
        onClick={() => {
          if (selectedSessionId) {
            onRemove(selectedSessionId);
          }
        }}
      >
        Remove
      </Button>
    </div>
  );
}
