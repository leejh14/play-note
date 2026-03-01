"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
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
    <div className="mt-[8px] flex items-center gap-[8px] rounded-[10px] bg-[var(--pn-bg-card)] px-[10px] py-[8px]">
      <span className="text-[10px] font-[700] text-[var(--pn-text-muted)]">Session</span>
      <select
        value={selectedSessionId}
        onChange={(event) => onSelect(event.target.value)}
        className="h-[28px] flex-1 rounded-[8px] border border-[var(--pn-border)] bg-white px-[8px] text-[10px] font-[700] text-[var(--pn-text-secondary)] outline-none"
      >
        {sessions.map((item) => (
          <option key={item.sessionId} value={item.sessionId} title={item.sessionId}>
            {formatSessionOptionLabel(item)}
          </option>
        ))}
      </select>
      <Button
        variant="ghost"
        className="h-[28px] rounded-[8px] px-[8px] text-[10px]"
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
