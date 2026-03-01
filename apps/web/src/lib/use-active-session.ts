"use client";

import { useCallback, useMemo, useState } from "react";
import {
  clearActiveSessionId,
  getDefaultSessionId,
  getToken,
  listStoredSessionTokens,
  removeToken,
  setActiveSessionId,
  type StoredSessionToken,
} from "@/lib/token";

type ActiveSessionSnapshot = {
  readonly activeSessionId: string | null;
  readonly activeToken: string | null;
  readonly storedSessions: StoredSessionToken[];
};

function readSnapshot(): ActiveSessionSnapshot {
  const storedSessions = listStoredSessionTokens();
  const activeSessionId = getDefaultSessionId();
  const activeToken = activeSessionId ? getToken(activeSessionId) : null;
  return {
    activeSessionId,
    activeToken,
    storedSessions,
  };
}

export function useActiveSession() {
  const [snapshot, setSnapshot] = useState<ActiveSessionSnapshot>(() => readSnapshot());

  const refresh = useCallback(() => {
    setSnapshot(readSnapshot());
  }, []);

  const selectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    setSnapshot(readSnapshot());
  }, []);

  const removeSession = useCallback((sessionId: string) => {
    removeToken(sessionId);
    const nextSessions = listStoredSessionTokens();
    if (nextSessions.length === 0) {
      clearActiveSessionId();
      setSnapshot({
        activeSessionId: null,
        activeToken: null,
        storedSessions: [],
      });
      return;
    }

    const hasCurrent = nextSessions.some((item) => item.sessionId === snapshot.activeSessionId);
    if (!hasCurrent) {
      const fallback = nextSessions[0]?.sessionId;
      if (fallback) {
        setActiveSessionId(fallback);
      }
    }
    setSnapshot(readSnapshot());
  }, [snapshot.activeSessionId]);

  const hasAuth = useMemo(
    () => Boolean(snapshot.activeSessionId && snapshot.activeToken),
    [snapshot.activeSessionId, snapshot.activeToken],
  );

  return {
    activeSessionId: snapshot.activeSessionId,
    activeToken: snapshot.activeToken,
    storedSessions: snapshot.storedSessions,
    hasAuth,
    selectSession,
    removeSession,
    refresh,
  };
}
