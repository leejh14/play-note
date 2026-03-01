"use client";

import { useMemo, useState } from "react";
import { useMutation } from "@apollo/client";
import { useRouter } from "next/navigation";
import { PhoneFrame } from "@/components/layout/phone-frame";
import { StatusBar } from "@/components/layout/status-bar";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { CREATE_SESSION_MUTATION } from "@/lib/graphql/operations";
import { getGraphqlErrorMessage } from "@/lib/error-messages";
import { tryDecodeSessionId } from "@/lib/relay-id";
import { saveShareToken, saveToken, setActiveSessionId } from "@/lib/token";
import type { ReactNode } from "react";

function ContentCard({
  label,
  subtitle,
  selected,
  onClick,
}: {
  readonly label: string;
  readonly subtitle: string;
  readonly selected?: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
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
      <div className="text-[13px] font-[700] text-[var(--pn-text-primary)]">{label}</div>
      <div className="text-[11px] font-[500] text-[var(--pn-text-muted)]">{subtitle}</div>
    </button>
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
      <div className="text-[12px] font-[600] text-[var(--pn-text-secondary)]">{label}</div>
      {children}
    </div>
  );
}

function toDateTimeLocalValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

type CreateSessionResponse = {
  readonly createSession: {
    readonly editorToken: string;
    readonly adminToken: string;
    readonly session: {
      readonly id: string;
    } | null;
  };
};

export default function NewSessionPage() {
  const router = useRouter();
  const [contentType, setContentType] = useState<"LOL" | "FUTSAL">("LOL");
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState(() => toDateTimeLocalValue(new Date()));

  const [createSession, { loading, error }] = useMutation<CreateSessionResponse>(
    CREATE_SESSION_MUTATION,
  );

  const canSubmit = useMemo(() => Boolean(startsAt), [startsAt]);

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;
    const response = await createSession({
      variables: {
        input: {
          contentType,
          title: title.trim() || null,
          startsAt: new Date(startsAt).toISOString(),
        },
      },
    });

    const payload = response.data?.createSession;
    const sessionGlobalId = payload?.session?.id;
    if (!payload || !sessionGlobalId) return;

    const localSessionId = tryDecodeSessionId(sessionGlobalId);
    if (!localSessionId) return;

    saveToken(localSessionId, payload.adminToken);
    saveShareToken(localSessionId, payload.editorToken);
    setActiveSessionId(localSessionId);

    router.push(
      `/sessions/new/share-complete?sessionId=${encodeURIComponent(sessionGlobalId)}`,
    );
  };

  return (
    <PhoneFrame>
      <div className="flex min-h-screen flex-col">
        <StatusBar />
        <PageHeader title="New Session" backHref="/sessions" />

        <div className="flex flex-1 flex-col gap-[16px] px-[16px] pt-[10px]">
          <Field label="Content">
            <div className="flex gap-[12px]">
              <ContentCard
                label="LoL"
                subtitle="League of Legends"
                selected={contentType === "LOL"}
                onClick={() => setContentType("LOL")}
              />
              <ContentCard
                label="Futsal"
                subtitle="Football"
                selected={contentType === "FUTSAL"}
                onClick={() => setContentType("FUTSAL")}
              />
            </div>
          </Field>

          <Field label="Session Title">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Saturday Night"
              className="h-[44px] w-full rounded-[12px] border border-[var(--pn-border)] bg-white px-[14px] text-[13px] text-[var(--pn-text-primary)] outline-none"
            />
          </Field>

          <Field label="Date & Time">
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
              className="h-[44px] w-full rounded-[12px] border border-[var(--pn-border)] bg-white px-[14px] text-[13px] text-[var(--pn-text-secondary)] outline-none"
            />
          </Field>

          {error ? (
            <div className="rounded-[10px] bg-[var(--pn-bg-card)] px-[10px] py-[10px] text-[11px] font-[600] text-[var(--pn-text-secondary)]">
              {getGraphqlErrorMessage(error.graphQLErrors[0]?.extensions?.code as string | undefined)}
            </div>
          ) : null}

          <div className="flex flex-1 items-end pb-[24px]">
            <Button
              className="h-[48px] w-full rounded-[12px]"
              disabled={!canSubmit || loading}
              onClick={handleSubmit}
            >
              {loading ? "Creating..." : "Create Session"}
            </Button>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
