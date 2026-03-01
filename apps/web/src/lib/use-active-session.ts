"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  clearActiveSessionId,
  getActiveSessionId,
  getDefaultSessionId,
  getToken,
  listStoredSessionTokens,
  removeToken,
  SESSION_STORAGE_CHANGED_EVENT,
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorageChanged = () => refresh();
    window.addEventListener("storage", onStorageChanged);
    window.addEventListener(SESSION_STORAGE_CHANGED_EVENT, onStorageChanged);
    return () => {
      window.removeEventListener("storage", onStorageChanged);
      window.removeEventListener(SESSION_STORAGE_CHANGED_EVENT, onStorageChanged);
    };
  }, [refresh]);

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
    if (!getActiveSessionId()) {
      const fallbackSessionId = nextSessions[0]?.sessionId;
      if (fallbackSessionId) {
        setActiveSessionId(fallbackSessionId);
      }
    }
    setSnapshot(readSnapshot());
  }, []);

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
