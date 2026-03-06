"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "확인",
  cancelText = "취소",
  loading = false,
  onConfirm,
  onCancel,
}: {
  readonly open: boolean;
  readonly title: string;
  readonly description: string;
  readonly confirmText?: string;
  readonly cancelText?: string;
  readonly loading?: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}) {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !loading) onCancel();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/45 data-[state=open]:animate-in data-[state=closed]:animate-out" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100%-40px)] max-w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-[16px] border border-[rgba(15,23,42,0.08)] bg-white p-[16px] shadow-[0_16px_40px_rgba(0,0,0,0.25)]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
          )}
        >
          <DialogPrimitive.Title className="text-[15px] font-[800] text-[var(--pn-text-primary)]">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-[8px] text-[12px] font-[600] leading-[1.5] text-[var(--pn-text-secondary)]">
            {description}
          </DialogPrimitive.Description>
          <div className="mt-[14px] flex justify-end gap-[8px]">
            <Button
              variant="ghost"
              className="h-[34px] rounded-[8px] px-[10px] text-[11px]"
              onClick={onCancel}
              disabled={loading}
            >
              {cancelText}
            </Button>
            <Button
              className="h-[34px] rounded-[8px] px-[10px] text-[11px]"
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? "처리 중..." : confirmText}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

export const DialogOverlay = ({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Overlay>) => (
  <DialogPrimitive.Overlay
    className={cn("fixed inset-0 z-50 bg-black/45", className)}
    {...props}
  />
);

export const DialogContent = ({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content>) => (
  <DialogPrimitive.Portal>
    <DialogOverlay />
    <DialogPrimitive.Content
      className={cn(
        "fixed left-1/2 top-1/2 z-50 w-[calc(100%-40px)] max-w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-[16px] border border-[rgba(15,23,42,0.08)] bg-white p-[16px] shadow-[0_16px_40px_rgba(0,0,0,0.25)]",
        className,
      )}
      {...props}
    />
  </DialogPrimitive.Portal>
);

export const DialogHeader = ({
  className,
  ...props
}: ComponentProps<"div">) => (
  <div className={cn("flex flex-col gap-[4px]", className)} {...props} />
);

export const DialogFooter = ({
  className,
  ...props
}: ComponentProps<"div">) => (
  <div
    className={cn("mt-[14px] flex items-center justify-end gap-[8px]", className)}
    {...props}
  />
);

export const DialogTitle = ({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Title>) => (
  <DialogPrimitive.Title
    className={cn("text-[15px] font-[800] text-[var(--pn-text-primary)]", className)}
    {...props}
  />
);

export const DialogDescription = ({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) => (
  <DialogPrimitive.Description
    className={cn(
      "text-[12px] font-[600] leading-[1.5] text-[var(--pn-text-secondary)]",
      className,
    )}
    {...props}
  />
);
