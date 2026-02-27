import { PhoneFrame } from "@/components/layout/phone-frame";
import { StatusBar } from "@/components/layout/status-bar";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

function ContentCard({
  label,
  subtitle,
  selected,
}: {
  readonly label: string;
  readonly subtitle: string;
  readonly selected?: boolean;
}) {
  return (
    <div
      className={`flex flex-1 flex-col items-center justify-center gap-[8px] rounded-[12px] border px-[12px] py-[16px] ${
        selected
          ? "border-[var(--pn-primary)] bg-[rgba(33,150,243,0.06)]"
          : "border-[var(--pn-border)] bg-white"
      }`}
    >
      <div
        className={`flex h-[28px] w-[28px] items-center justify-center rounded-[8px] ${
          selected ? "bg-[var(--pn-primary-light)]" : "bg-[var(--pn-bg-card)]"
        }`}
      />
      <div className="text-[13px] font-[700] text-[var(--pn-text-primary)]">
        {label}
      </div>
      <div className="text-[11px] font-[500] text-[var(--pn-text-muted)]">
        {subtitle}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[8px]">
      <div className="text-[12px] font-[600] text-[var(--pn-text-secondary)]">
        {label}
      </div>
      {children}
    </div>
  );
}

export default function NewSessionPage() {
  return (
    <PhoneFrame>
      <div className="flex min-h-screen flex-col">
        <StatusBar />
        <PageHeader title="New Session" backHref="/sessions" />

        <div className="flex flex-1 flex-col gap-[16px] px-[16px] pt-[10px]">
          <Field label="Content">
            <div className="flex gap-[12px]">
              <ContentCard label="LoL" subtitle="League of Legends" selected />
              <ContentCard label="Futsal" subtitle="Football" />
            </div>
          </Field>

          <Field label="Session Title">
            <div className="flex h-[44px] w-full items-center rounded-[12px] border border-[var(--pn-border)] bg-white px-[14px] text-[13px] text-[var(--pn-text-muted)]">
              e.g. Saturday Night
            </div>
          </Field>

          <Field label="Date & Time">
            <div className="flex gap-[12px]">
              <div className="flex h-[44px] flex-1 items-center gap-[10px] rounded-[12px] border border-[var(--pn-border)] bg-white px-[14px] text-[13px] text-[var(--pn-text-secondary)]">
                <span className="inline-block h-[16px] w-[16px] rounded-[4px] bg-[var(--pn-bg-card)]" />
                Mar 1, 2026
              </div>
              <div className="flex h-[44px] flex-1 items-center gap-[10px] rounded-[12px] border border-[var(--pn-border)] bg-white px-[14px] text-[13px] text-[var(--pn-text-secondary)]">
                <span className="inline-block h-[16px] w-[16px] rounded-[999px] bg-[var(--pn-bg-card)]" />
                7:00 PM
              </div>
            </div>
          </Field>

          <div className="flex flex-1 items-end pb-[24px]">
            <Button className="h-[48px] w-full rounded-[12px]">
              Create Session
            </Button>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
