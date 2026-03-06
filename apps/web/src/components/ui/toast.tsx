"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { Toaster, toast as sonnerToast } from "sonner";
import type { ReactNode } from "react";

type ToastTone = "info" | "success" | "error";

type ToastInput = {
  readonly message: string;
  readonly tone?: ToastTone;
  readonly durationMs?: number;
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
  const showToast = useCallback(
    (input: ToastInput) => {
      const normalizedMessage = input.message.trim();
      if (!normalizedMessage) return;
      const tone = input.tone ?? "info";
      const durationMs = input.durationMs ?? DEFAULT_DURATION_MS;
      const className = [
        "rounded-[10px] border px-[12px] py-[10px] text-[11px] font-[700] shadow-[0_10px_24px_rgba(0,0,0,0.15)]",
        toastToneClassName(tone),
      ].join(" ");

      sonnerToast(normalizedMessage, {
        duration: durationMs,
        className,
      });
    },
    [],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
    }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster
        position="bottom-center"
        expand={false}
        richColors={false}
        closeButton={false}
        toastOptions={{
          unstyled: true,
          classNames: {
            toast:
              "w-fit max-w-[320px] rounded-[10px] border px-[12px] py-[10px] text-center text-[11px] font-[700] shadow-[0_10px_24px_rgba(0,0,0,0.15)]",
          },
        }}
      />
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
