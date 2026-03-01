"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import type { StoredSessionToken } from "@/lib/token";

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
          <option key={item.sessionId} value={item.sessionId}>
            {item.sessionId}
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
