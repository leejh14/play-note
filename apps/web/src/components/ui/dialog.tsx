"use client";

import { Button } from "@/components/ui/button";

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
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-[20px]">
      <div className="w-full max-w-[320px] rounded-[14px] bg-white p-[16px] shadow-[0_10px_24px_rgba(0,0,0,0.2)]">
        <div className="text-[15px] font-[800] text-[var(--pn-text-primary)]">{title}</div>
        <div className="mt-[8px] text-[12px] font-[600] text-[var(--pn-text-secondary)]">
          {description}
        </div>
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
      </div>
    </div>
  );
}
