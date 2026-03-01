"use client";

export type UploadProgressStatus = "ready" | "uploading" | "completed" | "failed";

export type UploadProgressItem = {
  readonly id: string;
  readonly fileName: string;
  readonly percent: number;
  readonly status: UploadProgressStatus;
};

function statusLabel(status: UploadProgressStatus): string {
  if (status === "uploading") return "업로드 중";
  if (status === "completed") return "완료";
  if (status === "failed") return "실패";
  return "대기";
}

function statusColor(status: UploadProgressStatus): string {
  if (status === "completed") return "bg-[var(--pn-primary)]";
  if (status === "failed") return "bg-[var(--pn-pink)]";
  return "bg-[var(--pn-text-muted)]";
}

export function UploadProgress({
  items,
}: {
  readonly items: UploadProgressItem[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-[8px] flex flex-col gap-[6px] rounded-[10px] bg-[var(--pn-bg-card)] px-[8px] py-[8px]">
      {items.map((item) => (
        <div key={item.id} className="flex flex-col gap-[4px]">
          <div className="flex items-center justify-between gap-[8px] text-[10px] font-[700] text-[var(--pn-text-secondary)]">
            <span className="truncate">{item.fileName}</span>
            <span>{statusLabel(item.status)}</span>
          </div>
          <div className="h-[6px] w-full overflow-hidden rounded-[999px] bg-white">
            <div
              className={`h-full rounded-[999px] transition-all ${statusColor(item.status)}`}
              style={{ width: `${Math.max(0, Math.min(item.percent, 100))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
