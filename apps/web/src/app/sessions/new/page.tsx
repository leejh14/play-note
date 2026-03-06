"use client";

import { useMemo, useState } from "react";
import { useMutation } from "@apollo/client";
import { useRouter } from "next/navigation";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { PhoneFrame } from "@/components/layout/phone-frame";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CREATE_SESSION_MUTATION } from "@/lib/graphql/operations";
import { getGraphqlErrorMessage } from "@/lib/error-messages";
import { tryDecodeSessionId } from "@/lib/relay-id";
import { saveShareToken, saveToken, setActiveSessionId } from "@/lib/token";
import type { ReactNode } from "react";

function ContentCard({
  value,
  label,
  subtitle,
}: {
  readonly value: "LOL" | "FUTSAL";
  readonly label: string;
  readonly subtitle: string;
}) {
  return (
    <ToggleGroupItem
      value={value}
      className="flex h-auto flex-1 flex-col items-center justify-center gap-[8px] rounded-[14px] border border-[rgba(15,23,42,0.08)] bg-white px-[12px] py-[16px] text-[var(--pn-text-primary)] data-[state=on]:border-[rgba(33,150,243,0.45)] data-[state=on]:bg-[rgba(33,150,243,0.09)] data-[state=off]:bg-white data-[state=off]:text-[var(--pn-text-primary)]"
    >
      <div className="flex h-[28px] w-[28px] items-center justify-center rounded-[8px] bg-[var(--pn-bg-card)]" />
      <div className="text-[13px] font-[700] text-[var(--pn-text-primary)]">{label}</div>
      <div className="text-[11px] font-[500] text-[var(--pn-text-muted)]">{subtitle}</div>
    </ToggleGroupItem>
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
      <div className="flex min-h-screen w-full">
        <BottomTabBar mode="side" />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <div className="mx-auto flex w-full max-w-[1040px] flex-1 flex-col">
            <PageHeader title="New Session" backHref="/sessions" />

            <div className="flex flex-1 flex-col gap-[16px] px-[16px] pt-[12px] sm:px-[20px] lg:px-[28px]">
              <Field label="Content">
                <ToggleGroup
                  type="single"
                  value={contentType}
                  onValueChange={(nextValue) => {
                    if (nextValue === "LOL" || nextValue === "FUTSAL") {
                      setContentType(nextValue);
                    }
                  }}
                  className="flex gap-[12px]"
                >
                  <ContentCard
                    value="LOL"
                    label="LoL"
                    subtitle="League of Legends"
                  />
                  <ContentCard
                    value="FUTSAL"
                    label="Futsal"
                    subtitle="Football"
                  />
                </ToggleGroup>
              </Field>

              <Field label="Session Title">
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Saturday Night"
                  className="h-[44px] rounded-[12px] px-[14px] text-[13px]"
                />
              </Field>

              <Field label="Date & Time">
                <Input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(event) => setStartsAt(event.target.value)}
                  className="h-[44px] rounded-[12px] px-[14px] text-[13px] text-[var(--pn-text-secondary)]"
                />
              </Field>

              {error ? (
                <div className="rounded-[12px] border border-[rgba(15,23,42,0.06)] bg-[rgba(15,23,42,0.03)] px-[12px] py-[10px] text-[11px] font-[600] text-[var(--pn-text-secondary)]">
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
          <BottomTabBar mode="bottom" />
        </div>
      </div>
    </PhoneFrame>
  );
}
