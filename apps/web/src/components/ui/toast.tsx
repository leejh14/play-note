"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

type ToastTone = "info" | "success" | "error";

type ToastInput = {
  readonly message: string;
  readonly tone?: ToastTone;
  readonly durationMs?: number;
};

type ToastItem = {
  readonly id: number;
  readonly message: string;
  readonly tone: ToastTone;
};

type ToastContextValue = {
  readonly showToast: (input: ToastInput) => void;
};

const DEFAULT_DURATION_MS = 2600;
const ToastContext = createContext<ToastContextValue | null>(null);

function toastToneClassName(tone: ToastTone): string {
  if (tone === "success") {
    return "border-[var(--pn-primary)] bg-[var(--pn-primary-light)] text-[var(--pn-primary)]";
  }
  if (tone === "error") {
    return "border-[var(--pn-pink)] bg-[var(--pn-pink-soft)] text-[var(--pn-pink)]";
  }
  return "border-[var(--pn-border)] bg-white text-[var(--pn-text-primary)]";
}

export function ToastProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextToastIdRef = useRef(1);
  const timeoutMapRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: number) => {
    const timeoutId = timeoutMapRef.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutMapRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (input: ToastInput) => {
      const normalizedMessage = input.message.trim();
      if (!normalizedMessage) return;

      const id = nextToastIdRef.current;
      nextToastIdRef.current += 1;
      const tone = input.tone ?? "info";
      const durationMs = input.durationMs ?? DEFAULT_DURATION_MS;

      setToasts((prev) => [
        ...prev,
        {
          id,
          message: normalizedMessage,
          tone,
        },
      ]);

      const timeoutId = setTimeout(() => {
        dismissToast(id);
      }, durationMs);
      timeoutMapRef.current.set(id, timeoutId);
    },
    [dismissToast],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
    }),
    [showToast],
  );

  useEffect(() => {
    const timeoutMap = timeoutMapRef.current;
    return () => {
      timeoutMap.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      timeoutMap.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-[20px] z-[100] flex flex-col items-center gap-[8px] px-[16px]">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto max-w-[320px] rounded-[10px] border px-[12px] py-[10px] text-center text-[11px] font-[700] shadow-[0_10px_24px_rgba(0,0,0,0.15)] ${toastToneClassName(toast.tone)}`}
            onClick={() => dismissToast(toast.id)}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
